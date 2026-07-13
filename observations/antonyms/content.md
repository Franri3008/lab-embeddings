# Antonyms sit close

You'd expect *opposites* to land far apart, since they mean opposite things. But they don't. In the heatmap the antonym pairs are the **closest** off-diagonal cells:

| pair          | cosine |
|---------------|:------:|
| big – small   | **0.57** |
| hot – cold    | **0.55** |
| love – hate   | **0.50** |

Every unrelated cross-pair (`hot`–`love`, `hate`–`small`, …) sits lower. The opposites are nearer each other than to anything else.

## Opposites share everything except polarity

An antonym pair differs on **one** axis (polarity) and agrees on all the rest:

- same **dimension** - `hot`/`cold` are both *temperature*, `big`/`small` both *size*
- same **contexts** - "it was really ___", "too ___ to handle"
- same **grammatical slot** - both adjectives, interchangeable in a sentence

Embeddings encode that shared dimension and context strongly, and the actual flip of meaning only faintly. So the vector lands in the "temperature-adjective" region either way.

## The tell: an antonym ≈ a synonym

Measured on the same embedder, `hot`–`warm` (a **synonym**) ≈ **0.61**, barely above `hot`–`cold` (the **antonym**) ≈ **0.55**. The model can hardly tell *"the opposite of hot"* from *"a word that means hot."* Both just read as "about temperature." For contrast, a truly unrelated word like `hot`–`asphalt` drops to **0.30**, around the [similarity floor](obs:similarity-floor).

> High cosine means **"same topic / same dimension"**, *not* "same meaning". Polarity is the part embeddings are worst at.

## What does this imply

This is the static-word cousin of [negation](obs:negation): just as *"not X"* sits next to *"X"*, *"the opposite of X"* sits next to *"X"*. Any task that hinges on the **pole** - sentiment (`love`/`hate`), safety (`safe`/`dangerous`), direction (`up`/`down`), etc. — can't lean on cosine alone, because the opposite pole is one of the nearest neighbours. It's also a reminder that a single [bare word's vector](obs:polysemy) is a blend of how the word is *used*, and turns out opposites are used almost identically.
