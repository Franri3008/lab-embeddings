import json
import os

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OBS_DIR = os.path.join(_ROOT, "observations")

def list_observations():
    items = []
    if not os.path.isdir(OBS_DIR):
        return items
    for entry in sorted(os.listdir(OBS_DIR)):
        folder = os.path.join(OBS_DIR, entry)
        meta_path = os.path.join(folder, "meta.json")
        if not os.path.isdir(folder) or not os.path.isfile(meta_path):
            continue
        try:
            with open(meta_path, encoding="utf-8") as f:
                meta = json.load(f)
        except (OSError, json.JSONDecodeError):
            continue
        items.append({
            "id": entry,
            "title": meta.get("title", entry),
            "topic": meta.get("topic", ""),
            "color": meta.get("color", "#555555"),
            "order": meta.get("order", 999),
            "words": meta.get("words", []),
        })
    items.sort(key=lambda o: (o["order"], o["title"]))
    return items

def observation_dir(obs_id):
    if not obs_id or "/" in obs_id or os.sep in obs_id or obs_id.startswith("."):
        return None
    folder = os.path.join(OBS_DIR, obs_id)
    return folder if os.path.isdir(folder) else None
