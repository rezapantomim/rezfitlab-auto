"""Automatic quality gate before upload. Raises QAError with every problem found."""
import json, re, subprocess
from .common import CFG, sh, duration


class QAError(Exception):
    pass


def check(video, ep, expected):
    errs = []
    info = json.loads(sh('ffprobe', '-v', 'error', '-show_streams', '-of', 'json', video))
    v = next((s for s in info['streams'] if s['codec_type'] == 'video'), None)
    a = next((s for s in info['streams'] if s['codec_type'] == 'audio'), None)
    lim = CFG['short'] if ep['kind'] == 'short' else CFG['long_video']
    if not v or not a:
        errs.append('missing video or audio stream')
    elif (int(v['width']), int(v['height'])) != (lim['width'], lim['height']):
        errs.append(f'size {v["width"]}x{v["height"]}')
    d = duration(video)
    if abs(d - expected) > 1.5:
        errs.append(f'duration {d:.1f} s, expected {expected:.1f} s')
    if not lim['min_seconds'] - 2 <= d <= lim['max_seconds'] + (2 if ep['kind'] == 'short' else 30):
        errs.append(f'duration {d:.1f} s outside limits')
    if ep['kind'] == 'short' and d > 59:
        errs.append('Short longer than 59 s')
    # loudness (an empty or broken audio track shows up as -inf / far too quiet)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(video), '-af', 'loudnorm=print_format=json', '-f', 'null', '-'],
                                     capture_output=True, text=True)
    m = re.search(r'"input_i"\s*:\s*"(-?[\d.]+|-inf)"', r.stderr)
    if not m or m.group(1) == '-inf' or float(m.group(1)) < -20 or float(m.group(1)) > -10:
        errs.append(f'loudness {m.group(1) if m else "?"} LUFS')
    # long black stretches (render failure)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(video), '-vf', 'blackdetect=d=1.5:pix_th=0.06', '-an', '-f', 'null', '-'],
                                     capture_output=True, text=True)
    blacks = re.findall(r'black_duration:([\d.]+)', r.stderr)
    if blacks:
        errs.append(f'black segments: {blacks[:3]}')
    if errs:
        raise QAError('; '.join(errs))
    return d
