import random

RANDOM_POOL = [
    "ocean", "music", "gravity", "coffee", "justice",
    "mountain", "language", "electricity", "garden", "memory",
    "velocity", "freedom", "bicycle", "thunder", "philosophy",
    "harvest", "galaxy", "rhythm", "courage", "machine",
]

def pick_random(exclude=()):
    exclude = set(exclude)
    choices = [w for w in RANDOM_POOL if w not in exclude] or RANDOM_POOL
    return random.choice(choices)
