"""Download the stock clips and pictures the writer chose and normalise them into render/public/ (clips/, img/)."""
import io, json, os, pathlib, sys, time, urllib.error, urllib.parse, urllib.request
from PIL import Image
from .common import PUBLIC, CFG, sh, duration

# Wikimedia throttles clients whose User-Agent does not follow its etiquette format
UA = 'Mozilla/5.0 (compatible; rezfitlab-publisher/1.0; +https://www.mediawiki.org/wiki/API:Etiquette)'


def _get(url, tries=4):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or i == tries - 1:
                raise
            time.sleep(5 * (i + 1))


def _picture(pic):
    """Download a chosen picture. Pixabay image links expire after about a day: on failure ask the API for a fresh link by id."""
    try:
        return _get(pic['url'])
    except Exception as e:
        key = os.environ.get('PIXABAY_API_KEY')
        if pic.get('provider') != 'pixabay' or not key:
            raise
        print(f'pixabay {pic["id"]}: stored link failed ({e}), asking the API for a fresh one', file=sys.stderr)
        q = urllib.parse.urlencode({'key': key, 'id': pic['id']})
        hits = json.loads(_get(f'https://pixabay.com/api/?{q}')).get('hits') or []
        if not hits:
            raise
        return _get(hits[0]['largeImageURL'])


_REMBG = None


def _cutout(im):
    """Remove the background with rembg (free, open source). Returns None when rembg is not installed."""
    global _REMBG
    try:
        if _REMBG is None:
            from rembg import new_session
            _REMBG = new_session('u2net')
        from rembg import remove
        return remove(im, session=_REMBG)
    except Exception as e:
        print('cutout skipped:', e, file=sys.stderr)
        return None


def coach_photo(ep):
    """Copy the chosen coach pose to render/public/coach/ (background removed when rembg is available). Returns (src, cut) or (None, False)."""
    from .common import ROOT
    pose = ep.get('thumb_pose') or 'portrait-gym'
    src = ROOT / 'assets/coach/poses' / f'{pose}.png'
    if not src.exists():
        return None, False
    out = PUBLIC / 'coach'; out.mkdir(parents=True, exist_ok=True)
    im = Image.open(src).convert('RGB')
    if im.height < 1000:                                   # small panels: upscale once so the thumbnail stays sharp enough
        im = im.resize((im.width * 2, im.height * 2), Image.LANCZOS)
    cut = _cutout(im)
    if cut is not None:
        cut = cut.crop(cut.getbbox() or (0, 0, cut.width, cut.height))
        cut.save(out / f'{pose}-cut.png'); return f'coach/{pose}-cut.png', True
    im.save(out / f'{pose}.jpg', quality=92); return f'coach/{pose}.jpg', False


def fetch_images(ep):
    """visual.images[k] (any visual type) -> render/public/img/<id>_<beat>_<k>.(jpg|png); returns {beat_index: [{src, w, h, cut}, ...]}.
    A picture used on several beats is downloaded (and cut out) only once."""
    out = PUBLIC / 'img'; out.mkdir(parents=True, exist_ok=True)
    beats = [b for s in ep['scenes'] for b in s['beats']]
    srcs, done = {}, {}
    for i, b in enumerate(beats):
        v = b['visual']
        if not v.get('images'):
            continue
        lst = []
        for k, pic in enumerate(v['images']):
            key = (pic['provider'], pic['id'], bool(pic.get('cutout')))
            if key not in done:
                im = Image.open(io.BytesIO(_picture(pic)))
                im = im.convert('RGBA') if im.mode in ('RGBA', 'LA', 'P') else im.convert('RGB')
                im.thumbnail((1600, 1600))
                if pic.get('cutout'):
                    cut = _cutout(im.convert('RGB'))
                    if cut is not None:
                        im = cut
                name = f'{ep["id"]}_{i:03d}_{k}.' + ('png' if im.mode == 'RGBA' else 'jpg')
                if im.mode == 'RGBA':
                    im.save(out / name)
                else:
                    im.save(out / name, quality=90)
                done[key] = {'src': f'img/{name}', 'w': im.width, 'h': im.height, 'cut': im.mode == 'RGBA'}
            lst.append(done[key])
        srcs[i] = lst
    return srcs


def fetch_clips(ep, timeline):
    vertical = ep['kind'] == 'short'
    W, H = (CFG['short']['width'], CFG['short']['height']) if vertical else (CFG['long_video']['width'], CFG['long_video']['height'])
    out = PUBLIC / 'clips'; out.mkdir(parents=True, exist_ok=True)
    beats = [b for s in ep['scenes'] for b in s['beats']]
    paths = {}
    for i, b in enumerate(beats):
        c = b['visual'].get('clip')
        if b['visual']['type'] != 'stock' or not c:
            continue
        need = timeline[i]['end'] - timeline[i]['start'] + 1.0
        raw = out / f"raw_{c['provider']}_{c['id']}.mp4"
        if not raw.exists():
            raw.write_bytes(_get(c['url']))
        dst = out / f'{ep["id"]}_{i:03d}.mp4'
        src_len = duration(raw); start = min(float(c.get('start', 0)), max(0, src_len - need))
        loop = ['-stream_loop', '-1'] if src_len < need + start else []
        vf = f'scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps=30,setsar=1'
        sh('ffmpeg', '-v', 'error', '-y', *loop, '-ss', f'{start:.2f}', '-i', raw, '-t', f'{need:.2f}', '-an', '-vf', vf,
           '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', dst)
        paths[i] = f'clips/{dst.name}'
    return paths
