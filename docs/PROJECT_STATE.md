# Project state — 2026-11-26

## Done
- Contract `schema/episode.schema.json`, rules `config/rules.md`, critic `config/critic.md`, settings `config/channel.json`.
- Topic bank: 27 long topics (all 100 AHA items, clustered), 100 quiz items, 30 gym Short ideas. Topic discovery in the skill.
- Writer skill `.claude/skills/rezfitlab-weekly` + tools (plan_week, stock_search, image_search, validate, enqueue, yt_auth).
- Publisher `pipeline/` + Remotion templates `render/` + workflow `.github/workflows/publish.yml` (daily 05:00 + 13:00 UTC;
  manual dry run; `file` input builds one test file without upload; skips quietly while YouTube is not connected).
- Visuals: diagrams, lists, stats, compare, exercise cards, stock clips, `image` (photo card / cutout / Turkish label arrows),
  `collage`; coach photo on thumbnails (gym poses only — grey studio head shots rejected by the owner).
- Tests: quiz Short, long video (8:05, chapters, sources), picture Short; GitHub build of the picture Short OK (3.5 min, rembg cutout works).
- Setup: public repo github.com/rezapantomim/rezfitlab-auto; Pixabay key in .env (Pexels paused new keys); Telegram bot
  @RezFitlabbot (secrets set); Google Cloud project `rezfitlab-auto` (YouTube Data API v3, OAuth app In production, Desktop client
  `rezfitlab-uploader`, secret `_gKh` active, extra secret `kHNd` disabled); home/privacy pages on GitHub Pages (branch gh-pages);
  secret YT_TOKEN_JSON = Rez Fitlab (@rezfitlab), verified. Two tokens for the wrong channel (ThinkVers) were revoked.

## Decisions
- Fully automatic, no human review; writing on the owner's PC (Claude Code), render/upload on GitHub Actions.
- Turkish, two audiences (gym-goers + instructor-exam candidates), two-layer long videos.
- Start 2 long (Tue/Sat 20:00 TRT) + 7 Shorts (daily 18:00 TRT); ramp later (see `schedule.ramp_note`). Voice tr-TR-AhmetNeural.
- AHA source files are book-derived: kept local in `data/source/` (git-ignored). Coach poses are public in the repo (owner OK).

## Next
- Owner adds `.claude/settings.json` (permission allow-list for the headless writer; Claude may not write it).
- Write + queue the first week with the skill; then `scripts/install-schedule.ps1` (weekly, Sundays 10:00).

## Open issues
- Local Python 3.15: no rembg wheels (cutouts only on Actions); needs `tzdata`. Local renders: REMOTION_BROWSER = installed Chrome.
- Wikimedia needs the etiquette User-Agent (else 429). Comments can't be pinned via API. Custom thumbnails need a phone-verified channel.
