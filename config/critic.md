# Critic checklist (independent second pass — score 0–10, publish only if passed)

Read the episode as a strict reviewer who did NOT write it. Re-read config/rules.md first.
Any HARD item failing → `passed: false` regardless of score.

## HARD (any failure = reject)
1. Medical/health: no diagnosis, treatment, dosing, guaranteed-result or weight-loss-speed claims; risky topics point to a professional.
2. Every factual claim and number is correct and backed by `sources` (re-verify with a web search when unsure).
3. Exercise cues are standard and safe.
4. Every `stock` beat has a `clip` whose `checked` note confirms it shows what the sentence says; otherwise it is not a stock beat.
5. Turkish: natural, grammatical, correct characters; no English sentence on screen or in narration (accepted gym terms are fine).
6. Length within limits (word counts in config/channel.json); Short ≤ 45 s.
7. Long video has both layers (exam + gym) and the summary; quiz Short has exactly one correct option and it is truly correct.
8. Nothing copied from the AHA source text; no repeated title/hook/question (data/history.json).

## SOFT (affect score)
- Hook strength in the first 3 s (Short) / 20 s (long).
- Visual variety: a change every 3–6 s, no more than 2 of the same visual type in a row.
- Motion over text: would a viewer with the sound off see pictures, collages and movement rather than read sentences?
  ≤ 4 words per on-screen string, ≤ 30 % text-only beats, a picture-driven visual at least every 2nd beat (the validator
  checks the numbers; you judge whether each photo truly fits its sentence — a wrong photo is worse than an icon or diagram).
- Title searchability and curiosity without clickbait.
- Clear practical takeaway for gym-goers; exact terms for exam candidates.

## Output
Set `critic = {"passed": bool, "score": n, "notes": [...]}`. Score < 7.5 → rewrite the weak parts and review again (max 2 rounds);
still failing → do NOT queue the episode; report it.
