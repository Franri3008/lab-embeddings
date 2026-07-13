# “cat,cat” is not “more cat”

A puzzle from the heatmap: `cat` is **closer to `cat,dog` (0.64) than to `cat,cat,dog` (0.58)**, and `cat`-`dog` (0.59) even *beats* `cat`-`cat,cat,dog`. Repeating "cat" made the phrase **less** cat-like. What gives?

## Embeddings aren't word counts

The model produces **one vector for the whole string**. It encodes "what kind of text is this, and what is it about" - *not* a weighted tally of the tokens. Repeating a token does **not** linearly add its meaning.

> If the model did naive averaging, `cat,cat,dog ≈ (2*cat + dog)/3` would sit
> *closer* to `cat`. But we see the opposite, proof the pooling is non-linear and
> that **repetition itself is a signal**.

## The matrix gives it away

The strings self-organise by **structure**, not just content:

- `cat,dog` - `dog,cat` ≈ **0.92** -> order barely matters
- `cat,cat,dog` - `dog,dog,cat` ≈ **0.93** -> the two *tripled* lists are nearly identical to each other

So there's a **"two-item list" cluster** and a **"repeated three-item list" cluster**. Repetition reads as an unusual stylistic feature and seems to push the vector into its own region, away from the clean single word `cat`.

Likely, this is also why `cat`-`dog` (two nouns, same form) can edge out `cat`-`cat,cat,dog` (bare word vs odd repeated list): [**form similarity**](obs:surface-form) wins.

From my tests, **order is almost irrelevant, but repetition matters considerably, and not in the way I expected.** The same "whole string, not a token tally" rule is what makes [keyword labels misbehave](obs:keyword-labels) in classification, and why [word order in a sentence](obs:word-order) barely registers either.
