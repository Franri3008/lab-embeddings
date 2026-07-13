# Alignment across languages

Embed the same concept in different languages - `dog` (EN), `perro` (ES), `chien` (FR) - and they land **close together**, well above an unrelated English word like `train`. The model has learned a **language-agnostic** meaning space.

## Measured on the raw vectors

Typical cosine values we've seen with `text-embedding-3-large`:

| pair            | cosine |
|-----------------|:------:|
| dog - perro     | ~0.62  |
| dog - chien     | ~0.51  |
| dog - train     | ~0.35  |

The cross-language "dog" pairs beat the same-language unrelated word. Meaning seems to travel across languages better than the surface string would suggest.

## Why it's not 1.0

Translations are **close, but not identical**. A few things hold them apart:

- different [**tokenization**](obs:surface-form) per language (subword pieces differ)
- training data **imbalance** since English is far more represented, so its vectors are more finely placed
- even genuine **connotation drift** between languages

So we expect a *strong family resemblance*, not a perfect overlap. Add `gato` (Spanish "cat") and you'll see the cats cluster and the dogs cluster, with the two clusters separated. Probably the space is organised by **concept first, language second**. (Those clusters can still look scattered in the 2D plot - see [why animals scatter](obs:semantic-space).)
