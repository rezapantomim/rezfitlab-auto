"""Shared helpers for the GitHub Actions publisher."""
import json, pathlib, subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / 'config/channel.json').read_text(encoding='utf8'))
WORK = ROOT / 'work'
PUBLIC = ROOT / 'render/public'


def load(p, default=None):
    p = pathlib.Path(p)
    p = p if p.is_absolute() else ROOT / p
    return json.loads(p.read_text(encoding='utf8')) if p.exists() else default


def save(p, obj):
    p = pathlib.Path(p)
    p = p if p.is_absolute() else ROOT / p
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=1) + '\n', encoding='utf8')


def sh(*cmd, cwd=None):
    """Run a command, raise with its stderr tail on failure."""
    r = subprocess.run([str(c) for c in cmd], cwd=cwd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f'{cmd[0]} failed ({r.returncode}): {r.stderr[-1500:]}')
    return r.stdout


def duration(path):
    out = sh('ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', path)
    return float(out.strip())
