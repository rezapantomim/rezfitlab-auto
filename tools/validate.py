"""Validate episode files against the contract + the channel limits. Used locally by the writer and again in GitHub Actions.

Usage: python tools/validate.py work/episodes/*.json   (exit code 1 if any file fails)
       python tools/validate.py --no-style FILE         (publisher: contract only; the visual-style rules gate the writer, not uploads)
"""
import json, pathlib, sys
from jsonschema import Draft202012Validator
from common import ROOT, CFG, load, words

SCHEMA = json.loads((ROOT / 'schema/episode.schema.json').read_text(encoding='utf8'))
V = Draft202012Validator(SCHEMA)
WPS = CFG['voice']['words_per_second_target']

# visual style (owner, 2026-11-27: "too much is written - go towards motion and collages")
TEXT_TYPES = {'keyword', 'title', 'list', 'stat', 'compare', 'exercise_card', 'quote'}
PICTURE_TYPES = {'image', 'collage', 'split', 'stock', 'diagram'}
MAX_TEXT_ONLY_SHARE = 0.30        # beats whose visual is only words (no picture / clip / diagram / icons)
MAX_WORDS_PER_STRING = 4          # every on-screen string: text, items, cues, labels, captions...
MAX_PICTURE_REUSE = 3             # one picture on at most 3 beats


def rich(v):
    """A picture-driven visual: picture, collage, split screen, stock clip, diagram, or a text visual with a photo behind it."""
    return v['type'] in PICTURE_TYPES or bool(v.get('images'))


def text_only(v):
    return v['type'] in TEXT_TYPES and not v.get('images')


def on_screen_strings(v):
    out = [v.get(k) for k in ('text', 'left', 'right', 'label', 'overlay')]
    out += v.get('items') or []
    out += v.get('cues') or []
    out += [l['text'] for l in v.get('labels') or []]
    out += [x.get('caption') for x in v.get('images') or []]
    out += [x.get('label') for x in v.get('icons') or []]
    return [s for s in out if s]


def style_errors(ep, beats):
    errs = []
    skip = 2 if ep.get('quiz') else 0          # quiz Shorts: the question card covers the first two beats
    seen = beats[skip:]
    if not seen:
        return errs
    t_only = [i + skip for i, b in enumerate(seen) if text_only(b['visual'])]
    share = len(t_only) / len(seen)
    if share > MAX_TEXT_ONLY_SHARE:
        errs.append(f'style: {len(t_only)}/{len(seen)} beats are text-only ({share:.0%} > {MAX_TEXT_ONLY_SHARE:.0%}): '
                    f'give them a photo (images), or use image / collage / split / stock / diagram / icons (beats {t_only[:12]})')
    gap = 0
    for i, b in enumerate(seen):
        gap = 0 if rich(b['visual']) else gap + 1
        if gap > 1:
            errs.append(f'style: beats {i + skip - 1}-{i + skip} both lack a picture visual (a picture, collage, split, stock clip, '
                        'diagram or photo-backed text is needed at least every 2nd beat)'); break
    for i, b in enumerate(beats):
        v = b['visual']
        long = [s for s in on_screen_strings(v) if len(s.split()) > MAX_WORDS_PER_STRING]
        if long:
            errs.append(f'style: beat {i}: on-screen text over {MAX_WORDS_PER_STRING} words: {long[0]!r}')
        n = len(v.get('items') or []) or len(v.get('cues') or [])
        if n > 3:
            errs.append(f'style: beat {i}: {v["type"]} with {n} entries (max 3; split it or use icons)')
        if v['type'] == 'split' and len(v.get('images') or []) != 2:
            errs.append(f'style: beat {i}: split needs exactly 2 images')
        if v['type'] == 'icons' and not v.get('icons'):
            errs.append(f'style: beat {i}: icons visual without icons')
    use = {}
    for b in beats:
        for pic in b['visual'].get('images') or []:
            use[(pic['provider'], pic['id'])] = use.get((pic['provider'], pic['id']), 0) + 1
    over = [k[1] for k, n in use.items() if n > MAX_PICTURE_REUSE]
    if over:
        errs.append(f'style: pictures used on more than {MAX_PICTURE_REUSE} beats: {over[:5]}')
    return errs


def known_titles(skip):
    t = set()
    for d in ('queue', 'archive'):
        for f in (ROOT / d).glob('*.json'):
            if f.resolve() != skip.resolve():
                try: t.add(json.loads(f.read_text(encoding='utf8'))['upload']['title'].strip().lower())
                except Exception: pass
    for e in load('data/history.json', {'episodes': []})['episodes']:
        t.add(e.get('title', '').strip().lower())
    return t


def check(path, style=True):
    p = pathlib.Path(path)
    ep = json.loads(p.read_text(encoding='utf8'))
    errs = [f'{"/".join(map(str, e.path)) or "(root)"}: {e.message}' for e in V.iter_errors(ep)]
    if errs:
        return errs
    kind = ep['kind']
    lim = CFG['long_video'] if kind == 'long' else CFG['short']
    beats = [b for s in ep['scenes'] for b in s['beats']]
    n = sum(words(b['text']) for b in beats)
    if kind == 'short' and ep.get('quiz'):
        n += 0  # quiz options are on screen; the countdown adds time below
    est = n / WPS + (ep.get('quiz', {}).get('countdown_s', 4) if ep.get('quiz') else 0)
    if not lim['words_min'] <= n <= lim['words_max']:
        errs.append(f'{n} words, allowed {lim["words_min"]}-{lim["words_max"]}')
    if est > lim['max_seconds']:
        errs.append(f'estimated {est:.0f} s > {lim["max_seconds"]} s')
    if kind == 'short' and not ep.get('short_type'):
        errs.append('short without short_type')
    if ep.get('short_type') == 'quiz' and not ep.get('quiz'):
        errs.append('quiz Short without quiz block')
    if kind == 'long':
        layers = {s.get('layer') for s in ep['scenes']}
        for need in ('hook', 'exam', 'gym', 'summary'):
            if need not in layers:
                errs.append(f'long video missing layer "{need}"')
        if len(ep.get('sources', [])) < 2:
            errs.append('long video needs >= 2 sources')
    for i, b in enumerate(beats):
        v = b['visual']
        if v['type'] == 'stock' and not (v.get('clip') and v['clip'].get('checked')):
            errs.append(f'beat {i}: stock visual without a visually checked clip')
        if v['type'] == 'diagram' and not v.get('name'):
            errs.append(f'beat {i}: diagram without name')
        if v['type'] in ('image', 'collage'):
            pics = v.get('images') or []
            if not pics:
                errs.append(f'beat {i}: {v["type"]} without images')
            if v['type'] == 'collage' and len(pics) < 2:
                errs.append(f'beat {i}: collage needs 2-4 images')
            for pic in pics:
                lic = (pic.get('license') or '').lower()
                if pic['provider'] == 'wikimedia' and not lic:
                    errs.append(f'beat {i}: wikimedia image without license')
                if pic['provider'] == 'wikimedia' and not lic.startswith(('public domain', 'pd', 'cc0')) and not pic.get('credit'):
                    errs.append(f'beat {i}: {pic["id"]} needs a credit line ({pic.get("license")})')
                if any(x in lic for x in ('-sa', ' sa', 'nc', 'nd')):
                    errs.append(f'beat {i}: licence {pic.get("license")} not allowed (no SA/NC/ND)')
    run = 1
    for a, b in zip(beats, beats[1:]):
        run = run + 1 if a['visual']['type'] == b['visual']['type'] and a['visual']['type'] != 'stock' else 1
        if run > 3:
            errs.append('more than 3 identical non-stock visuals in a row'); break
    if style:
        errs += style_errors(ep, beats)
    if ep['upload']['title'].strip().lower() in known_titles(p):
        errs.append('title already used')
    if not ep['critic']['passed'] or ep['critic']['score'] < 7.5:
        errs.append(f'critic did not pass (score {ep["critic"]["score"]})')
    if not p.stem == ep['id']:
        errs.append(f'file name must be {ep["id"]}.json')
    return errs


def main(paths):
    style = '--no-style' not in paths
    paths = [x for x in paths if x != '--no-style']
    bad = 0
    for path in paths:
        e = check(path, style)
        print(('OK   ' if not e else 'FAIL ') + str(path))
        for x in e:
            print('     -', x)
        bad += bool(e)
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main(sys.argv[1:])
