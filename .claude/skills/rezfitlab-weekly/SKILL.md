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
If it prints warnings about running out of topics/ideas, add new gym ideas to `data/gym_ideas.json` (research trending Turkish
fitness questions; same format, status "todo") and mention it in the final report.

## 2. For each long video
1. **Research.** Read the AHA items it covers in `data/source/aha_topics_tr.txt` (the concept + suggested angles) — the original
   question text is corrupted machine translation, use it only to know which concept is meant. Verify every fact with web search
   in reliable sources (ACSM, WHO, CDC, NSCA, OpenStax, PubMed reviews). Note 2–5 sources with URLs.
2. **Script** (Turkish, 1150–1450 words, 5–9 scenes) following the two-layer rule: `hook` → `exam` scene(s) → `gym` scene(s) →
   `summary` ("Sınavda hatırla / Salonda uygula") → `cta`. Every scene has a `layer`. Each beat = one spoken idea (≈ 3–6 s).
3. **Storyboard.** Give every beat a `visual`:
   - Concepts, tables, classifications → `diagram` (planes, joint_action, hr_zones, rpe_scale, mmt_grades, kinetic_chain, body_map,
     timeline, bar) with `params`, or `list` / `stat` / `compare` / `keyword` / `title` / `quote` / `exercise_card`.
   - Real gym moments → `stock`, chosen as in step 4.
   - A visual change every beat; never more than 3 identical non-stock types in a row.
4. **Stock clips.** For each stock beat run
   `python tools/stock_search.py "<precise English query>" --orientation landscape` and **open the contact-sheet image and look at
   it.** Pick a candidate only if the frames clearly show what the sentence says (the exact exercise, correct-looking form, no
   logos/celebrities). Copy its `provider`, `id`, `url` into `visual.clip`, set `clip.checked` to what you saw
   (e.g. "side view, barbell back squat, full depth, neutral spine"). If nothing fits after 2 queries → change the beat to
   `exercise_card` or a `diagram`. Never guess.
5. **Pictures.** For `image` / `collage` beats run
   `python tools/image_search.py "<query>" --source pixabay --kind photo|illustration|vector` or
   `python tools/image_search.py "Gray's Anatomy <structure>" --source wikimedia` (also "OpenStax <topic>") and **open the sheet
   image and look at it**. Never pick a candidate marked NO PREVIEW. Copy `provider`, `id`, `url`, `license`, `credit`, `page`
   from the JSON into `visual.images[]`, add `checked` (what you saw), optional `cutout` / `caption`; for anatomy pictures add
   Turkish `labels` with x/y in % of the picture where the arrow should point (judge the position from the sheet image).
   Mix it in: roughly one picture visual every 20–30 s, never two collages in a row.
6. **Upload package** (`upload`): title, description with `{CHAPTERS}` placeholder and sources, 12–20 tags, ≤ 3 hashtags, pinned
   comment question. Playlist: `exam`.
7. Fill `id` = slot from the plan (`L-YYYYMMDD-<short-english-slug>`), `kind`, `topic_id`, `publish_at`, `sources`.

## 3. For each Short
- `quiz`: write ONE clear question about the concept (never copy the AHA wording), 4 short options (one correct, three plausible),
  `answer` index, one-sentence `explanation`, `countdown_s` 4. Narration beats: question → (countdown) → answer + why → "Detaylı
  anlatım kanalda". `related_long_topic` from the plan. Playlist `quiz`. Title = the question.
- `gym`: hook in the first line (mistake or surprising claim) → mini story with a turn → one actionable cue → loop line.
  Visuals: portrait stock (`--orientation portrait`, same look-before-choosing rule) + `keyword`/`exercise_card`. Playlist `gym`.
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
