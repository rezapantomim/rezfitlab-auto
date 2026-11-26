# Project state — 2026-11-26

## Done
- Contract `schema/episode.schema.json`, rules `config/rules.md`, critic `config/critic.md`, settings `config/channel.json`.
- Topic bank: 27 long topics (all 100 AHA items covered, clustered), 100 quiz items, 30 gym Short ideas.
- Writer skill `.claude/skills/rezfitlab-weekly` + tools (plan_week, stock_search, validate, enqueue, yt_auth).
- Publisher `pipeline/` + Remotion templates `render/` + workflow `.github/workflows/publish.yml`.
- Local dry run OK: quiz Short `work/S-20261203-abduksiyon-quiz/final.mp4` (32 s, word-timed captions, -13.9 LUFS, QA passed).

- Local dry run OK: long video `work/L-20261201-hr-zones/final.mp4` (8:05, 9 auto chapters, sources, QA passed, ~20 min build).
  Owner approved the look, voice and thumbnail. Fixed after it: stat ranges ("150–300") rendered wrong; words_min raised to 1250.
- Pexels has paused new API keys → Pixabay only for now. Pixabay key works (in .env).
- Pictures added: visual types `image` (photo card / cutout, Turkish label arrows) and `collage` (2-4 photos, tape, stickers);
  `tools/image_search.py` (Pixabay + Wikimedia Commons with licence filter, previews must be seen); credits auto-added to description.
  Test Short `work/S-20261204-protein-30g/final.mp4`. Background removal (rembg) only on Actions (no wheels for local Python 3.15).
  Wikimedia needs the etiquette User-Agent, otherwise 429.

## Decisions
- Fully automatic, no human review; hybrid: writing on the owner's PC (Claude Code, weekly), render/upload on GitHub Actions.
- Turkish, two audiences (gym-goers + instructor-exam candidates), two-layer long videos.
- 2 long (Tue/Sat 20:00 TRT) + 7 Shorts (daily 18:00 TRT, alternating quiz/gym). Voice tr-TR-AhmetNeural.
- AHA source files are book-derived: kept local in `data/source/` (git-ignored), never published.

## Next
- Owner: `.claude/settings.json` permission allow-list for the headless weekly run (was blocked for Claude to write; owner decides).
- First real week: run the skill manually once, dry-run one long video end to end (not yet tested), check stock search with real keys.
- GitHub repo + secrets, YouTube OAuth (app "In production"), Task Scheduler.

## Open issues
- Remotion's Chrome download fails locally on Node 26 → local renders use `REMOTION_BROWSER` = installed Chrome. Actions uses Node 20.
- No music files yet (voice + SFX only). Custom thumbnails need a phone-verified channel.
- Comments cannot be pinned through the API; the bot posts the comment once the video is public.
