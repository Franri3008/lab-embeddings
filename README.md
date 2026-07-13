# Embedding Lab

Playground for poking at text embeddings: embed a list of words/phrases via OpenRouter, project them to 2D/3D, and compare cosine similarities in the browser. Includes a set of written-up experiments called Observations.

## Setup

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp config.example.json config.json   # add your OpenRouter API key
python main.py
```

## Structure

- `app/`: Flask server, embedder (OpenRouter), UMAP reducer, similarity math
- `static/`: single-page UI
- `observations/`: one folder per experiment (`content.md` + `meta.json`)
- `Procfile`: gunicorn entrypoint for deployment

