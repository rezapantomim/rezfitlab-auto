# Rez Fitlab — content rules (read by the writer and the critic every run)

## Channel
Turkish fitness-education channel of an IFBB Pro coach (exercise & training science graduate, Istanbul).
Two audiences, served by every long video at once:
1. **Gym-goers** — want to train better, lose fat, build muscle, avoid injury.
2. **Fitness-instructor exam candidates** (EREPS / AHA / Turkish certification) — want clear definitions, tables, the exact terms.

Tone: confident, warm, precise, a coach talking to a client ("sen" form). Natural modern Istanbul Turkish, never translated-sounding,
never textbook-stiff. Short spoken sentences, one idea each. Light humour is fine in gym Shorts, never in health claims.

## Language
- Everything the viewer sees or hears is Turkish: narration, on-screen text, titles, descriptions, tags, comments.
- Correct Turkish orthography and characters (ç ğ ı İ ö ş ü). Upper-casing must be Turkish-aware (i → İ, ı → I).
- Use the terms Turkish gyms actually use: squat, plank, deadlift, hip thrust, lat pulldown, set, tekrar, RPE.
  Scientific terms appear with the Turkish explanation the first time: "abdüksiyon — yani uzvun orta hattan uzaklaşması".
- Numbers are written as Turkish speakers read them ("yüzde 60", "dakikada 150 atım").
- Only machine fields stay English: stock search queries, JSON keys, enum values.

## The two-layer rule (long videos)
Every long video has BOTH layers, clearly separated by chapters:
- **Sınav katmanı (exam layer):** the exact definition, the classification/table, the trap answers exam questions use.
- **Salon katmanı (gym layer):** what this knowledge changes in a real workout — at least 2 concrete, safe applications.
Structure: hook (≤ 30 s, a surprising question or a common mistake) → exam layer → gym layer → 3-point summary
("Sınavda hatırla / Salonda uygula") → one question for the comments → pointer to the playlist.

## Long video (8–10 min, 1150–1450 words, 5–9 scenes)
- Scene 1 = HOOK. No definitions before 0:20. Promise a concrete payoff.
- Every beat must be SHOWABLE: a diagram, a number, a list, a comparison, a correctly identified exercise clip.
- A visual change every 3–6 s (one beat ≈ one visual).
- Max ~10 numbers per video, every number sourced.

## Shorts (20–45 s, 45–95 words)
- **Quiz Short:** line 1 = the question; 4 options on screen; countdown 3–5 s; answer + one-sentence why;
  last line sends to the long video on the topic ("Detaylı anlatım kanalda").
- **Gym Short:** first second = a common mistake or surprising claim; one mini story with a turn; one actionable cue;
  loops back to the first line where possible.

## Health & safety (hard rules — a violation fails the critic)
- Education only. No diagnosis, no treatment claims, no supplement/drug dosing, no medical advice.
- No promises like "1 haftada 5 kilo", "garantili", "mucize". No body shaming, no guilt.
- Anything about pain, injury, pregnancy, heart conditions, diabetes, blood pressure → "bir sağlık uzmanına danış".
- Intensity tables (HRR, HRmax, RPE) are presented as general guidelines (ACSM / WHO), not prescriptions.
- Exercise technique cues must be conservative and standard (neutral spine, controlled tempo, pain-free range).
- The publisher appends the disclaimer to every description automatically.

## Accuracy & sources
Prefer: ACSM guidelines, WHO physical-activity guidelines, CDC, NSCA, OpenStax Anatomy & Physiology, NIH/NIEHS, peer-reviewed reviews
(PubMed). Each long video lists 2–5 sources in `sources`. Never invent a statistic or a study.
The original AHA question bank text is corrupted machine translation: use it only to know WHICH concept is meant,
never copy its wording, and verify every fact independently.

## Visuals
- Stock clips only from Pexels/Pixabay and only after the writer has LOOKED at the clip preview and confirmed it shows exactly
  the named exercise (or a generic scene that matches the sentence). Wrong exercise = worse than no clip → use exercise_card / diagram.
- Pictures (`image`, `collage`) come only from Pixabay (Pixabay Content License) and Wikimedia Commons (public domain, CC0, CC BY —
  never SA / NC / ND). Great sources: Gray's Anatomy plates (public domain) for muscles, joints, bones; OpenStax Anatomy figures
  (CC BY) for body movements and planes. The writer looks at every picture before choosing it, exactly like stock clips.
  `image` = one picture, optionally with up to 4 `labels` (arrows pointing at x/y % of the picture: "Tendon", "Bağ"...);
  use `cutout: true` for an object or a person on a plain background (the background is removed).
  `collage` = 2-4 related pictures that illustrate the sentence together (e.g. foods rich in protein, everyday movements in
  the frontal plane), each with an optional 1-2 word `caption` sticker. Aim for 1 picture visual every ~20-30 s in long videos.
  Text on a picture must be readable for the viewer or irrelevant: avoid figures full of English labels unless the narration
  explains them (use `labels` in Turkish instead).
- Diagrams are drawn by code: planes, joint_action, hr_zones, rpe_scale, mmt_grades, kinetic_chain, body_map, timeline, bar.
- No logos, no recognisable celebrities, no copyrighted brands.

## Upload package
- Title ≤ 70 chars, the search phrase gym-goers type front-loaded; curious but never clickbait-false.
- Description: keyword in the first sentence, 2–3 sentence summary, {CHAPTERS}, sources, 3 hashtags.
- 12–20 Turkish tags (+ ≤ 3 English ones people really search).
- Pinned comment = one question to the viewer.
- Quiz Shorts: title is the question; description points to {LONG_URL}.

## Never repeat
Check data/history.json: no title, hook or Short question may repeat; no two consecutive long videos from the same cluster.
