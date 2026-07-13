# Classifying by nearest label

Embeddings turn classification into **measuring distance**. The phrase *"Group of felines with claws and good vision"* scores **0.42** with `Cat`, higher than with `Train` (0.17), `Plane` (0.13) or `galaxy` (0.16). The description never says "cat", yet its vector lands nearest the cat. That's a classifier!

## How zero-shot classification works

I've been working a lot lately with embedding-based classification, and this is my usual flow.

1. Write down the **candidate labels** with a short description of each class, using **label-specific keywords** if possible
2. Embed the **input word** to be classified and embed **each label** as well
3. Predict the label with the **highest cosine** to the input

No training, no fine-tuning, etc. Add a class by adding one more label string. Try the loaded words: each description's nearest **single-word label** is its class (`A furry pet that meows` -> `cat`, `A large vehicle that flies` -> `plane`).

## It's the ranking, not the number

If you tried the loaded words, notice the winning score was only **0.42**, not +0.9. But that's actually fine: a short label and a full description are different *kinds* of text (see [surface form](obs:surface-form)), so absolute cosine stays not that high. What matters is that the right label is the **top-ranked** one among the candidates. This kind of classification cares about order instead of magnitude.

> `normalize` doesn't change the winner: cosine already ignores vector length, so the ranking is identical with it on or off.

## Making it stronger

- **Describe the class, don't just name it.** `A vehicle that flies in the sky` beats the bare word `plane` as a label - richer text, sharper match. But mind *how* you describe it: [descriptions vs. keyword labels](obs:keyword-labels) shows a keyword soup can backfire.
- **Prototypes.** Average several example embeddings per class into one centroid, then compare against centroids. Should smooth out odd phrasings, but I haven't tried this much yet.
- **Add a threshold.** If the best cosine is below, say, 0.2, predict *"none of the above"* instead of forcing a class. However, finding the correct threshold (or one that's generalizable) has been very tough so far, partly because of the [similarity floor](obs:similarity-floor) - 0.2 is already about where *unrelated* things sit.
- **Watch confusable classes.** `Train` and `Plane` sit at 0.48 with each other (both "vehicles") so a vague input may land between them. More specific label text pulls them apart.

This is actually the backbone of embedding-based search, routing, deduplication and tagging: everything is "which reference vector is this closest to?". Cool!
