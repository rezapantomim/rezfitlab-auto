"""Validate episode files against the contract + the channel limits. Used locally by the writer and again in GitHub Actions.

Usage: python tools/validate.py work/episodes/*.json   (exit code 1 if any file fails)
"""
import json, pathlib, sys
from jsonschema import Draft202012Validator
from common import ROOT, CFG, load, words

SCHEMA = json.loads((ROOT / 'schema/episode.schema.json').read_text(encoding='utf8'))
V = Draft202012Validator(SCHEMA)
WPS = CFG['voice']['words_per_second_target']


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


def check(path):
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
    if ep['upload']['title'].strip().lower() in known_titles(p):
        errs.append('title already used')
    if not ep['critic']['passed'] or ep['critic']['score'] < 7.5:
        errs.append(f'critic did not pass (score {ep["critic"]["score"]})')
    if not p.stem == ep['id']:
        errs.append(f'file name must be {ep["id"]}.json')
    return errs


def main(paths):
    bad = 0
    for path in paths:
        e = check(path)
        print(('OK   ' if not e else 'FAIL ') + str(path))
        for x in e:
            print('     -', x)
        bad += bool(e)
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main(sys.argv[1:])
