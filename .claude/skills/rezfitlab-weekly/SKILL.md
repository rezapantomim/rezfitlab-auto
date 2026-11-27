---
name: rezfitlab-weekly
description: Write next week's Rez Fitlab YouTube episodes (2 long videos + 7 Shorts, Turkish fitness education) end to end — plan, research, script, storyboard with visually checked stock clips, critic pass, validate, queue and push to GitHub. Use when the weekly scheduled run starts, or when the user asks to write/plan/queue the next week of Rez Fitlab videos.
---

# Rez Fitlab — weekly writer

You write one week of episodes and push them to the `queue/` folder. GitHub Actions turns each queued file into a video and
uploads it at its `publish_at`. Nobody reviews your output before it goes public: the critic pass and the validator are the only
gates, so be strict. Skipping an episode is better than publishing a wrong one.

Run everything from the project root. Python tools live in `tools/` (run as `python tools/<name>.py`).

## 0. Read first (every run)
- `config/rules.md` — content rules (language, two-layer rule, health & safety, sources, visuals).
- `config/critic.md` — the review checklist.
- `config/channel.json` — limits (word counts, durations), schedule, style.
- `schema/episode.schema.json` — the exact output format.
- Look at one file in `archive/` (if any) as an example of a finished episode, and at `data/history.json` for what was already published.

## 1. Plan
`git pull --rebase` first (Actions moves files from queue/ to archive/). Then `python tools/plan_week.py --write`.
It prints the slots: long videos (topic + AHA item numbers + gym angle) and Shorts (quiz item or gym idea), each with `publish_at`.
The number of days comes from `schedule.plan_days_ahead` (7 = weekly run, 3 = daily run); slots already queued are skipped, so
the same steps work for both. If nothing is missing, report "queue full" and stop.

### Topic discovery (when the planner warns that topics run low)
- **Long topics** → append 4–8 new entries to `data/topics.json`:
  `{"id": "T<next number>", "title": "<Turkish working title>", "aha_items": [], "gym_angle": "<what changes in the gym>",
  "brief": "<2-3 sentences: the question the video answers, exam angle, gym angle>", "order": <next>, "status": "todo"}`.
  Find them by research: what Turkish gym-goers search and ask (YouTube search suggestions, popular Turkish fitness videos and
  their comments, Google "insanlar bunu da soruyor"), plus instructor-exam subjects not covered yet (training principles,
  periodisation, flexibility, nutrition basics, special populations, first aid basics for trainers). Each must allow the two-layer
  rule, be evergreen, and not repeat an existing title (check data/topics.json and data/history.json).
- **Gym Shorts** → append 10–20 ideas to `data/gym_ideas.json` (`{"id": "G-<slug>", "idea": "...", "status": "todo"}`).
- **Quiz Shorts** → when quiz items run out, write new quiz items from finished long videos into `data/quiz.json`
  (`{"id": "Q<next>", "concept": "...", "angles": [], "long_topic": "T..", "status": "todo"}`).
- Commit these bank changes together with the queued episodes.

## 2. For each long video
1. **Research.** Read the AHA items it covers in `data/source/aha_topics_tr.txt` (the concept + suggested angles) — the original
   question text is corrupted machine translation, use it only to know which concept is meant. Verify every fact with web search
   in reliable sources (ACSM, WHO, CDC, NSCA, OpenStax, PubMed reviews). Note 2–5 sources with URLs.
2. **Script** (Turkish, 1150–1450 words, 5–9 scenes) following the two-layer rule: `hook` → `exam` scene(s) → `gym` scene(s) →
   `summary` ("Sınavda hatırla / Salonda uygula") → `cta`. Every scene has a `layer`. Each beat = one spoken idea (≈ 3–6 s).
3. **Storyboard — motion first, few words** (owner, 2026-11-27: "too much is written; go towards motion and collages").
   The narration carries the information; the screen shows it. Give every beat a `visual`, preferring in this order:
   - **Pictures** (step 5): `image` (full-bleed Ken Burns photo, optional 1–4 word `text`), `collage` (2–4 photos fly in with
     1–2 word `caption` stickers), `split` (2 photos side by side, `left`/`right` labels, optional `verdict`), real gym moments →
     `stock` (step 4).
   - **Text visuals only with a photo behind them**: `keyword`, `title`, `stat`, `list`, `exercise_card`, `quote` all take
     `images: [1 photo]` (shown full-bleed behind the words / beside the card) and an optional `icon`. A `stat` with a photo =
     picture with a counting number.
   - `diagram` for concepts, tables and classifications (planes, joint_action, hr_zones, rpe_scale, mmt_grades, kinetic_chain,
     body_map, timeline, bar).
   - `icons`: 1–4 animated line icons with 1–2 word labels (`icons: [{icon, label}]`; names in the schema enum) — instead of a
     list, for steps, cause → effect, "A − B".
   Hard limits (`tools/validate.py` enforces them): every on-screen string ≤ 4 words; lists / cues ≤ 3 entries; at most 30 % of
   beats text-only (a text visual without a photo); a picture / collage / split / stock / diagram / photo-backed visual at least
   every 2nd beat; one photo on at most 3 beats. Never more than 3 identical non-stock types in a row. In quiz Shorts the
   first 2 beats sit under the quiz card. Build a photo pool for the episode first (8–25 photos for a long video, 3–6 for a
   Short) and reuse it.
4. **Stock clips.** For each stock beat run
   `python tools/stock_search.py "<precise English query>" --orientation landscape` and **open the contact-sheet image and look at
   it.** Pick a candidate only if the frames clearly show what the sentence says (the exact exercise, correct-looking form, no
   logos/celebrities). Copy its `provider`, `id`, `url` into `visual.clip`, set `clip.checked` to what you saw
   (e.g. "side view, barbell back squat, full depth, neutral spine"). If nothing fits after 2 queries → change the beat to
   `exercise_card` or a `diagram`. Never guess.
5. **Pictures.** For every picture (image, collage, split, photo-backed text) run
   `python tools/image_search.py "<query>" --source pixabay --kind photo|illustration|vector` or
   `python tools/image_search.py "Gray's Anatomy <structure>" --source wikimedia` (also "OpenStax <topic>") and **open the sheet
   image and look at it**. Never pick a candidate marked NO PREVIEW. Copy `provider`, `id`, `url`, `license`, `credit`, `page`
   from the JSON into `visual.images[]`, add `checked` (what you saw), optional `cutout` / `caption`; for anatomy pictures add
   Turkish `labels` with x/y in % of the picture where the arrow should point (judge the position from the sheet image).
   Never two collages in a row. No visible brand logos, no recognisable athletes or celebrities, no children as the subject.
6. **Thumbnail:** `thumb_text` (2–4 Turkish words, a curiosity gap), `thumb_highlight` (the one word to colour) and `thumb_pose`
   (the coach photo, gym-scene photos only — see the schema list): myth / surprise / general → `portrait-gym` or `portrait-red`,
   exam topics → `arms-folded`, a specific exercise → its exercise pose (`lateral-raise`, `lat-pulldown`, `incline-press`,
   `dumbbell-curl`), effort / motivation → `after-set`. The thumbnail must feel like an energetic sports cover, never a
   passport or studio head shot. Do not use the same pose on two consecutive long videos.
7. **Upload package** (`upload`): title, description with `{CHAPTERS}` placeholder and sources, 12–20 tags, ≤ 3 hashtags, pinned
   comment question. Playlist: `exam`.
8. Fill `id` = slot from the plan (`L-YYYYMMDD-<short-english-slug>`), `kind`, `topic_id`, `publish_at`, `sources`.

## 3. For each Short
- `quiz`: write ONE clear question about the concept (never copy the AHA wording), 4 short options (one correct, three plausible),
  `answer` index, one-sentence `explanation`, `countdown_s` 4. Narration beats: question → (countdown) → answer + why → "Detaylı
  anlatım kanalda". `related_long_topic` from the plan. Playlist `quiz`. Title = the question.
- `gym`: hook in the first line (mistake or surprising claim) → mini story with a turn → one actionable cue → loop line.
  Visuals: photos / portrait stock (`--orientation portrait`, same look-before-choosing rule), `icons`, photo-backed
  `keyword` / `exercise_card`, `split` for right-vs-wrong. Playlist `gym`.
- Both Short types: the last (CTA) beat also gets a photo; 2–4 words on screen per beat.
- 45–95 words, ≤ 45 s. Id `S-YYYYMMDD-<slug>`.

## 4. Critic (separate pass, per episode)
Re-read the finished JSON as a reviewer who did not write it, against `config/critic.md`. Re-check doubtful facts with a fresh web
search. Fix what fails and review again (max 2 rounds). Write the result into `critic`. HARD failure or score < 7.5 → do not queue.

## 5. Validate, queue, push
- Save drafts to `work/episodes/<id>.json` (UTF-8). `python tools/validate.py work/episodes/*.json`; fix every FAIL.
- `python tools/enqueue.py work/episodes/*.json` (moves passing files to `queue/`, marks topics queued).
- Commit and push: `git add queue data && git commit -m "queue: week of <week_start>" && git push`.
  If the push fails because of new remote commits: `git pull --rebase` and push again.
- Do not commit `work/`, `.env` or `data/source/` (they are git-ignored; keep it that way).

## 6. Report
End with a short report: each queued episode (id, publish time Istanbul, title, critic score), anything skipped and why,
warnings. The scheduled runner sends this report to Telegram if configured.
