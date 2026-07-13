import numpy as np

def _unit_rows(arr):
    norms = np.linalg.norm(arr, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return arr / norms

def l2_normalize(vectors):
    arr = np.asarray(vectors, dtype=np.float64)
    if arr.size == 0:
        return []
    return _unit_rows(arr).tolist()

def cosine_matrix(vectors):
    arr = np.asarray(vectors, dtype=np.float64)
    if arr.shape[0] == 0:
        return []
    unit = _unit_rows(arr)
    sim = np.clip(unit @ unit.T, -1.0, 1.0)
    return np.round(sim, 4).tolist()
