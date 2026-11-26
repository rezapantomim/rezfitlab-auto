"""Move validated episodes from work/episodes/ into queue/ and mark their topics as queued.

Usage: python tools/enqueue.py work/episodes/L-20261201-hr-zones.json [...]
Only files that pass tools/validate.py are moved. Prints what was queued.
"""
import json, pathlib, shutil, sys
from common import ROOT, load, save
from validate import check


def mark(ep):
    tid = ep['topic_id']
    for f in ('data/topics.json', 'data/quiz.json', 'data/gym_ideas.json'):
        items = load(f)
        hit = False
        for x in items:
            if x['id'] == tid:
                x['status'] = 'queued'; x['episode'] = ep['id']; hit = True
        if hit:
            save(f, items)


def main(paths):
    for path in paths:
        p = pathlib.Path(path)
        errs = check(p)
        if errs:
            print('SKIP', p.name, '->', '; '.join(errs)); continue
        ep = json.loads(p.read_text(encoding='utf8'))
        dst = ROOT / 'queue' / p.name
        shutil.move(str(p), dst)
        mark(ep)
        print('QUEUED', dst.relative_to(ROOT), ep['publish_at'], ep['upload']['title'])


if __name__ == '__main__':
    main(sys.argv[1:])
