"""Final sound: narration + optional music bed (ducked under the voice) + light SFX, loudness-normalised, muxed onto the video.

Music: put free tracks (YouTube Audio Library / CC0) in assets/music/*.mp3 with their licence line in assets/music/CREDITS.txt.
No music files -> voice + SFX only. SFX: assets/sfx/<name>.wav (whoosh, pop, impact, tick, reveal, riser), optional.
"""
import random
from .common import ROOT, CFG, sh

A = CFG['audio']


def pick_music(seed):
    tracks = sorted((ROOT / 'assets/music').glob('*.mp3'))
    return random.Random(seed).choice(tracks) if tracks else None


def mix(video, voice_wav, timeline, ep, dst, total):
    music = pick_music(ep['id'])
    sfx_dir = ROOT / 'assets/sfx'
    beats = [b for s in ep['scenes'] for b in s['beats']]
    inputs, filters, labels = ['-i', video, '-i', voice_wav], [], []
    n = 2
    filters.append('[1:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[vo][vokey]')
    if music:
        inputs += ['-stream_loop', '-1', '-i', music]
        filters.append(f'[{n}:a]atrim=0:{total:.2f},aformat=sample_rates=48000:channel_layouts=stereo,volume={A["music_gain_db"]}dB,'
                       f'afade=t=out:st={max(0, total - 3):.2f}:d=3[mus]')
        filters.append('[mus][vokey]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[musd]')
        labels.append('[musd]'); n += 1
    else:
        filters.append('[vokey]anullsink')
    k = 0
    for i, b in enumerate(beats):
        name = b.get('sfx') or 'none'
        f = sfx_dir / f'{name}.wav'
        if name == 'none' or not f.exists():
            continue
        ms = int(timeline[i]['start'] * 1000)
        inputs += ['-i', f]
        filters.append(f'[{n}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume={A["sfx_gain_db"]}dB,adelay={ms}|{ms}[s{k}]')
        labels.append(f'[s{k}]'); n += 1; k += 1
    ticks = timeline[0].get('countdown') if ep.get('quiz') else None
    if ticks and (sfx_dir / 'tick.wav').exists():
        for s in range(int(ticks[0]), int(ticks[1])):
            ms = int((s + 0.5) * 1000)
            inputs += ['-i', sfx_dir / 'tick.wav']
            filters.append(f'[{n}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume={A["sfx_gain_db"]}dB,adelay={ms}|{ms}[s{k}]')
            labels.append(f'[s{k}]'); n += 1; k += 1
    filters.append(f'[vo]{"".join(labels)}amix=inputs={1 + len(labels)}:normalize=0:duration=first,'
                   f'loudnorm=I={A["target_lufs"]}:TP=-1.5:LRA=11[aout]')
    sh('ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(filters), '-map', '0:v', '-map', '[aout]',
       '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-shortest', dst)
    return music.stem if music else None


def music_credit(track):
    if not track:
        return ''
    f = ROOT / 'assets/music/CREDITS.txt'
    if f.exists():
        for line in f.read_text(encoding='utf8').splitlines():
            if line.startswith(track + ':'):
                return line.split(':', 1)[1].strip()
    return ''
