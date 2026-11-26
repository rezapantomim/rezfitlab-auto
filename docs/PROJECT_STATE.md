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
  @RezFitlabbot (secrets set); home/privacy pages on GitHub Pages (branch gh-pages).
- Google Cloud (moved 2026-11-26 to the channel's own account rezfitlab@gmail.com): project `rezfitlab-auto-515916`
  (YouTube Data API v3, OAuth app "Rez Fitlab Uploader" In production, Desktop client `rezfitlab-uploader` 715040955711-…);
  secret YT_TOKEN_JSON = Rez Fitlab (@rezfitlab), verified. The old project `rezfitlab-auto` (personal account) was shut down on 2026-11-26 (deleted after 2026-12-26).

## Decisions
- Fully automatic, no human review; writing on the owner's PC (Claude Code), render/upload on GitHub Actions.
- Turkish, two audiences (gym-goers + instructor-exam candidates), two-layer long videos.
- Start 2 long (Tue/Sat 20:00 TRT) + 7 Shorts (daily 18:00 TRT); ramp later (see `schedule.ramp_note`). Voice tr-TR-AhmetNeural.
- AHA source files are book-derived: kept local in `data/source/` (git-ignored). Coach poses are public in the repo (owner OK).

- First week queued 2026-11-26 (Fri 27 Nov – Thu 3 Dec: 2 long + 7 Shorts). First upload OK: S-20261127 -> youtu.be/TPK6pqt-kUg.
  `.claude/settings.json` is in place (owner copied it).
- Publisher fixes 2026-11-26: expired Pixabay image links are refreshed through the API by id (secret PIXABAY_API_KEY);
  the state-save step no longer drops everything when `failed/` does not exist.

## Next
- Weekly writer registered 2026-11-26 (Task Scheduler 'RezFitlab Writer', Sundays 10:00; first run 2026-11-29).
  Check its first Telegram report: the headless run only has the allow-list in `.claude/settings.json`.
- Note: workflow_dispatch defaults to dry_run=true; pass `-f dry_run=false` for a real manual upload.

## Open issues
- Local Python 3.15: no rembg wheels (cutouts only on Actions); needs `tzdata`. Local renders: REMOTION_BROWSER = installed Chrome.
- Wikimedia needs the etiquette User-Agent (else 429). Comments can't be pinned via API. Custom thumbnails need a phone-verified channel.
