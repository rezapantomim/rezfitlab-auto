"""Narration: Edge TTS (free, tr-TR-AhmetNeural) with word timings; Piper (free, offline) as fallback.

voice(ep, out_dir) -> (wav_path, timeline) where timeline = list of beats with start/end seconds and word timings.
Quiz Shorts: a silent countdown (quiz.countdown_s) is inserted after the first beat (the question).
"""
import asyncio, pathlib, re, subprocess, sys, urllib.request
import numpy as np, soundfile as sf
from .common import CFG, ROOT, sh

SR = 48000
GAP_BEAT, GAP_SCENE = 0.22, 0.55


async def _edge_async(text, voice, rate, mp3):
    import edge_tts
    try:
        com = edge_tts.Communicate(text, voice, rate=rate, boundary='WordBoundary')
    except TypeError:                                   # older edge-tts: word boundaries are the default
        com = edge_tts.Communicate(text, voice, rate=rate)
    words = []
    with open(mp3, 'wb') as f:
        async for ch in com.stream():
            if ch['type'] == 'audio':
                f.write(ch['data'])
            elif ch['type'] == 'WordBoundary':
                words.append({'w': ch['text'], 't0': ch['offset'] / 1e7, 't1': (ch['offset'] + ch['duration']) / 1e7})
    return words


def _edge(text, mp3, voice, rate):
    for attempt in range(4):
        try:
            return asyncio.run(_edge_async(text, voice, rate, mp3))
        except Exception as e:
            print('edge-tts retry', attempt, e, file=sys.stderr)
    raise RuntimeError('edge-tts failed 4 times')


def _piper(text, wav):
    fb = CFG['voice']['fallback']; name = fb['model']
    d = ROOT / 'work/piper'; d.mkdir(parents=True, exist_ok=True)
    lang, voice, q = name.split('-')                      # tr_TR, fahrettin, medium
    base = f'https://huggingface.co/rhasspy/piper-voices/resolve/main/{lang.split("_")[0]}/{lang}/{voice}/{q}/{name}.onnx'
    for suf in ('', '.json'):
        f = d / f'{name}.onnx{suf}'
        if not f.exists():
            urllib.request.urlretrieve(base + suf, f)
    subprocess.run([sys.executable, '-m', 'piper', '-m', str(d / f'{name}.onnx'), '-f', str(wav)], input=text.encode('utf8'), check=True)


def _load(path):
    """Decode any audio file to mono float32 at SR via ffmpeg."""
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(raw, dtype=np.float32).copy()
    nz = np.where(np.abs(a) > 0.01)[0]                    # trim leading/trailing silence, keep 40 ms
    if len(nz):
        a = a[max(0, nz[0] - int(0.04 * SR)): nz[-1] + int(0.08 * SR)]
    return a, (nz[0] - int(0.04 * SR)) / SR if len(nz) else 0.0


def _even_words(text, dur):
    ws = text.split(); total = sum(len(w) for w in ws) or 1; t = 0.0; out = []
    for w in ws:
        d = dur * len(w) / total; out.append({'w': w, 't0': t, 't1': t + d}); t += d
    return out


def voice(ep, out_dir):
    out_dir = pathlib.Path(out_dir); seg = out_dir / 'tts'; seg.mkdir(parents=True, exist_ok=True)
    vc = {**CFG['voice']['edge'], **(ep.get('voice') or {})}
    engine = CFG['voice']['engine']
    chunks, timeline, t = [], [], 0.0
    beats = [(si, s, b) for si, s in enumerate(ep['scenes']) for b in s['beats']]
    for i, (si, scene, b) in enumerate(beats):
        say = b.get('say') or b['text']
        words = None
        if engine == 'edge':
            try:
                mp3 = seg / f'{i:03d}.mp3'
                words = _edge(say, mp3, vc['voice'], vc['rate'])
                a, lead = _load(mp3)
            except Exception as e:
                print('edge failed, falling back to piper:', e, file=sys.stderr); engine = 'piper'
        if engine == 'piper':
            wav = seg / f'{i:03d}.wav'; _piper(say, wav); a, lead = _load(wav)
        dur = len(a) / SR
        if words and say == b['text']:
            words = [{'w': w['w'], 't0': max(0, w['t0'] - lead), 't1': max(0, w['t1'] - lead)} for w in words]
        else:
            words = _even_words(b['text'], dur)            # pronunciation override or no timings -> even split of the shown text
        timeline.append({'i': i, 'scene': si, 'start': t, 'end': t + dur, 'words': [{**w, 't0': w['t0'] + t, 't1': w['t1'] + t} for w in words]})
        chunks.append(a); t += dur
        nxt = beats[i + 1][0] if i + 1 < len(beats) else None
        gap = GAP_SCENE if nxt is not None and nxt != si else GAP_BEAT
        if i == 0 and ep.get('quiz'):
            gap = float(ep['quiz'].get('countdown_s', 4)) + 0.3
            timeline[-1]['countdown'] = [t + 0.15, t + gap - 0.15]
        if nxt is not None:
            chunks.append(np.zeros(int(gap * SR), dtype=np.float32)); t += gap
    tail = np.zeros(int(0.6 * SR), dtype=np.float32)
    audio = np.concatenate(chunks + [tail])
    peak = np.max(np.abs(audio)) or 1
    audio = audio / peak * 0.89
    wav = out_dir / 'voice.wav'; sf.write(wav, audio, SR, subtype='PCM_16')
    return wav, timeline, len(audio) / SR
