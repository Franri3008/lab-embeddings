# Word order & syntax

Swap the subject and the object and the sentence means the **opposite thing** - but the vector barely notices:

| pair                                                    | cosine |
|---------------------------------------------------------|:------:|
| `dog bites man` - `man bites dog`                       | **0.80** |
| `the cat chased the dog` - `the dog chased the cat`     | **0.93** |

Identical words, reversed roles, flipped meaning — yet 0.80 and 0.93 similar.

## Bag of meaning, not who-did-what

The model mostly encodes *which concepts are present* - dog, man, biting - and only weakly *which one is the agent and which is the patient*. Same ingredients in a different order produce a nearly identical point. The grammatical structure that carries the actual meaning (who bit whom) is the part that survives compression the least.

The longer pair scores **even higher** (0.93): `the cat chased the dog` and its reverse share more tokens (`the`, `chased`) that don't move, so the one swapped relationship is diluted further. That's the same effect as [negation](obs:negation)'s `coffee with`/`without sugar`: a big shared frame drowns the one word that flips the meaning.

## Topic is separated sharply, but structure isn't

It's not that the model is blind. The two *scenarios* (biting vs chasing) sit at only **~0.40** to each other, cleanly apart. So embeddings discriminate **topic** strongly and **role/order** weakly. Pinning down *what a sentence is about* is easy, but pinning down *who did what to whom* is not.

> This echoes [repetition](obs:repetition): there, `cat,dog` vs `dog,cat` ≈ 0.92 - order barely mattered for a list. Here, grammatical order barely matters for a sentence. So, order is a weak signal across the board.

## What doers this imply?

Don't lean on raw embeddings for tasks where word order *is* the meaning:

- directional relations like "A acquired B" vs "B acquired A", "X sued Y", etc.
- ordered instructions or steps
- subject/object disambiguation

I'd recommend to retrieve broadly with embeddings, then let an LLM that actually parses syntax settle the direction.
