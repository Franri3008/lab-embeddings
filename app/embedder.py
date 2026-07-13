import datetime
import os

import requests

from .config import get_config

_ENDPOINT = "https://openrouter.ai/api/v1/embeddings"
_TIMEOUT = 60

_CACHE_MAX = 4000
_cache = {}
_session_cost = 0.0

def _cache_put(key, vec):
    while len(_cache) >= _CACHE_MAX:
        del _cache[next(iter(_cache))]
    _cache[key] = vec

_DAILY_CAP = float(os.environ.get("DAILY_EMBED_CAP_USD", "0") or 0)
_day = None
_day_cost = 0.0

def _check_daily_cap(pending_cost=0.0):
    global _day, _day_cost
    today = datetime.datetime.now(datetime.timezone.utc).date()
    if today != _day:
        _day, _day_cost = today, 0.0
    if _DAILY_CAP and _day_cost >= _DAILY_CAP:
        raise EmbeddingError(
            "Daily embedding budget reached (insufficient funds for now)"
        )

class EmbeddingError(Exception):
    pass;

def session_cost():
    return _session_cost

def resolve_model(model=None):
    chosen = (model or "").strip()
    return chosen or get_config()["embedding_model"]

def embed(texts, model=None):
    global _session_cost
    if not texts:
        return []

    cfg = get_config()
    model = resolve_model(model)

    missing = list(dict.fromkeys(t for t in texts if (model, t) not in _cache))

    if missing:
        vectors, cost = _request(missing, cfg, model)
        for text, vec in zip(missing, vectors):
            _cache_put((model, text), vec)
        _session_cost += cost

    return [_cache[(model, t)] for t in texts]

def embed_stream(texts, model=None):
    global _session_cost
    if not texts:
        yield {"type": "progress", "done": 0, "total": 0}
        yield {"type": "vectors", "vectors": []}
        return

    cfg = get_config()
    model = resolve_model(model)

    missing = list(dict.fromkeys(t for t in texts if (model, t) not in _cache))
    total = len(missing)
    yield {"type": "progress", "done": 0, "total": total}

    if total:
        chunk_size = max(1, (total + 19) // 20)
        done = 0
        for i in range(0, total, chunk_size):
            chunk = missing[i:i + chunk_size]
            vectors, cost = _request(chunk, cfg, model)
            for text, vec in zip(chunk, vectors):
                _cache_put((model, text), vec)
            _session_cost += cost
            done += len(chunk)
            yield {"type": "progress", "done": done, "total": total}

    yield {"type": "vectors", "vectors": [_cache[(model, t)] for t in texts]}

def _request(inputs, cfg, model):
    global _day_cost
    _check_daily_cap()
    headers = {
        "Authorization": f"Bearer {cfg['openrouter_api_key']}",
        "Content-Type": "application/json",
    }
    payload = {"model": model, "input": inputs}

    try:
        resp = requests.post(_ENDPOINT, headers=headers, json=payload, timeout=_TIMEOUT)
    except requests.RequestException as exc:
        raise EmbeddingError(f"Could not reach OpenRouter: {exc}") from exc

    if resp.status_code != 200:
        raise EmbeddingError(
            f"OpenRouter returned {resp.status_code}: {resp.text[:300]}"
        )

    try:
        body = resp.json()
        data = body["data"]
    except (ValueError, KeyError) as exc:
        raise EmbeddingError(f"Unexpected response from OpenRouter: {exc}") from exc

    ordered = sorted(data, key=lambda item: item.get("index", 0))
    vectors = [item["embedding"] for item in ordered]

    cost = float((body.get("usage") or {}).get("cost") or 0.0)
    _day_cost += cost
    return vectors, cost
