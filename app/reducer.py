"""Dimensionality reduction.

Reduces high-dimensional embedding vectors to 2D or 3D for plotting.

Two methods are selectable from the UI:
  - "umap": manifold-based, stochastic, needs enough points to be meaningful.
            With too few points for the requested dimensionality it falls back
            to PCA and reports it via a note.
  - "pca":  deterministic, linear; faithful distances even for a few points.

The `reduce` signature is method-agnostic so other reducers can be added later.
"""
import numpy as np

_RANDOM_STATE = 42


def reduce(vectors, n_components, method="umap"):
    """Reduce `vectors` to `n_components` dimensions using `method`.

    Args:
        vectors: list[list[float]] — one embedding per row.
        n_components: int — 2 or 3.
        method: "umap" or "pca".
    Returns:
        (coords, note) where coords is list[list[float]] (one row per input,
        each of length n_components) and note is None or a short string
        explaining a fallback or padding.
    """
    arr = np.asarray(vectors, dtype=np.float64)
    n_samples = arr.shape[0]
    if n_samples == 0:
        return [], None

    method = (method or "umap").lower()

    if method == "pca":
        coords, padded = _pca(arr, n_components)
        note = (
            f"Only {n_samples} point(s): fewer than {n_components}D available "
            "from PCA — extra axis zero-padded." if padded else None
        )
        return coords.tolist(), note

    # UMAP needs n_samples > n_components to produce a sensible embedding.
    if n_samples <= n_components:
        coords, _ = _pca(arr, n_components)
        return coords.tolist(), (
            f"Too few points ({n_samples}) for {n_components}D UMAP — "
            "used PCA instead."
        )

    try:
        coords = _umap(arr, n_components)
        return coords.tolist(), None
    except Exception as exc:  # UMAP can still choke on tiny/degenerate inputs
        coords, _ = _pca(arr, n_components)
        return coords.tolist(), f"UMAP failed ({exc}); used PCA instead."


def _umap(arr, n_components):
    import umap  # imported lazily — heavy dependency (numba)

    n_samples = arr.shape[0]
    n_neighbors = min(15, max(2, n_samples - 1))
    reducer = umap.UMAP(
        n_components=n_components,
        n_neighbors=n_neighbors,
        random_state=_RANDOM_STATE,
    )
    return reducer.fit_transform(arr)


def _pca(arr, n_components):
    """Return (coords, padded) where padded is True if fewer than
    n_components real components were available and the rest zero-filled."""
    from sklearn.decomposition import PCA

    usable = min(n_components, arr.shape[0], arr.shape[1])
    # ponytail: exact solver, not auto. Inputs are tiny (a few words × high dim),
    # so the randomized SVD auto-picks is pointless and trips numpy matmul
    # overflow/divide-by-zero warnings during its power iterations.
    coords = PCA(
        n_components=usable, svd_solver="full", random_state=_RANDOM_STATE
    ).fit_transform(arr)
    if usable < n_components:
        pad = np.zeros((arr.shape[0], n_components - usable))
        coords = np.hstack([coords, pad])
        return coords, True
    return coords, False
