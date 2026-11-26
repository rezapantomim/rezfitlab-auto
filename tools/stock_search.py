"""Search free stock video (Pexels + Pixabay) and build a labelled contact sheet so the writer can LOOK before choosing.

Usage: python tools/stock_search.py "barbell back squat side view" --orientation landscape|portrait [--n 8]
Writes work/stock/<slug>.jpg (contact sheet, 3 frames per candidate where available) and work/stock/<slug>.json
(candidates: provider, id, url to download, duration, size). Prints the two paths.
Keys: PEXELS_API_KEY and/or PIXABAY_API_KEY in .env (both free).
"""
import argparse, io, json, re, sys
import requests
from PIL import Image, ImageDraw, ImageFont
from common import ROOT, env

UA = {'User-Agent': 'rezfitlab-writer/1.0'}


def best_file(files, want_w, want_h):
    """Smallest file that still covers the target size, else the largest."""
    ok = [f for f in files if f.get('width') and f['width'] >= want_w * 0.95 and f['height'] >= want_h * 0.95]
    if ok:
        return min(ok, key=lambda f: f['width'] * f['height'])
    return max(files, key=lambda f: (f.get('width') or 0) * (f.get('height') or 0)) if files else None


def pexels(q, orient, n, W, H):
    key = env('PEXELS_API_KEY')
    if not key:
        return []
    r = requests.get('https://api.pexels.com/videos/search', headers={'Authorization': key, **UA},
                     params={'query': q, 'orientation': orient, 'per_page': n, 'size': 'medium'}, timeout=30)
    r.raise_for_status()
    out = []
    for v in r.json().get('videos', []):
        files = [{'width': f.get('width'), 'height': f.get('height'), 'link': f['link']} for f in v.get('video_files', [])
                 if f.get('file_type') == 'video/mp4']
        f = best_file(files, W, H)
        if not f:
            continue
        pics = [p['picture'] for p in v.get('video_pictures', [])]
        frames = [pics[i] for i in sorted({0, len(pics) // 2, len(pics) - 1}) if pics] or [v.get('image')]
        out.append({'provider': 'pexels', 'id': str(v['id']), 'url': f['link'], 'w': f['width'], 'h': f['height'],
                    'duration': v.get('duration'), 'page': v.get('url'), 'frames': frames})
    return out


def pixabay(q, orient, n, W, H):
    key = env('PIXABAY_API_KEY')
    if not key:
        return []
    r = requests.get('https://pixabay.com/api/videos/', params={'key': key, 'q': q[:100], 'per_page': max(3, n), 'safesearch': 'true'},
                     headers=UA, timeout=30)
    r.raise_for_status()
    out = []
    for v in r.json().get('hits', []):
        files = [{'width': x.get('width'), 'height': x.get('height'), 'link': x['url'], 'thumb': x.get('thumbnail')}
                 for x in (v.get('videos') or {}).values() if x.get('url')]
        f = best_file(files, W, H)
        if not f:
            continue
        thumb = next((x['thumb'] for x in files if x.get('thumb')), None)
        out.append({'provider': 'pixabay', 'id': str(v['id']), 'url': f['link'], 'w': f['width'], 'h': f['height'],
                    'duration': v.get('duration'), 'page': v.get('pageURL'), 'frames': [thumb] if thumb else []})
    return out[:n]


def fetch(url):
    try:
        r = requests.get(url, headers=UA, timeout=30); r.raise_for_status()
        return Image.open(io.BytesIO(r.content)).convert('RGB')
    except Exception:
        return None


def sheet(cands, dst):
    cw, ch, pad = 300, 170, 6
    rows = len(cands)
    img = Image.new('RGB', (pad + 3 * (cw + pad) + 260, pad + rows * (ch + pad)), (20, 22, 26))
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype('arial.ttf', 22)
    except Exception:
        font = ImageFont.load_default()
    for i, c in enumerate(cands):
        y = pad + i * (ch + pad)
        for j, u in enumerate(c['frames'][:3]):
            fr = fetch(u)
            if fr:
                fr.thumbnail((cw, ch)); img.paste(fr, (pad + j * (cw + pad), y))
        d.text((pad + 3 * (cw + pad) + 8, y + 8), f"#{i}  {c['provider']}\n{c['w']}x{c['h']}\n{c['duration']} s", fill=(255, 200, 60), font=font)
    img.save(dst, quality=82)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('query')
    ap.add_argument('--orientation', default='landscape', choices=['landscape', 'portrait'])
    ap.add_argument('--n', type=int, default=8)
    a = ap.parse_args()
    W, H = (1920, 1080) if a.orientation == 'landscape' else (1080, 1920)
    half = max(2, a.n // 2)
    c = []
    for fn in (pexels, pixabay):
        try:
            c += fn(a.query, a.orientation, half, W, H)
        except Exception as e:
            print(f'{fn.__name__} failed: {e}', file=sys.stderr)
    if not c:
        print('NO_RESULTS (missing keys or nothing found) -> use a diagram / exercise_card / keyword visual'); return
    slug = re.sub(r'[^a-z0-9]+', '-', a.query.lower()).strip('-')[:50] + '-' + a.orientation[0]
    d = ROOT / 'work/stock'; d.mkdir(parents=True, exist_ok=True)
    sheet(c, d / f'{slug}.jpg')
    for x in c:
        x.pop('frames', None)
    (d / f'{slug}.json').write_text(json.dumps(c, indent=1), encoding='utf8')
    print(d / f'{slug}.jpg'); print(d / f'{slug}.json')


if __name__ == '__main__':
    main()
