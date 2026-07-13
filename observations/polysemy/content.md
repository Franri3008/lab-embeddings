# Polisemy: one word, many meanings

`bark` can be surprising: it's **not** closest to `dog`, even though a dog barks. Sometimes it lands nearer `tree`. The culprit here would be **polysemy**: one word, one vector, several meanings.

## One word, one vector

The model gives `bark` a **single** embedding that has to cover *all* its senses at once:

- the sound a **dog** makes
- the **tree** covering
- "to bark" as in **shout** an order

The result is a blended point that doesn't fully commit to any one sense. It floats in a compromise region, pulled toward dogs by one meaning and toward trees by another, so its nearest neighbour depends on which senses dominate the training data, not on which meaning we had in mind.

## Context helps

Embed the bare word and we get the blend, but embed a **phrase** that pins the sense and the vector snaps toward that meaning:

- `the dog's bark` -> moves toward `dog`, `animal`, `sound`
- `the bark of the oak` -> moves toward `tree`, `wood`, `leaf`

This is the flip side of [bare single words](obs:surface-form): they're ambiguous on purpose, because real text almost always supplies the missing context. Giving the model a fuller [description instead of a keyword](obs:keyword-labels) is the same move, where context sharpens the vector.
