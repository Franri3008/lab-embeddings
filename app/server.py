import json
import os
import time

from flask import Flask, Response, jsonify, request, send_from_directory

from .config import ConfigError, get_config
from .embedder import EmbeddingError, embed_stream, resolve_model, session_cost
from .models import available_models
from .observations import list_observations, observation_dir
from .reducer import reduce
from .similarity import cosine_matrix, l2_normalize
from .words import pick_random

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_STATIC = os.path.join(_ROOT, "static")

app = Flask(__name__, static_folder=None)

_RATE_MAX = int(os.environ.get("EMBED_RATE_MAX", "20"))
_RATE_WINDOW = int(os.environ.get("EMBED_RATE_WINDOW", "60"))
_hits = {}

def _client_ip():
    fwd = request.headers.get("X-Forwarded-For", "")
    return fwd.split(",")[-1].strip() if fwd else (request.remote_addr or "?")

def _rate_limited():
    now = time.time()
    ip = _client_ip()
    start, count = _hits.get(ip, (now, 0))
    if now - start >= _RATE_WINDOW:
        start, count = now, 0
    count += 1
    _hits[ip] = (start, count)
    return count > _RATE_MAX

@app.route("/")
def index():
    return send_from_directory(_STATIC, "index.html")

@app.route("/static/<path:filename>")
def static_files(filename):
    return send_from_directory(_STATIC, filename)

@app.route("/cost")
def cost_route():
    return jsonify({"session_cost": session_cost()})

@app.route("/models")
def models_route():
    try:
        default = get_config()["embedding_model"]
    except ConfigError:
        default = None
    models = available_models(default)
    if default is None and models:
        default = models[0]["id"]
    return jsonify({"models": models, "default": default})

@app.route("/random")
def random_route():
    exclude = [w for w in request.args.get("exclude", "").split(",") if w]
    return jsonify({"word": pick_random(exclude)})

@app.route("/observations")
def observations_route():
    return jsonify({"observations": list_observations()})

@app.route("/observations/<obs_id>/<path:filename>")
def observation_file(obs_id, filename):
    folder = observation_dir(obs_id)
    if folder is None:
        return jsonify({"error": "unknown observation"}), 404
    return send_from_directory(folder, filename)

@app.route("/embed", methods=["POST"])
def embed_route():
    if _rate_limited():
        return jsonify({"error": "Too many requests, slow down a moment!"}), 429

    body = request.get_json(silent=True) or {}

    raw_words = body.get("words", [])
    raw_groups = body.get("groups", [])
    dimensions = body.get("dimensions", 2)
    method = str(body.get("method", "umap")).lower()
    normalize = bool(body.get("normalize", False))
    model = (str(body.get("model") or "")).strip() or None

    labels, groups = [], []
    for i, w in enumerate(raw_words):
        if isinstance(w, str) and w.strip():
            labels.append(w.strip())
            g = raw_groups[i] if i < len(raw_groups) else "user"
            groups.append("random" if g == "random" else "user")

    if not labels:
        return jsonify({"error": "Add at least one word before embedding."}), 400
    if len(labels) > 50:
        return jsonify({"error": "Too many words! max 50 per request."}), 400
    if any(len(w) > 200 for w in labels):
        return jsonify({"error": "Words must be under 200 characters."}), 400
    if dimensions not in (2, 3, 4):
        return jsonify({"error": "dimensions must be 2, 3 or 4."}), 400
    if method not in ("umap", "pca"):
        return jsonify({"error": "method must be 'umap' or 'pca'."}), 400

    def sse(obj):
        return f"data: {json.dumps(obj)}\n\n"

    def generate():
        try:
            vectors = None
            for ev in embed_stream(labels, model=model):
                if ev["type"] == "progress":
                    yield sse({"progress": {"done": ev["done"], "total": ev["total"]}})
                else:
                    vectors = ev["vectors"]

            similarity = cosine_matrix(vectors)
            reduce_input = l2_normalize(vectors) if normalize else vectors
            coords, note = reduce(reduce_input, dimensions, method)

            points = [
                {"label": label, "coords": coord, "group": group}
                for label, coord, group in zip(labels, coords, groups)
            ]
            yield sse({"result": {
                "points": points,
                "dimensions": dimensions,
                "method": method,
                "model": resolve_model(model),
                "normalized": normalize,
                "note": note,
                "labels": labels,
                "similarity": similarity,
                "session_cost": session_cost(),
            }})
        except (ConfigError, EmbeddingError) as exc:
            yield sse({"error": str(exc)})
        except Exception as exc:
            yield sse({"error": f"Unexpected error: {exc}"})

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
