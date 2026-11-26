"""Shared helpers for the weekly writer tools (local, run by the Claude Code skill)."""
import json, os, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / 'config/channel.json').read_text(encoding='utf8'))


def load(p, default=None):
    p = ROOT / p if not isinstance(p, pathlib.Path) else p
    if not p.exists():
        return default
    return json.loads(p.read_text(encoding='utf8'))


def save(p, obj):
    p = ROOT / p if not isinstance(p, pathlib.Path) else p
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=1) + '\n', encoding='utf8')


def env(name):
    """Read a key from the environment or from the git-ignored .env file in the project root."""
    if os.environ.get(name):
        return os.environ[name]
    f = ROOT / '.env'
    if f.exists():
        for line in f.read_text(encoding='utf8').splitlines():
            if '=' in line and not line.lstrip().startswith('#'):
                k, v = line.split('=', 1)
                if k.strip() == name:
                    return v.strip().strip('"').strip("'")
    return None


def tr_upper(s):
    """Turkish-aware upper case (i -> İ, ı -> I)."""
    return s.replace('i', 'İ').replace('ı', 'I').upper()


def words(text):
    return len([w for w in text.split() if any(c.isalnum() for c in w)])
