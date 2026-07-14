import numpy as np

_RANDOM_STATE = 258


def reduce(vectors, n_components, method="pca"):
    arr = np.asarray(vectors, dtype=np.float64)
    n_samples = arr.shape[0]
    if n_samples == 0:
        return [], None

    method = (method or "pca").lower()

    if method == "pca":
        coords, padded = _pca(arr, n_components)
        note = (
            f"Only {n_samples} point(s): fewer than {n_components}D available "
            "from PCA — extra axis zero-padded." if padded else None
        )
        return coords.tolist(), note

    if n_samples <= n_components + 1:
        coords, _ = _pca(arr, n_components)
        return coords.tolist(), (
            f"Too few points ({n_samples}) for {n_components}D UMAP — "
            "used PCA instead."
        )

    try:
        coords = _umap(arr, n_components)
        return coords.tolist(), None
    except Exception as exc:
        coords, _ = _pca(arr, n_components)
        return coords.tolist(), f"UMAP failed ({exc}); used PCA instead."


def _umap(arr, n_components):
    import umap

    n_samples = arr.shape[0]
    n_neighbors = min(15, max(2, n_samples - 1))
    reducer = umap.UMAP(
        n_components=n_components,
        n_neighbors=n_neighbors,
        random_state=_RANDOM_STATE,
    )
    return reducer.fit_transform(arr)


def _pca(arr, n_components):
    from sklearn.decomposition import PCA

    usable = min(n_components, arr.shape[0], arr.shape[1])
    coords = PCA(
        n_components=usable, svd_solver="full", random_state=_RANDOM_STATE
    ).fit_transform(arr)
    if usable < n_components:
        pad = np.zeros((arr.shape[0], n_components - usable))
        coords = np.hstack([coords, pad])
        return coords, True
    return coords, False
