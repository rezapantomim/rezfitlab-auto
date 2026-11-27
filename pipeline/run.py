"""Daily publisher (GitHub Actions): queue/*.json due soon -> voice -> clips -> Remotion render -> sound -> QA -> scheduled upload -> archive.

python -m pipeline.run                 # normal run (uploads)
python -m pipeline.run --dry-run       # build everything, no upload; files in work/<id>/
python -m pipeline.run --id S-20261202-x --dry-run   # one episode, even if not due
"""
import argparse, datetime as dt, json, os, pathlib, shutil, subprocess, sys, traceback
from .common import ROOT, CFG, WORK, PUBLIC, load, save, sh
from . import tts, media, audio, qa, notify

HIST = 'data/history.json'


def now():
    return dt.datetime.now(dt.timezone.utc)


def due(only=None, file=None):
    if file:                                             # local test of a single draft (always dry run)
        f = pathlib.Path(file).resolve(); return [(f, load(f))]
    eps = []
    for f in sorted((ROOT / 'queue').glob('*.json')):
        ep = load(f)
        if only and ep['id'] != only:
            continue
        at = dt.datetime.fromisoformat(ep['publish_at'].replace('Z', '+00:00'))
        if only or at <= now() + dt.timedelta(hours=CFG['schedule']['build_ahead_hours']):
            eps.append((at, f, ep))
    return [(f, ep) for _, f, ep in sorted(eps, key=lambda x: x[0])]


def chapters(ep, timeline):
    if ep['kind'] != 'long':
        return ''
    out, seen = [], set()
    for b in timeline:
        if b['scene'] not in seen:
            seen.add(b['scene'])
            s = 0 if not out else int(b['start'])
            out.append(f'{s // 60}:{s % 60:02d} {ep["scenes"][b["scene"]]["title"]}')
    return '\n'.join(out)


def long_url(ep, hist):
    t = ep.get('related_long_topic')
    v = next((e['video_id'] for e in reversed(hist['episodes']) if e.get('kind') == 'long' and e.get('topic_id') == t), None)
    return f'https://youtu.be/{v}' if v else 'https://www.youtube.com/' + CFG['channel']['handle']


def props(ep, timeline, clips, total, imgs=None):
    imgs = imgs or {}
    fps = CFG['long_video']['fps']
    lim = CFG['short'] if ep['kind'] == 'short' else CFG['long_video']
    f = lambda s: int(round(s * fps))
    beats_src = [b for s in ep['scenes'] for b in s['beats']]
    beats = []
    for i, (b, t) in enumerate(zip(beats_src, timeline)):
        nxt = timeline[i + 1]['start'] if i + 1 < len(timeline) else total
        beats.append({'text': b['text'], 'visual': b['visual'], 'clip': clips.get(i), 'imgs': imgs.get(i, []), 'scene': t['scene'],
                      'from': f(t['start']), 'dur': max(1, f(nxt) - f(t['start'])),
                      'words': [{'w': w['w'], 'f0': f(w['t0']), 'f1': f(w['t1'])} for w in t['words']]})
    scenes = []
    for si, s in enumerate(ep['scenes']):
        first = next(b for b in beats if b['scene'] == si)
        scenes.append({'title': s['title'], 'layer': s.get('layer'), 'from': first['from']})
    p = {'id': ep['id'], 'kind': ep['kind'], 'fps': fps, 'width': lim['width'], 'height': lim['height'],
         'durationInFrames': f(total), 'style': CFG['style'], 'handle': CFG['channel']['handle'],
         'scenes': scenes, 'beats': beats, 'thumbText': ep.get('thumb_text') or ep['upload']['title'],
         'thumbHighlight': ep.get('thumb_highlight', ''), 'thumbClip': next((c for c in clips.values()), None),
         'thumbImg': next((x['src'] for lst in imgs.values() for x in lst if not x['cut']), None),
         'quiz': None}            # explicit: Remotion merges these props over the demo defaults, which contain a quiz
    if ep.get('quiz'):
        cd = timeline[0].get('countdown') or [timeline[0]['end'], timeline[0]['end'] + 4]
        p['quiz'] = {**ep['quiz'], 'cdFrom': f(cd[0]), 'cdTo': f(cd[1])}
    return p


def remotion(*args):
    npx = shutil.which('npx') or 'npx'
    extra = [f'--browser-executable={os.environ["REMOTION_BROWSER"]}'] if os.environ.get('REMOTION_BROWSER') else []
    sh(npx, 'remotion', *args, *extra, cwd=ROOT / 'render')


def build(ep, out):
    out.mkdir(parents=True, exist_ok=True)
    wav, timeline, total = tts.voice(ep, out)
    clips = media.fetch_clips(ep, timeline)
    imgs = media.fetch_images(ep)
    p = props(ep, timeline, clips, total, imgs)
    if ep['kind'] == 'long':
        p['coachImg'], p['coachCut'] = media.coach_photo(ep)
    save(out / 'props.json', p)
    comp = 'Long' if ep['kind'] == 'long' else 'Short'
    silent = out / 'silent.mp4'
    remotion('render', 'src/index.ts', comp, str(silent), f'--props={out / "props.json"}', '--codec=h264', '--crf=20', '--muted',
             '--log=error')
    thumb = None
    if ep['kind'] == 'long':
        thumb = out / 'thumb.jpg'
        remotion('still', 'src/index.ts', 'Thumb', str(thumb), f'--props={out / "props.json"}', '--image-format=jpeg', '--log=error')
    final = out / 'final.mp4'
    track = audio.mix(silent, wav, timeline, ep, final, total)
    real = qa.check(final, ep, total)
    return final, thumb, timeline, track, real


def description(ep, timeline, track, hist):
    d = ep['upload']['description'].replace('{CHAPTERS}', chapters(ep, timeline)).replace('{LONG_URL}', long_url(ep, hist))
    if ep.get('sources') and not any(s['url'] in d for s in ep['sources']):
        d += '\n\nKaynaklar:\n' + '\n'.join(f'• {s["title"]}: {s["url"]}' for s in ep['sources'])
    credits = []
    for s in ep['scenes']:
        for b in s['beats']:
            for pic in b['visual'].get('images', []):
                if pic.get('credit') and pic['credit'] not in credits:
                    credits.append(pic['credit'])
    if credits:
        d += '\n\nGörseller:\n' + '\n'.join(f'• {c}' for c in credits)
    if ep['upload'].get('hashtags'):
        d += '\n\n' + ' '.join(ep['upload']['hashtags'])
    credit = audio.music_credit(track)
    return d + '\n\n' + CFG['disclaimer'] + (f'\n\nMüzik: {credit}' if credit else '')


def post_pending_comments(yt, hist):
    from . import youtube
    for e in hist['episodes']:
        if e.get('comment_pending') and e.get('video_id'):
            try:
                if youtube.is_public(yt, e['video_id']):
                    youtube.comment(yt, e['video_id'], e['comment_pending']); e.pop('comment_pending'); print('comment posted', e['id'])
            except Exception as ex:
                print('comment failed', e['id'], ex)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--id')
    ap.add_argument('--file', help='build one episode file directly (implies --dry-run)')
    a = ap.parse_args()
    if a.file:
        a.dry_run = True
    if CFG['schedule'].get('paused') and not a.id:
        print('paused in config/channel.json'); return
    hist = load(HIST, {'episodes': []})
    today = now().strftime('%Y-%m-%d')
    left = CFG['schedule']['max_uploads_per_day'] - sum(1 for e in hist['episodes'] if (e.get('uploaded_at') or '').startswith(today))
    yt = None
    if not a.dry_run:
        from . import youtube
        yt = youtube.client()
        post_pending_comments(yt, hist); save(HIST, hist)
    done_ids = {e['id'] for e in hist['episodes']}
    report = []
    for f, ep in due(a.id, a.file):
        if ep['id'] in done_ids:
            continue
        if not a.dry_run and left <= 0:
            report.append(f'⏸ {ep["id"]}: daily upload cap reached, tomorrow'); break
        v = subprocess.run([sys.executable, str(ROOT / 'tools/validate.py'), '--no-style', str(f)], capture_output=True, text=True)
        if v.returncode != 0:
            report.append(f'❌ {ep["id"]}: invalid\n{v.stdout[-800:]}'); continue
        out = WORK / ep['id']
        try:
            final, thumb, timeline, track, secs = build(ep, out)
        except Exception as e:
            traceback.print_exc()
            report.append(f'❌ {ep["id"]}: build failed: {str(e)[:500]}')
            late = now() - dt.datetime.fromisoformat(ep['publish_at'].replace('Z', '+00:00'))
            if late > dt.timedelta(hours=24) and not a.dry_run:          # give up: park it so the queue keeps moving
                (ROOT / 'failed').mkdir(exist_ok=True); shutil.move(str(f), ROOT / 'failed' / f.name)
            continue
        desc = description(ep, timeline, track, hist)
        save(out / 'upload.json', {'title': ep['upload']['title'], 'description': desc, 'tags': ep['upload']['tags']})
        if a.dry_run:
            report.append(f'🧪 TEST (yüklenmedi / not uploaded): {ep["id"]} built OK, {secs // 60:.0f}:{secs % 60:02.0f} - video in the run artifacts'); continue
        from . import youtube
        title = ep['upload']['title'] + (' #Shorts' if ep['kind'] == 'short' and '#shorts' not in ep['upload']['title'].lower() else '')
        vid = youtube.upload(yt, final, ep, title, desc, ep['upload']['tags'])
        thumb_ok = youtube.set_thumb(yt, vid, thumb) if thumb else None
        try:
            youtube.add_to_playlist(yt, vid, ep.get('playlist') or ('exam' if ep['kind'] == 'long' else ep.get('short_type', 'gym')))
        except Exception as e:
            print('playlist failed', e)
        pin = ep['upload']['pinned_comment'].replace('{LONG_URL}', long_url(ep, hist))
        hist['episodes'].append({'id': ep['id'], 'kind': ep['kind'], 'topic_id': ep['topic_id'], 'title': ep['upload']['title'],
                                 'video_id': vid, 'publish_at': ep['publish_at'], 'uploaded_at': now().isoformat(timespec='seconds'),
                                 'seconds': round(secs, 1), 'music': track, 'thumb': thumb_ok, 'comment_pending': pin})
        save(HIST, hist)
        (ROOT / 'archive').mkdir(exist_ok=True); shutil.move(str(f), ROOT / 'archive' / f.name)
        for bank in ('data/topics.json', 'data/quiz.json', 'data/gym_ideas.json'):
            items = load(bank, [])
            for x in items:
                if x['id'] == ep['topic_id']:
                    x['status'] = 'done'; x['video_id'] = vid
            save(bank, items)
        left -= 1
        report.append(f'✅ {ep["id"]} -> https://youtu.be/{vid} (yayın {ep["publish_at"]})')
    q = len(list((ROOT / 'queue').glob('*.json')))
    if q < 3 and not a.dry_run:
        report.append(f'⚠️ queue has only {q} episodes left - the weekly writer must run')
    if report:
        msg = 'Rez Fitlab\n' + '\n'.join(report); print(msg); notify.send(msg)
    else:
        print('nothing due')
    if any(r.startswith('❌') for r in report):
        sys.exit(1)


if __name__ == '__main__':
    main()
