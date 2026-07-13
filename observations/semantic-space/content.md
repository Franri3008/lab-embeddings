# Why animals scatter in the projection

Add a handful of animals and they often land **surprisingly far apart** in the scatter plot; sometimes an animal sits closer to an unrelated word than to another animal. This is mostly an artifact of *projection*, not the embedding.

## The plot is a shadow

Since I used OpenAI's `embedding-3-large`, the full embedding has **3072 dimensions**. UMAP/PCA squeeze that down to 2 or 3 so we can look at it. That compression has to throw almost everything away:

- **PCA** keeps the few directions of greatest overall variance. If the words vary most along axes that *aren't* "animalness", animals get smeared apart.
- **UMAP** preserves local neighbourhoods, not global distances. Two clusters that are genuinely close can be pushed apart to make the layout readable, and absolute positions are arbitrary.

So **distance on screen ≠ true distance**. The scatterplot is a shadow cast from 3072D onto a wall, useful for spotting groups, but unreliable for reading exact gaps.

## What to trust instead

Switch to the **Cosine Similarity** tab. Cosine is computed on the full-dimensional vectors, so it's the ground truth, and it's exactly what [classification by nearest label](obs:classification) relies on. We'll usually see the animals are in fact tightly related (high cosine) even when the projection flings them to opposite corners, and random words like `galaxy` sit clearly lower.

> Rule of thumb: use **Semantic Space** to find clusters and **Cosine Similarity** to measure them.

If we try **2D vs 3D vs UMAP vs PCA** on the same words, the cosine numbers stay put while the scatter plot reshuffles every time.
