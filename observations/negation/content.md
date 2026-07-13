# Embeddings and negation

Negation might be the hardest thing for an embedding to respect, because embeddings encode **what a text is about**, while "not" / "without" flip the *truth* while leaving the topic untouched. `coffee with sugar` and `coffee without sugar` are opposites, but they share every other word, so the model can barely tell them apart.

## The clean failure

Cosine on the sugar set:

| | with sugar | without sugar | with no sugar | unsweetened |
|---|:--:|:--:|:--:|:--:|
| **with sugar**    | 1.00 | 0.82 | 0.79 | 0.63 |
| **without sugar** | 0.82 | 1.00 | 0.93 | 0.74 |
| **with no sugar** | 0.79 | 0.93 | 1.00 | 0.74 |
| **unsweetened**   | 0.63 | 0.74 | 0.74 | 1.00 |

Three things to read here:

1. **The negation barely moved the vector.** `with sugar` <-> `without sugar` = **0.82** - two opposites sit almost on top of each other. The single word "without" carries the whole logical flip but almost no distributional weight, so the shared frame *"coffee … sugar"* dominates (same drowning effect as the lone "air" keyword in [descriptions vs. keyword labels](obs:keyword-labels)).
2. **It does know the two negations agree.** `without sugar` <-> `with no sugar` = **0.93** - paraphrased negations are correctly seen as the same thing.
3. **Lexicalizing the opposite separates it best.** `unsweetened coffee` lands *furthest* from `with sugar` (**0.63**) - a single opposite *word* beats the phrasal "without sugar" (0.82) at pushing the meaning apart.

## When it works better than one would expect

Modern models don't seem to be hopeless at negation. Measured on the same embedder:

- `This movie is not good` <-> `This movie is bad` = **0.87**, vs `… is good` <-> `… is not good` = **0.65**. The negation correctly pulled "not good" *toward* "bad"
- `a neighborhood that is not safe` <-> `… dangerous` = **0.83** (> 0.74 to "safe")
- `The store is not open` <-> `… closed` = **0.89** (> 0.76 to "open")

So when there's a **clear [antonym](obs:antonyms) to land on**, the model often moves the negated phrase the right way. Negation handling is a **spectrum, not a wall**.

## …and when it still fails

- **Symmetric function words** (`with`/`without`, `is`/`is not`) leave the frame intact, so opposites stay glued (the 0.82 above)
- **Absolute similarity stays high regardless.** Even when "not good" leans toward "bad", `good` <-> `bad` is still **0.67** - far above the [similarity floor](obs:similarity-floor), so high that a retriever or dedup pass can't reliably tell a statement from its negation
- **Set logic / compositional negation** ("animals that are *not* cats", "A but not B") needs reasoning embeddings simply don't do: the model reads the [whole string holistically](obs:repetition), it doesn't run a truth table.

## What to do

- **Lexicalize the opposite** when you can (`unsweetened`, `dangerous`, `closed`) instead of bolting "not" onto the positive phrase
- **Encode the positive extension** by listing what you *do* mean, not the exclusion rule (the lesson from the felines experiment that started this)
- For retrieval/classification that *must* respect polarity, **retrieve broadly with embeddings, then consider re-ranking with an LLM** that can actually reason about negation
