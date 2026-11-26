# Rez Fitlab — free automatic YouTube pipeline

Turkish fitness-education videos for @RezFitlab: 2 long videos + 7 Shorts a week, written, rendered and uploaded with no manual step.

```
Windows PC, Sundays 10:00 (Task Scheduler -> scripts/weekly.ps1)
  Claude Code + skill "rezfitlab-weekly": plan -> research -> script -> storyboard (stock clips checked by eye)
  -> critic -> tools/validate.py -> queue/*.json -> git push
GitHub Actions, daily (.github/workflows/publish.yml -> python -m pipeline.run)
  queue item due within 40 h -> Edge TTS voice + word timings -> stock clips -> Remotion render
  -> music/SFX mix, -14 LUFS -> QA -> scheduled YouTube upload -> archive/ + data/history.json -> Telegram report
```

| Folder | What |
|---|---|
| `config/` | channel settings, content rules, critic checklist |
| `schema/episode.schema.json` | the contract between the writer and the publisher |
| `data/` | topic bank (27 long topics, 100 quiz items, gym ideas), history |
| `tools/` | writer-side tools: plan_week, stock_search, validate, enqueue, yt_auth |
| `pipeline/` | publisher: tts, media, audio, qa, youtube, run |
| `render/` | Remotion video templates (Long, Short, Thumb) |
| `queue/` → `archive/` | episodes waiting → published |

## Local test (no upload)
```
python tools/validate.py work/episodes/<id>.json
python -m pipeline.run --file work/episodes/<id>.json      # set REMOTION_BROWSER to chrome.exe on Windows
```
Output: `work/<id>/final.mp4`.

## One-time setup
1. GitHub repo (public = unlimited free Actions minutes; keys stay in Secrets) and push this folder.
2. YouTube: `python tools/yt_auth.py` (see its header), then `gh secret set YT_TOKEN_JSON < token.json`.
3. `.env` (git-ignored): `PEXELS_API_KEY`, `PIXABAY_API_KEY` (free), optional `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
   (also as GitHub secrets for the publisher).
4. Optional music: free tracks in `assets/music/*.mp3` + `assets/music/CREDITS.txt` (`name: credit line`); SFX in `assets/sfx/*.wav`.
5. `scripts/install-schedule.ps1` registers the weekly writer.

Everything is free: GitHub Actions, Edge TTS (unofficial; Piper is the offline fallback), Pexels/Pixabay, YouTube Data API,
Remotion (free for individuals / ≤ 3-person companies). The writer uses the existing Claude subscription.
