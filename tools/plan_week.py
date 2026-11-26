"""Plan the next publishing week: which long topics / quiz items / gym ideas go to which slot.

Usage: python tools/plan_week.py [--start YYYY-MM-DD] [--write]
Prints the plan as JSON. Slots already in queue/ or archive/ are skipped, so re-running is safe.
--write saves it to work/plan.json for the skill to follow.
"""
import argparse, datetime as dt, json
from zoneinfo import ZoneInfo
from common import ROOT, CFG, load, save

DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']


def taken():
    ids = set()
    for d in ('queue', 'archive'):
        for f in (ROOT / d).glob('*.json'):
            ids.add(f.stem)
    for e in load('data/history.json', {'episodes': []})['episodes']:
        ids.add(e['id'])
    return ids


def utc(day, hhmm, tz):
    h, m = map(int, hhmm.split(':'))
    return dt.datetime.combine(day, dt.time(h, m), tzinfo=tz).astimezone(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--start', help='first day of the week to plan (default: tomorrow, Istanbul time)')
    ap.add_argument('--write', action='store_true')
    a = ap.parse_args()
    sc = CFG['schedule']; tz = ZoneInfo(sc['timezone'])
    start = dt.date.fromisoformat(a.start) if a.start else (dt.datetime.now(tz) + dt.timedelta(days=1)).date()
    used = taken()
    used_dates = {i.split('-')[1] + i[0] for i in used}           # e.g. '20261201L' -> a slot is filled
    topics = [t for t in load('data/topics.json') if t['status'] == 'todo']
    quiz = [q for q in load('data/quiz.json') if q['status'] == 'todo']
    gym = [g for g in load('data/gym_ideas.json') if g['status'] == 'todo']
    published_longs = {t['id'] for t in load('data/topics.json') if t['status'] in ('queued', 'done')}
    plan, last_cluster = [], None
    mix = sc['short_mix']; k = len(used) % len(mix)
    for i in range(7):
        day = start + dt.timedelta(days=i); ds = day.strftime('%Y%m%d')
        if DAYS[day.weekday()] in sc['long_days'] and ds + 'L' not in used_dates and topics:
            t = topics.pop(0)
            plan.append({'slot': 'L-' + ds, 'kind': 'long', 'topic_id': t['id'], 'title': t['title'], 'aha_items': t['aha_items'],
                         'gym_angle': t['gym_angle'], 'publish_at': utc(day, sc['long_time_local'], tz)})
            published_longs.add(t['id'])
        if ds + 'S' not in used_dates:
            kind = mix[k % len(mix)]; k += 1
            item = None
            if kind == 'quiz':
                # prefer quiz items whose long video is already out or planned (so the Short can point to it)
                item = next((q for q in quiz if q['long_topic'] in published_longs), None) or (quiz[0] if quiz else None)
                if item: quiz.remove(item)
            if kind == 'gym' or item is None:
                item = gym.pop(0) if gym else None; kind = 'gym' if item else kind
            if item:
                plan.append({'slot': 'S-' + ds, 'kind': 'short', 'short_type': kind, 'topic_id': item['id'],
                             'concept': item.get('concept') or item.get('idea'), 'angles': item.get('angles', []),
                             'related_long_topic': item.get('long_topic'), 'source_note': item.get('source_note', ''),
                             'publish_at': utc(day, sc['short_time_local'], tz)})
    out = {'week_start': start.isoformat(), 'items': plan,
           'warnings': [w for w in [
               'fewer than 4 long topics left' if len(topics) < 4 else '',
               'fewer than 10 gym ideas left - add more to data/gym_ideas.json' if len(gym) < 10 else '']
               if w]}
    print(json.dumps(out, ensure_ascii=False, indent=1))
    if a.write:
        save(ROOT / 'work/plan.json', out)


if __name__ == '__main__':
    main()
