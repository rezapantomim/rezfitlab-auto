"""Download the stock clips and pictures the writer chose and normalise them into render/public/ (clips/, img/)."""
import io, pathlib, sys, time, urllib.error, urllib.request
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


def fetch_images(ep):
    """visual.images[k] -> render/public/img/<id>_<beat>_<k>.(jpg|png); returns {beat_index: [{src, w, h, cut}, ...]}."""
    out = PUBLIC / 'img'; out.mkdir(parents=True, exist_ok=True)
    beats = [b for s in ep['scenes'] for b in s['beats']]
    srcs = {}
    for i, b in enumerate(beats):
        v = b['visual']
        if v['type'] not in ('image', 'collage'):
            continue
        lst = []
        for k, pic in enumerate(v.get('images', [])):
            im = Image.open(io.BytesIO(_get(pic['url'])))
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
            lst.append({'src': f'img/{name}', 'w': im.width, 'h': im.height, 'cut': im.mode == 'RGBA'})
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
