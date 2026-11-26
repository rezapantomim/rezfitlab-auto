"""Search free pictures and build a labelled contact sheet so the writer can LOOK before choosing.

Usage:
  python tools/image_search.py "dumbbell" --source pixabay --kind photo|illustration|vector
  python tools/image_search.py "Gray's Anatomy knee ligaments" --source wikimedia
  python tools/image_search.py "abduction body movement" --source wikimedia --n 12

Sources
  pixabay   : photos / illustrations / vectors, Pixabay Content License (no attribution needed). Needs PIXABAY_API_KEY in .env.
  wikimedia : Wikimedia Commons (Gray's Anatomy plates = public domain, OpenStax figures = CC BY 4.0). No key.
              Only public-domain, CC0 and CC BY licences are returned (no SA / NC / ND), with the attribution line in "credit".
Writes work/images/<slug>.jpg (sheet) + work/images/<slug>.json (candidates). Prints both paths.
"""
import argparse, html, io, json, re, sys, time
import requests
from PIL import Image, ImageDraw, ImageFont
from common import ROOT, env

# Wikimedia throttles (429) clients whose User-Agent does not follow its etiquette format (name/version + info URL)
UA = {'User-Agent': 'Mozilla/5.0 (compatible; rezfitlab-writer/1.0; +https://www.mediawiki.org/wiki/API:Etiquette)'}
OK_LICENCE = re.compile(r'^(public domain|pd\b|pdm|cc0|cc by \d|cc-by-\d|cc by\s*\d\.\d)', re.I)


def strip(s):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', s or ''))).strip()


def pixabay(q, kind, n):
    key = env('PIXABAY_API_KEY')
    if not key:
        print('PIXABAY_API_KEY missing in .env', file=sys.stderr); return []
    r = requests.get('https://pixabay.com/api/', params={'key': key, 'q': q[:100], 'image_type': kind, 'per_page': max(3, n),
                                                         'safesearch': 'true', 'order': 'popular'}, headers=UA, timeout=30)
    r.raise_for_status()
    return [{'provider': 'pixabay', 'id': str(h['id']), 'url': h['largeImageURL'], 'thumb': h['webformatURL'],
             'w': h['imageWidth'], 'h': h['imageHeight'], 'license': 'Pixabay Content License', 'credit': '',
             'page': h['pageURL'], 'tags': h.get('tags', '')} for h in r.json().get('hits', [])][:n]


def wikimedia(q, n):
    r = requests.get('https://commons.wikimedia.org/w/api.php', headers=UA, timeout=30, params={
        'action': 'query', 'format': 'json', 'generator': 'search', 'gsrsearch': q, 'gsrnamespace': 6, 'gsrlimit': n * 3,
        'prop': 'imageinfo', 'iiprop': 'url|extmetadata|mime|size', 'iiurlwidth': 1280})   # standard thumb sizes are cached
    r.raise_for_status()
    pages = sorted((r.json().get('query') or {}).get('pages', {}).values(), key=lambda p: p.get('index', 0))
    out = []
    for p in pages:
        ii = (p.get('imageinfo') or [{}])[0]
        if ii.get('mime') not in ('image/jpeg', 'image/png', 'image/svg+xml', 'image/gif'):
            continue
        md = ii.get('extmetadata') or {}
        lic = strip((md.get('LicenseShortName') or {}).get('value'))
        if not OK_LICENCE.match(lic) or re.search(r'\b(sa|nc|nd)\b', lic, re.I):
            continue
        artist = strip((md.get('Artist') or {}).get('value')) or 'Wikimedia Commons'
        title = p['title'].replace('File:', '')
        needs = not lic.lower().startswith(('public domain', 'pd', 'cc0'))
        url = (ii.get('thumburl') or ii['url']).split('?')[0]
        prev = url.replace('/1280px-', '/500px-') if '/1280px-' in url else url
        out.append({'provider': 'wikimedia', 'id': title, 'url': url, 'thumb': prev,
                    'w': ii.get('thumbwidth') or ii.get('width'), 'h': ii.get('thumbheight') or ii.get('height'), 'license': lic,
                    'credit': f'{artist[:80]}, {lic}, via Wikimedia Commons' if needs else '',
                    'page': ii.get('descriptionurl'), 'tags': strip((md.get('ImageDescription') or {}).get('value'))[:120]})
        if len(out) >= n:
            break
    return out


def fetch(url):
    """Download a preview; Wikimedia answers 429 to quick bursts, so wait and retry."""
    for wait in (0, 3, 6, 12):
        time.sleep(wait)
        try:
            r = requests.get(url, headers=UA, timeout=30)
            if r.status_code == 429:
                continue
            r.raise_for_status()
            return Image.open(io.BytesIO(r.content)).convert('RGB')
        except Exception:
            pass
    return None


def sheet(cands, dst):
    cw, ch, pad, lab = 360, 270, 8, 46
    cols = 4; rows = (len(cands) + cols - 1) // cols
    img = Image.new('RGB', (pad + cols * (cw + pad), pad + rows * (ch + lab + pad)), (24, 26, 30))
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype('arial.ttf', 18)
    except Exception:
        font = ImageFont.load_default()
    for i, c in enumerate(cands):
        x = pad + (i % cols) * (cw + pad); y = pad + (i // cols) * (ch + lab + pad)
        im = fetch(c['thumb'])
        time.sleep(1.5 if c['provider'] == 'wikimedia' else 0)
        if im:
            im.thumbnail((cw, ch)); img.paste(im, (x + (cw - im.width) // 2, y + (ch - im.height) // 2))
        else:
            d.text((x + 20, y + ch // 2 - 10), 'NO PREVIEW - do not pick', fill=(255, 80, 80), font=font)
            c['no_preview'] = True
        d.text((x, y + ch + 4), f"#{i} {c['provider']} {c['w']}x{c['h']}\n{c['license'][:40]}", fill=(255, 200, 60), font=font)
    img.save(dst, quality=82)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('query')
    ap.add_argument('--source', default='pixabay', choices=['pixabay', 'wikimedia'])
    ap.add_argument('--kind', default='photo', choices=['photo', 'illustration', 'vector', 'all'])
    ap.add_argument('--n', type=int, default=8)
    a = ap.parse_args()
    try:
        c = pixabay(a.query, a.kind, a.n) if a.source == 'pixabay' else wikimedia(a.query, a.n)
    except Exception as e:
        print('search failed:', e); return
    if not c:
        print('NO_RESULTS -> try another query, another source, or use a diagram / keyword visual'); return
    slug = re.sub(r'[^a-z0-9]+', '-', a.query.lower()).strip('-')[:50] + '-' + a.source[:3]
    d = ROOT / 'work/images'; d.mkdir(parents=True, exist_ok=True)
    sheet(c, d / f'{slug}.jpg')
    for x in c:
        x.pop('thumb', None)
    (d / f'{slug}.json').write_text(json.dumps(c, ensure_ascii=False, indent=1), encoding='utf8')
    print(d / f'{slug}.jpg'); print(d / f'{slug}.json')


if __name__ == '__main__':
    main()
