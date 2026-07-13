import json
import os

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_CONFIG_PATH = os.path.join(_ROOT, "config.json")

_cache = None

class ConfigError(Exception):
    pass;

def get_config():
    global _cache
    if _cache is not None:
        return _cache

    data = {
        "openrouter_api_key": os.environ.get("OPENROUTER_API_KEY", ""),
        "embedding_model": os.environ.get("EMBEDDING_MODEL", ""),
    }

    if os.path.exists(_CONFIG_PATH):
        try:
            with open(_CONFIG_PATH, "r", encoding="utf-8") as fh:
                file_data = json.load(fh)
        except json.JSONDecodeError as exc:
            raise ConfigError(f"config.json is not valid JSON: {exc}") from exc
        for k in data:
            if not data[k]:
                data[k] = file_data.get(k, "")
    elif not any(data.values()):
        raise ConfigError(
            "No config found. Set OPENROUTER_API_KEY (and EMBEDDING_MODEL) env "
            "vars, or copy config.example.json to config.json."
        )

    key = (data.get("openrouter_api_key") or "").strip()
    if not key:
        raise ConfigError(
            "openrouter_api_key is empty in config.json. Add your OpenRouter key."
        )

    model = (data.get("embedding_model") or "").strip()
    if not model:
        raise ConfigError("embedding_model is empty in config.json.")

    _cache = {"openrouter_api_key": key, "embedding_model": model}
    return _cache
