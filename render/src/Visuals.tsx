import React from 'react';
import { AbsoluteFill, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Beat, Props, Visual } from './types';
import { trUpper } from './types';
import { Diagram } from './Diagrams';
import { SinglePicture, Collage } from './Pictures';
import { HEAD, BODY } from './fonts';

export const useIn = (delay = 0) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping: 15, mass: 0.7 } });
};

/** The area a visual may use: full frame (long) or the upper part (Short, captions sit below). */
const Stage: React.FC<{ vertical: boolean; children: React.ReactNode }> = ({ vertical, children }) => (
  <AbsoluteFill style={{ padding: vertical ? '200px 60px 760px' : '140px 140px 190px', display: 'flex',
    alignItems: 'center', justifyContent: 'center' }}>
    {children}
  </AbsoluteFill>
);

const Highlighted: React.FC<{ text: string; hl?: string; color: string }> = ({ text, hl, color }) => {
  if (!hl || !text.toLocaleLowerCase('tr-TR').includes(hl.toLocaleLowerCase('tr-TR'))) return <>{text}</>;
  const i = text.toLocaleLowerCase('tr-TR').indexOf(hl.toLocaleLowerCase('tr-TR'));
  return <>{text.slice(0, i)}<span style={{ color }}>{text.slice(i, i + hl.length)}</span>{text.slice(i + hl.length)}</>;
};

const Keyword: React.FC<{ v: Visual; p: Props; vertical: boolean; big?: boolean }> = ({ v, p, vertical, big }) => {
  const s = useIn(2);
  const text = v.text || '';
  return (
    <Stage vertical={vertical}>
      <div style={{ transform: `translateY(${(1 - s) * 60}px)`, opacity: s, textAlign: 'center' }}>
        <div style={{ fontFamily: HEAD, color: p.style.text, lineHeight: 1.05,
          fontSize: (big ? 1.25 : 1) * (vertical ? (text.length > 18 ? 96 : 130) : (text.length > 24 ? 110 : 150)) }}>
          <Highlighted text={trUpper(text)} hl={v.highlight ? trUpper(v.highlight) : undefined} color={p.style.accent} />
        </div>
        <div style={{ margin: '28px auto 0', height: 10, width: `${s * 260}px`, background: p.style.accent, borderRadius: 5 }} />
      </div>
    </Stage>
  );
};

const List: React.FC<{ v: Visual; p: Props; vertical: boolean; dur: number }> = ({ v, p, vertical, dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = v.items || [];
  const step = Math.min(14, Math.max(6, (dur - 20) / Math.max(1, items.length)));
  return (
    <Stage vertical={vertical}>
      <div style={{ width: '100%', maxWidth: 1300 }}>
        {v.text && <div style={{ fontFamily: HEAD, fontSize: vertical ? 64 : 72, color: p.style.accent, marginBottom: 30 }}>{trUpper(v.text)}</div>}
        {items.map((it, i) => {
          const s = spring({ frame: f - 4 - i * step, fps, config: { damping: 14 } });
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 26, marginBottom: 22, opacity: s,
              transform: `translateX(${(1 - s) * -120}px)` }}>
              <div style={{ minWidth: 70, height: 70, borderRadius: 16, background: p.style.accent, color: p.style.bg, fontFamily: HEAD,
                fontSize: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
              <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: vertical ? 52 : 56, color: p.style.text }}>{it}</div>
            </div>
          );
        })}
      </div>
    </Stage>
  );
};

const Stat: React.FC<{ v: Visual; p: Props; vertical: boolean }> = ({ v, p, vertical }) => {
  const s = useIn(0);
  // count up only when the value holds exactly one integer ("190", "%40"); ranges like "150–300" are shown as written
  const raw = v.value || '';
  const m = raw.match(/\d+/g);
  const single = m && m.length === 1 && !/[.,]\d/.test(raw);
  const shown = single ? raw.replace(/\d+/, String(Math.round(Number(m![0]) * Math.min(1, s * 1.05)))) : raw;
  return (
    <Stage vertical={vertical}>
      <div style={{ textAlign: 'center', transform: `scale(${0.7 + 0.3 * s})`, opacity: s }}>
        <div style={{ fontFamily: HEAD, fontSize: vertical ? 230 : 280, color: p.style.accent2, lineHeight: 1 }}>{shown}</div>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: vertical ? 54 : 58, color: p.style.text, marginTop: 24 }}>{v.label}</div>
      </div>
    </Stage>
  );
};

const Compare: React.FC<{ v: Visual; p: Props; vertical: boolean }> = ({ v, p, vertical }) => {
  const a = useIn(0), b = useIn(8), c = useIn(26);
  const box = (t: string | undefined, s: number, win: boolean, lose: boolean) => (
    <div style={{ flex: 1, background: p.style.panel, borderRadius: 28, padding: '50px 30px', textAlign: 'center',
      border: `5px solid ${win ? p.style.good : lose ? p.style.bad : p.style.text + '22'}`, opacity: s,
      transform: `translateY(${(1 - s) * 80}px)` }}>
      <div style={{ fontFamily: HEAD, fontSize: vertical ? 70 : 80, color: p.style.text }}>{trUpper(t || '')}</div>
      {(win || lose) && <div style={{ marginTop: 20, fontSize: 70, opacity: c, color: win ? p.style.good : p.style.bad }}>{win ? '✔' : '✖'}</div>}
    </div>
  );
  const vd = v.verdict || 'none';
  return (
    <Stage vertical={vertical}>
      <div style={{ display: 'flex', flexDirection: vertical ? 'column' : 'row', gap: 40, width: '100%', alignItems: 'stretch' }}>
        {box(v.left, a, vd === 'left' || vd === 'both', vd === 'right')}
        <div style={{ alignSelf: 'center', fontFamily: HEAD, fontSize: 64, color: p.style.accent }}>VS</div>
        {box(v.right, b, vd === 'right' || vd === 'both', vd === 'left')}
      </div>
    </Stage>
  );
};

const ExerciseCard: React.FC<{ v: Visual; p: Props; vertical: boolean }> = ({ v, p, vertical }) => {
  const s = useIn(0);
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Stage vertical={vertical}>
      <div style={{ width: '100%', maxWidth: 1300, background: p.style.panel, borderRadius: 32, padding: 56, opacity: s,
        borderLeft: `14px solid ${p.style.accent}`, transform: `scale(${0.92 + 0.08 * s})` }}>
        <div style={{ fontFamily: HEAD, fontSize: vertical ? 80 : 96, color: p.style.text }}>{trUpper(v.text || '')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, margin: '24px 0 30px' }}>
          {(v.muscles || []).map((m, i) => (
            <div key={i} style={{ background: p.style.accent + '33', color: p.style.accent2, fontWeight: 700, fontSize: 34,
              padding: '8px 20px', borderRadius: 40 }}>{m}</div>
          ))}
        </div>
        {(v.cues || []).map((c, i) => {
          const k = spring({ frame: f - 10 - i * 10, fps, config: { damping: 14 } });
          return (
            <div key={i} style={{ fontSize: vertical ? 44 : 46, fontWeight: 600, color: p.style.text, marginBottom: 14, opacity: k }}>
              <span style={{ color: p.style.good, marginRight: 16 }}>✔</span>{c}
            </div>
          );
        })}
      </div>
    </Stage>
  );
};

const Quote: React.FC<{ v: Visual; p: Props; vertical: boolean }> = ({ v, p, vertical }) => {
  const s = useIn(0);
  return (
    <Stage vertical={vertical}>
      <div style={{ opacity: s, maxWidth: 1400, textAlign: 'center' }}>
        <div style={{ fontFamily: HEAD, fontSize: 160, color: p.style.accent, lineHeight: 0.6 }}>“</div>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: vertical ? 64 : 72, color: p.style.text, lineHeight: 1.2 }}>{v.text}</div>
        {v.label && <div style={{ marginTop: 26, fontSize: 36, color: p.style.accent2, fontWeight: 600 }}>— {v.label}</div>}
      </div>
    </Stage>
  );
};

const Stock: React.FC<{ b: Beat; p: Props; vertical: boolean }> = ({ b, p, vertical }) => {
  const f = useCurrentFrame();
  const zoom = interpolate(f, [0, b.dur], [1.0, 1.08]);
  const s = useIn(4);
  return (
    <AbsoluteFill>
      {b.clip && <OffthreadVideo src={staticFile(b.clip)} muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})` }} />}
      <AbsoluteFill style={{ background: vertical
        ? 'linear-gradient(180deg, #000a 0%, #0000 25%, #0000 55%, #000d 75%)'
        : 'linear-gradient(180deg, #0008 0%, #0000 30%, #0000 60%, #000c 100%)' }} />
      {b.visual.overlay && (
        <div style={{ position: 'absolute', left: vertical ? 60 : 120, top: vertical ? 220 : 150, opacity: s,
          transform: `translateX(${(1 - s) * -80}px)`, background: p.style.accent, color: p.style.bg, fontFamily: HEAD,
          fontSize: vertical ? 64 : 70, padding: '10px 26px', borderRadius: 12 }}>{trUpper(b.visual.overlay)}</div>
      )}
    </AbsoluteFill>
  );
};

export const VisualView: React.FC<{ beat: Beat; p: Props; vertical: boolean }> = ({ beat, p, vertical }) => {
  const f = useCurrentFrame();
  const fade = interpolate(f, [0, 6], [0, 1], { extrapolateRight: 'clamp' });
  const v = beat.visual;
  let el: React.ReactNode;
  switch (v.type) {
    case 'stock': el = beat.clip ? <Stock b={beat} p={p} vertical={vertical} /> : <Keyword v={{ type: 'keyword', text: v.overlay || beat.text.split(' ').slice(0, 4).join(' ') }} p={p} vertical={vertical} />; break;
    case 'title': el = <Keyword v={v} p={p} vertical={vertical} big />; break;
    case 'keyword': el = <Keyword v={v} p={p} vertical={vertical} />; break;
    case 'list': el = <List v={v} p={p} vertical={vertical} dur={beat.dur} />; break;
    case 'stat': el = <Stat v={v} p={p} vertical={vertical} />; break;
    case 'compare': el = <Compare v={v} p={p} vertical={vertical} />; break;
    case 'exercise_card': el = <ExerciseCard v={v} p={p} vertical={vertical} />; break;
    case 'quote': el = <Quote v={v} p={p} vertical={vertical} />; break;
    case 'image': el = beat.imgs?.length ? <SinglePicture beat={beat} p={p} vertical={vertical} /> : <Keyword v={{ type: 'keyword', text: v.text || beat.text.split(' ').slice(0, 4).join(' ') }} p={p} vertical={vertical} />; break;
    case 'collage': el = (beat.imgs?.length || 0) >= 2 ? <Collage beat={beat} p={p} vertical={vertical} /> : beat.imgs?.length ? <SinglePicture beat={beat} p={p} vertical={vertical} /> : null; break;
    case 'diagram': el = <Stage vertical={vertical}><Diagram v={v} p={p} vertical={vertical} dur={beat.dur} /></Stage>; break;
    default: el = null;
  }
  return <AbsoluteFill style={{ opacity: fade }}>{el}</AbsoluteFill>;
};
