# cat ≠ CAT ≠ cats ≠ a cat

It's tempting to think `cat`, `CAT`, `cats` and `a cat` should all be ~1.0 to
each other; they are the exact same animal, after all. Yet the heatmap shows clear gaps (e.g. `cat`-`CAT` ≈ 0.79, `cat`-`a cat` ≈ 0.66). Therefore, the model doesn't see *concepts*; it sees **text as it would actually appear**.

## Tokenization comes first

Each string is split into subword **tokens** before the model thinks, and these
differ:

- `cat` -> one lowercase token (the bare lexical concept)
- `CAT` -> different token(s). All-caps is rare in prose, so it probably shows up mostly as
  an **acronym or shouting** (CAT scan, Caterpillar's ticker, "CAT!")
- `cats` -> a **plural** token, esentially a different word form
- `a cat` -> article + noun -> a **grammatical phrase**, an indefinite reference,
  plus an extra token

## The numbers are well-ordered

- **~0.78–0.79** for `cats` and `CAT`: still clearly the animal, interesitngly docked ~0.2 for plurality / all-caps connotations
- **~0.65–0.66** for `a cat` and [repeated forms](obs:repetition): articles and
  structure shift the *register* from "label" to "sentence fragment"
- **~0.24** for a random word like `electricity`: the true semantic floor, for contrast

## The tell

Look at `a cat`–`CAT` ≈ **0.47** (the lowest cat-family pair). Those are the two *most* divergent forms (lowercase phrase vs shouty acronym), yet both are "about cats". Surface form, instead of just meaning, is being encoded.

> A high score for a casing or plural variant is the model behaving **correctly**. A perfect 1.0 would mean it was *ignoring* real differences in how those forms are used.

This per-language tokenization is also probably why [translations](obs:cross-language)
never hit 1.0.
