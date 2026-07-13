EMBEDDING_MODELS = [
    {"id": "openai/text-embedding-3-large", "dims": 3072},
    {"id": "openai/text-embedding-3-small", "dims": 1536},
    {"id": "openai/text-embedding-ada-002", "dims": 1536},
]

def _label(model_id, dims):
    name = model_id.split("/")[-1]
    return f"{name} ({dims}d)" if dims else name

def available_models(default=None):
    models = [
        {"id": m["id"], "label": _label(m["id"], m["dims"]), "dims": m["dims"]}
        for m in EMBEDDING_MODELS
    ]
    if default and not any(m["id"] == default for m in models):
        models.insert(0, {"id": default, "label": _label(default, None), "dims": None})
    return models
