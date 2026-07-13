# Descriptions vs. keyword labels

Two ways to ask "which of these is an air vehicle?", a full **description** and a bag of **keywords**, give different classifications. The keyword version scores *higher numbers* but gets the *answer wrong*.

Cosine of each candidate to the two query strings:

| candidate   | "…moving people through the air" | "vehicles,transport,air" |
|-------------|:--------------------------------:|:------------------------:|
| plane       | 0.39                             | **0.44**                 |
| helicopter  | **0.41**                         | 0.36                     |
| car         | 0.25                             | **0.40**                 |
| taxi        | 0.30                             | **0.38**                 |

## The description separates; the keywords don't

Read the description column top to bottom: air vehicles (plane 0.39, helicopter 0.41) sit **clearly above** ground vehicles (car 0.25, taxi 0.30). The constraint *"through the air"* is bound into the sentence, so cars and taxis (which don't fit it) are pushed **down**. Clean air-vs-ground gap.

Now the keyword column: **everything rises to 0.36–0.44**, and the gap collapses. `car` (0.40) and `taxi` (0.38) now *outscore* `helicopter` (0.36). A keyword query ranked two non-air vehicles above a real one. As a [classifier](obs:classification), it failed.

## Why "car" and "taxi" climb on keywords

`vehicles,transport,air` is a **bag of three loosely-joined tokens**, and the embedding blends them. Two of the three, *vehicles* and *transport*, describe cars and taxis perfectly. The lone *air* token can't outvote them, so ground vehicles ride up on the generic words. The description, by contrast, makes *air* a **hard relational constraint** ("moving people **through the air**"), not one token among three, so it actually discriminates. Same lesson as [repetition](obs:repetition): the model reads the whole string, not a token tally.

## Why plane likes keywords but helicopter likes the description

- **`plane` goes up on keywords (0.44 > 0.39):** since a plane is the prototypical *vehicle / transport*, it probably soaks up the generic keywords
- **`helicopter` goes up on description (0.41 > 0.36):** helicopter is a *less* typical "transport", but *"moving people through the air"* nails its defining **function**, so the descriptive query rewards it

## What would this mean for classification

- **Higher cosine ≠ better classifier.** The keyword query lifted every score yet destroyed the separation that matters
- A good label maximizes the **gap** between the right class and the distractors, not the raw similarity to the right class
- Write labels that foreground the **distinguishing attribute as a constraint** ("through the air"), not a keyword soup where generic terms ("vehicles","transport") drown the discriminating one
