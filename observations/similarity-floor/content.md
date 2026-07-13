# The similarity floor

Cosine ranges from −1 to 1, so it's tempting to read **0 as "unrelated"** and treat, say, 0.3 as "a bit similar". But this is wrong! Embed six words from totally different worlds and **nothing comes near 0**; the *floor* of cosine in this space probably will sit around **0.15–0.25**, not zero.

## Six unrelated words, measured

`cat`, `justice`, `asphalt`, `gravity`, `trombone`, `democracy` were picked to share nothing. The lowest and highest of the 15 pairings:

| pair                   | cosine |
|------------------------|:------:|
| trombone – justice     | **0.16** |
| justice – asphalt      | 0.17   |
| asphalt – democracy    | 0.18   |
| cat – democracy        | 0.19   |
| *…most pairs…*         | ~0.20  |
| gravity – justice      | 0.31   |
| **justice – democracy**| **0.37** |

Even the *most* unrelated pair (`trombone`–`justice`) is **0.16**, not 0. There are no negatives anywhere. The whole "unrelated" cloud lives in a tight band around **0.2**.

## Why nothing is ever zero: anisotropy

The vectors don't fan out evenly over the sphere. Instead, they're packed into a **narrow cone**, all pointing in broadly the same general direction. So any two vectors start with a baseline positive overlap before meaning even enters. That baseline *is* the floor. Cosine 0 (true orthogonality) and negative cosine barely occur in practice.

> So the usable scale isn't 0 -> 1, but roughly **0.2 -> 1**. A score of 0.3 is *near the floor* - basically "unrelated", not "somewhat related".

The one pair that pokes up (`justice`–`democracy` at **0.37**) does so because those two genuinely *are* related (civic concepts). The floor correctly stays quiet for everything else.

## What this means for every other number in the lab

- **Read gaps, not absolutes.** This is exactly why [classification](obs:classification) ranks labels instead of trusting the raw cosine, and why a fixed "is it a match?" threshold is so hard to set. The threshold has to clear the floor, and the floor moves with the domain.
- **High floor -> polarity is invisible**; because everything starts at ~0.2 and related things ride up to 0.5–0.9, a statement and its negation can both sit at 0.8 — far above the floor, so a retriever can't separate them. See [negation](obs:negation) and [antonyms](obs:antonyms).
- **Trust cosine over the plot, but calibrate it.** Cosine is still the [ground truth](obs:semantic-space) of closeness. Just remember: its zero isn't 0!
