/* Beat visuals. Design rule (2026-11-27 redesign): few words, lots of motion. Text visuals are kinetic (words pop in, marker
   highlight) and become picture-driven when the writer attaches `images` (full-bleed Ken Burns photo behind the words,
   split-screen photo comparisons, photo + counting number). Icons are drawn on stroke by stroke. Every beat enters with a
   transition (zoom punch, slide, rise or circle wipe). */
import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Beat, Pic, Props, Visual } from './types';
import { trUpper } from './types';
import { Diagram } from './Diagrams';
import { SinglePicture, Collage, KenBurns, FullPicture } from './Pictures';
import { KineticText, Burst, Pill } from './Kinetic';
import { Icon } from './Icons';
import { HEAD, BODY } from './fonts';

const CL = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const useIn = (delay = 0) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping: 15, mass: 0.7 } });
};

/** The area a visual may use: full frame (long) or the upper part (Short, captions sit below). */
const Stage: React.FC<{ vertical: boolean; children: React.ReactNode; style?: React.CSSProperties }> = ({ vertical, children, style }) => (
  <AbsoluteFill style={{ padding: vertical ? '200px 60px 760px' : '140px 140px 190px', display: 'flex',
    alignItems: 'center', justifyContent: 'center', ...style }}>
    {children}
  </AbsoluteFill>
);

/** Slow camera push on everything inside (keeps even static layouts moving). */
const Push: React.FC<{ dur: number; children: React.ReactNode; amount?: number }> = ({ dur, children, amount = 0.05 }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ transform: `scale(${interpolate(f, [0, Math.max(30, dur)], [1, 1 + amount], CL)})` }}>{children}</AbsoluteFill>;
};

/** Photo backdrop for text visuals: Ken Burns picture + darkening so the words stay readable. */
const Backdrop: React.FC<{ pic: Pic; beat: Beat; p: Props; vertical: boolean; seed: number; strong?: boolean }> = (
  { pic, beat, p, vertical, seed, strong }) => (
  <AbsoluteFill>
    <KenBurns pic={pic} dur={beat.dur} seed={seed} vertical={vertical} p={p} centerY={vertical ? 560 : 540} />
    <AbsoluteFill style={{ background: vertical
      ? `linear-gradient(180deg, #0008 0%, #0000 20%, #0000 42%, #000${strong ? 'e' : 'c'} 62%, #000e 100%)`
      : `linear-gradient(90deg, #000${strong ? 'd' : 'b'} 0%, #0007 45%, #0000 75%), linear-gradient(180deg, #0000 55%, #000c 100%)` }} />
  </AbsoluteFill>
);

const Keyword: React.FC<{ v: Visual; beat: Beat; p: Props; vertical: boolean; seed: number; big?: boolean }> = (
  { v, beat, p, vertical, seed, big }) => {
  const text = v.text || '';
  const pic = beat.imgs?.[0];
  const ic = useIn(2);
  if (pic) {
    return (
      <AbsoluteFill>
        <Backdrop pic={pic} beat={beat} p={p} vertical={vertical} seed={seed} />
        <div style={{ position: 'absolute', left: vertical ? 60 : 110, right: vertical ? 60 : 640,
          top: vertical ? 900 : undefined, bottom: vertical ? undefined : 200 }}>
          {v.icon && <div style={{ marginBottom: 16, display: 'flex', justifyContent: vertical ? 'center' : 'flex-start' }}>
            <Icon name={v.icon} size={vertical ? 110 : 120} color={p.style.accent2} progress={ic} stroke={2.2} glow="#000" /></div>}
          <KineticText text={text} hl={v.highlight} p={p} size={(big ? 1.15 : 1) * (vertical ? 104 : 124)} align={vertical ? 'center' : 'left'} delay={4} />
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <Push dur={beat.dur}>
      <Stage vertical={vertical}>
        <div style={{ position: 'relative', textAlign: 'center', width: '100%' }}>
          <Burst p={p} size={vertical ? 900 : 860} />
          {v.icon && <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, transform: `scale(${0.5 + 0.5 * ic})` }}>
            <Icon name={v.icon} size={vertical ? 190 : 200} color={p.style.accent2} progress={ic} stroke={2} glow={p.style.accent2 + '88'} /></div>}
          <KineticText text={text} hl={v.highlight} p={p} size={(big ? 1.2 : 1) * (vertical ? 130 : 160)} delay={2} />
        </div>
      </Stage>
    </Push>
  );
};

const countUp = (raw: string, s: number) => {
  // count up only when the value holds exactly one integer ("190", "%40"); ranges like "150–300" are shown as written
  const m = raw.match(/\d+/g);
  const single = m && m.length === 1 && !/[.,]\d/.test(raw);
  return single ? raw.replace(/\d+/, String(Math.round(Number(m![0]) * Math.min(1, s * 1.05)))) : raw;
};

const Stat: React.FC<{ v: Visual; beat: Beat; p: Props; vertical: boolean; seed: number }> = ({ v, beat, p, vertical, seed }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 18, mass: 1.2 } });
  const lab = useIn(14);
  const ring = interpolate(f, [4, 40], [0, 1], CL);
  const pic = beat.imgs?.[0];
  const raw = v.value || '';
  const R = vertical ? 330 : 360;
  const num = (
    <div style={{ position: 'relative', width: R * 2, height: R * 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
      transform: `scale(${0.6 + 0.4 * s})` }}>
      <svg width={R * 2} height={R * 2} viewBox="-100 -100 200 200" style={{ position: 'absolute', inset: 0, transform: `rotate(${-90 + f * 0.3}deg)` }}>
        <circle r="92" fill={pic ? '#000a' : p.style.panel + 'cc'} stroke={p.style.text + '22'} strokeWidth="5" />
        <circle r="92" fill="none" stroke={p.style.accent} strokeWidth="7" strokeLinecap="round" pathLength={1} strokeDasharray={1}
          strokeDashoffset={1 - ring * 0.82} />
      </svg>
      <div style={{ position: 'relative', textAlign: 'center' }}>
        {v.icon && <div style={{ display: 'flex', justifyContent: 'center', marginBottom: -6 }}>
          <Icon name={v.icon} size={vertical ? 90 : 96} color={p.style.accent2} progress={ring} stroke={2.2} /></div>}
        <div style={{ fontFamily: HEAD, fontSize: (raw.length > 6 ? 0.62 : 1) * (vertical ? 200 : 220), lineHeight: 1, color: p.style.accent2,
          textShadow: '0 8px 30px #000c' }}>{countUp(raw, s)}</div>
      </div>
    </div>
  );
  const label = v.label ? <div style={{ marginTop: -40, position: 'relative' }}><Pill text={v.label} p={p} size={vertical ? 56 : 58} s={lab} /></div> : null;
  if (pic) {
    return (
      <AbsoluteFill>
        <Backdrop pic={pic} beat={beat} p={p} vertical={vertical} seed={seed} strong />
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center',
          ...(vertical ? { left: 0, right: 0, top: 230 } : { right: 150, top: 150 }) }}>
          {num}{label}
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <Push dur={beat.dur}>
      <Stage vertical={vertical}><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>{num}{label}</div></Stage>
    </Push>
  );
};

const Stamp: React.FC<{ ok: boolean; p: Props; s: number; size: number }> = ({ ok, p, s, size }) => (
  <div style={{ width: size, height: size, borderRadius: size / 2, background: ok ? p.style.good : p.style.bad, display: 'flex',
    alignItems: 'center', justifyContent: 'center', transform: `scale(${2.2 - 1.2 * s}) rotate(${(1 - s) * -30}deg)`, opacity: Math.min(1, s * 2),
    boxShadow: '0 10px 26px #000a', border: '5px solid #fff' }}>
    <Icon name={ok ? 'check' : 'cross'} size={size * 0.62} color="#fff" progress={s} stroke={3.2} />
  </div>
);

const VsBadge: React.FC<{ p: Props; s: number; size: number }> = ({ p, s, size }) => (
  <div style={{ width: size, height: size, borderRadius: size / 2, background: p.style.accent, color: '#fff', fontFamily: HEAD,
    fontSize: size * 0.42, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `6px solid ${p.style.bg}`,
    transform: `scale(${s}) rotate(${(1 - s) * 200}deg)`, boxShadow: '0 10px 30px #000b' }}>VS</div>
);

/** Two pictures side by side (long) / stacked (Short): wipe reveal, labels, verdict stamps. */
const Split: React.FC<{ v: Visual; beat: Beat; p: Props; vertical: boolean; seed: number }> = ({ v, beat, p, vertical, seed }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pics = beat.imgs || [];
  const A = pics[0], B = pics[1] || pics[0];
  const wa = spring({ frame: f, fps, config: { damping: 20 } }), wb = spring({ frame: f - 10, fps, config: { damping: 20 } });
  const vs = spring({ frame: f - 16, fps, config: { damping: 12 } });
  const la = spring({ frame: f - 12, fps, config: { damping: 14 } }), lb = spring({ frame: f - 20, fps, config: { damping: 14 } });
  const st = spring({ frame: f - 32, fps, config: { damping: 12 } });
  const vd = v.verdict || 'none';
  const W = vertical ? 1080 : 1920, H = vertical ? 1180 : 1080;
  const half = (pic: Pic, i: number, w: number, label?: string, s = 1, ls = 1, win = false, lose = false) => {
    const style: React.CSSProperties = vertical
      ? { left: 0, width: W, top: i ? H / 2 : 0, height: H / 2, clipPath: i ? `inset(${(1 - s) * 100}% 0 0 0)` : `inset(0 0 ${(1 - s) * 100}% 0)` }
      : { top: 0, height: H, left: i ? W / 2 : 0, width: W / 2, clipPath: i ? `inset(0 0 0 ${(1 - s) * 100}%)` : `inset(0 ${(1 - s) * 100}% 0 0)` };
    return (
      <div style={{ position: 'absolute', overflow: 'hidden', ...style }}>
        <div style={{ position: 'absolute', inset: 0, filter: lose ? `grayscale(${st * 0.9}) brightness(${1 - st * 0.35})` : undefined }}>
          <KenBurns pic={pic} dur={beat.dur} seed={seed + i} vertical={false} p={p} />
        </div>
        <AbsoluteFill style={{ background: 'linear-gradient(180deg, #0000 55%, #000b 100%)' }} />
        {label && <div style={{ position: 'absolute', left: 0, right: 0, bottom: vertical ? 40 : 230, textAlign: 'center' }}>
          <Pill text={label} p={p} size={vertical ? 64 : 70} s={ls} bg={win ? p.style.good : lose ? p.style.bad : p.style.accent} /></div>}
        {(win || lose) && <div style={{ position: 'absolute', right: 40, top: vertical ? 40 : 150 }}><Stamp ok={win} p={p} s={st} size={vertical ? 120 : 130} /></div>}
      </div>
    );
  };
  return (
    <AbsoluteFill>
      {half(A, 0, W / 2, v.left, wa, la, vd === 'left' || vd === 'both', vd === 'right')}
      {half(B, 1, W / 2, v.right, wb, lb, vd === 'right' || vd === 'both', vd === 'left')}
      <div style={{ position: 'absolute', background: p.style.accent, boxShadow: '0 0 30px #000',
        ...(vertical ? { left: 0, top: H / 2 - 5, height: 10, width: W * vs } : { top: 0, left: W / 2 - 5, width: 10, height: H * vs }) }} />
      <div style={{ position: 'absolute', left: W / 2 - 75, top: H / 2 - 75 }}><VsBadge p={p} s={vs} size={150} /></div>
    </AbsoluteFill>
  );
};

const Compare: React.FC<{ v: Visual; beat: Beat; p: Props; vertical: boolean }> = ({ v, beat, p, vertical }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame: f, fps, config: { damping: 14 } }), b = spring({ frame: f - 8, fps, config: { damping: 14 } });
  const vs = spring({ frame: f - 14, fps, config: { damping: 12 } }), c = spring({ frame: f - 28, fps, config: { damping: 12 } });
  const vd = v.verdict || 'none';
  const box = (t: string | undefined, s: number, side: number, win: boolean, lose: boolean) => (
    <div style={{ flex: 1, position: 'relative', background: `linear-gradient(160deg, ${p.style.panel}, ${p.style.bg})`, borderRadius: 30,
      padding: vertical ? '50px 30px' : '80px 30px', textAlign: 'center', border: `6px solid ${win ? p.style.good : lose ? p.style.bad : p.style.text + '22'}`,
      opacity: lose ? 1 - 0.4 * c : 1, boxShadow: '0 20px 50px #0009',
      transform: vertical ? `translateX(${(1 - s) * side * 1100}px) rotate(${(1 - s) * side * 8}deg)`
        : `translateX(${(1 - s) * side * 1000}px) rotate(${(1 - s) * side * 8}deg) scale(${win ? 1 + 0.05 * c : 1})` }}>
      <KineticText text={t || ''} p={p} size={vertical ? 92 : 100} delay={side < 0 ? 6 : 14} />
      {(win || lose) && <div style={{ position: 'absolute', top: -50, right: -30 }}><Stamp ok={win} p={p} s={c} size={110} /></div>}
    </div>
  );
  return (
    <Push dur={beat.dur}>
      <Stage vertical={vertical}>
        <div style={{ display: 'flex', flexDirection: vertical ? 'column' : 'row', gap: vertical ? 30 : 50, width: '100%', alignItems: 'stretch' }}>
          {box(v.left, a, -1, vd === 'left' || vd === 'both', vd === 'right')}
          <div style={{ alignSelf: 'center', zIndex: 2, margin: vertical ? '-60px 0' : '0 -75px' }}><VsBadge p={p} s={vs} size={vertical ? 130 : 150} /></div>
          {box(v.right, b, 1, vd === 'right' || vd === 'both', vd === 'left')}
        </div>
      </Stage>
    </Push>
  );
};

const List: React.FC<{ v: Visual; beat: Beat; p: Props; vertical: boolean; seed: number }> = ({ v, beat, p, vertical, seed }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = v.items || [];
  const step = Math.min(16, Math.max(6, (beat.dur - 20) / Math.max(1, items.length)));
  const pic = beat.imgs?.[0];
  return (
    <AbsoluteFill>
      {pic && <Backdrop pic={pic} beat={beat} p={p} vertical={vertical} seed={seed} strong />}
      <Stage vertical={vertical} style={pic && !vertical ? { justifyContent: 'flex-start' } : undefined}>
        <div style={{ width: '100%', maxWidth: 1150 }}>
          {v.text && <div style={{ marginBottom: 34 }}><KineticText text={v.text} p={p} size={vertical ? 74 : 80} color={p.style.accent2}
            align={pic && !vertical ? 'left' : 'center'} /></div>}
          {items.map((it, i) => {
            const s = spring({ frame: f - 6 - i * step, fps, config: { damping: 13 } });
            const side = i % 2 ? 1 : -1;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 24, opacity: Math.min(1, s * 1.5),
                transform: `translateX(${(1 - s) * side * 700}px) rotate(${(1 - s) * side * 6}deg)` }}>
                <div style={{ minWidth: 96, height: 96, borderRadius: 48, background: p.style.accent, color: '#fff', fontFamily: HEAD,
                  fontSize: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `rotate(${(1 - s) * 180}deg)`,
                  boxShadow: '0 8px 20px #0009' }}>{i + 1}</div>
                <div style={{ fontFamily: HEAD, fontSize: vertical ? 74 : 80, color: p.style.text, textShadow: '0 6px 18px #000c' }}>{trUpper(it)}</div>
              </div>
            );
          })}
        </div>
      </Stage>
    </AbsoluteFill>
  );
};

/** 1-4 big icons drawn on stroke by stroke, each with a 1-2 word label. */
const Icons: React.FC<{ v: Visual; beat: Beat; p: Props; vertical: boolean; seed: number }> = ({ v, beat, p, vertical, seed }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const list = (v.icons && v.icons.length ? v.icons : [{ icon: v.icon || 'bolt', label: v.text }]).slice(0, 4);
  const n = list.length;
  const step = Math.min(16, Math.max(7, (beat.dur - 24) / n));
  const size = vertical ? (n === 1 ? 420 : n === 2 ? 330 : 300) : (n === 1 ? 460 : n === 2 ? 380 : n === 3 ? 330 : 290);
  const pic = beat.imgs?.[0];
  return (
    <AbsoluteFill>
      {pic && <Backdrop pic={pic} beat={beat} p={p} vertical={vertical} seed={seed} strong />}
      <Push dur={beat.dur} amount={0.04}>
        <Stage vertical={vertical}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', width: '100%',
            gap: vertical ? '30px 60px' : 70 }}>
            {list.map((it, i) => {
              const s = spring({ frame: f - 4 - i * step, fps, config: { damping: 10, mass: 0.7 } });
              const draw = interpolate(f, [4 + i * step, 26 + i * step], [0, 1], CL);
              const bob = Math.sin((f + i * 25) / 18) * 10;
              const ring = interpolate(f, [4 + i * step, 34 + i * step], [0, 1], CL);
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: size + 40,
                  transform: `translateY(${bob}px) scale(${s})`, opacity: Math.min(1, s * 2) }}>
                  <div style={{ position: 'relative', width: size, height: size, borderRadius: size / 2,
                    background: `radial-gradient(circle at 35% 30%, ${p.style.panel}, ${p.style.bg})`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', boxShadow: `0 20px 50px #000a, 0 0 60px ${p.style.accent}33` }}>
                    <svg width={size} height={size} viewBox="-100 -100 200 200" style={{ position: 'absolute', inset: 0, transform: `rotate(${-90 + f * (i % 2 ? -0.5 : 0.5)}deg)` }}>
                      <circle r="95" fill="none" stroke={i % 2 ? p.style.accent2 : p.style.accent} strokeWidth="5" strokeLinecap="round"
                        pathLength={1} strokeDasharray="0.7 0.3" strokeDashoffset={1 - ring} />
                    </svg>
                    <Icon name={it.icon} size={size * 0.55} color={i % 2 ? p.style.accent2 : p.style.text} progress={draw} stroke={1.8}
                      glow={(i % 2 ? p.style.accent2 : p.style.accent) + '99'} />
                  </div>
                  {it.label && <div style={{ marginTop: 22, fontFamily: HEAD, fontSize: (n >= 3 ? 0.8 : 1) * (vertical ? 70 : 74), color: p.style.text,
                    textAlign: 'center', lineHeight: 1.05, textShadow: '0 6px 18px #000c',
                    opacity: interpolate(f, [12 + i * step, 20 + i * step], [0, 1], CL) }}>{trUpper(it.label)}</div>}
                </div>
              );
            })}
          </div>
        </Stage>
      </Push>
    </AbsoluteFill>
  );
};

const ExerciseCard: React.FC<{ v: Visual; beat: Beat; p: Props; vertical: boolean; seed: number }> = ({ v, beat, p, vertical, seed }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useIn(0);
  const pic = beat.imgs?.[0];
  const draw = interpolate(f, [2, 30], [0, 1], CL);
  const media = pic ? (
    <div style={{ position: 'relative', width: vertical ? 960 : 860, height: vertical ? 520 : 640, borderRadius: 28, overflow: 'hidden',
      flexShrink: 0, border: `6px solid ${p.style.accent}`, boxShadow: '0 24px 60px #000b',
      transform: `translateX(${(1 - s) * -400}px) rotate(${-2 * s}deg)`, opacity: s }}>
      <KenBurns pic={pic} dur={beat.dur} seed={seed} vertical={false} p={p} />
    </div>
  ) : (
    <div style={{ position: 'relative', width: vertical ? 380 : 520, height: vertical ? 380 : 520, flexShrink: 0, display: 'flex',
      alignItems: 'center', justifyContent: 'center', transform: `scale(${s})` }}>
      <Burst p={p} size={vertical ? 420 : 560} />
      <Icon name={v.icon || 'lift'} size={vertical ? 260 : 340} color={p.style.text} progress={draw} stroke={1.6} glow={p.style.accent + 'aa'} />
    </div>
  );
  return (
    <Push dur={beat.dur} amount={0.03}>
      <Stage vertical={vertical}>
        <div style={{ display: 'flex', flexDirection: vertical ? 'column' : 'row', alignItems: 'center', gap: vertical ? 34 : 70, width: '100%',
          justifyContent: 'center' }}>
          {media}
          <div style={{ flex: vertical ? undefined : 1, display: 'flex', flexDirection: 'column', alignItems: vertical ? 'center' : 'flex-start' }}>
            <KineticText text={v.text || ''} p={p} size={vertical ? 84 : 96} align={vertical ? 'center' : 'left'} delay={6} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24, alignItems: vertical ? 'center' : 'flex-start' }}>
              {(v.cues || []).map((c, i) => {
                const k = spring({ frame: f - 16 - i * 12, fps, config: { damping: 13 } });
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, background: p.style.panel + 'ee', borderRadius: 50,
                    padding: '10px 28px 10px 14px', opacity: Math.min(1, k * 1.5), transform: `translateX(${(1 - k) * 300}px)`,
                    boxShadow: '0 8px 20px #0008' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 28, background: p.style.good, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="check" size={38} color="#fff" progress={k} stroke={3.2} /></div>
                    <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: vertical ? 46 : 48, color: p.style.text }}>{c}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Stage>
    </Push>
  );
};

const Quote: React.FC<{ v: Visual; beat: Beat; p: Props; vertical: boolean; seed: number }> = ({ v, beat, p, vertical, seed }) => {
  const s = useIn(0);
  const pic = beat.imgs?.[0];
  return (
    <AbsoluteFill>
      {pic && <Backdrop pic={pic} beat={beat} p={p} vertical={vertical} seed={seed} strong />}
      <Stage vertical={vertical}>
        <div style={{ opacity: s, maxWidth: 1400, textAlign: 'center' }}>
          <div style={{ fontFamily: HEAD, fontSize: 200, color: p.style.accent, lineHeight: 0.6, transform: `scale(${2 - s})` }}>“</div>
          <KineticText text={v.text || ''} hl={v.highlight} p={p} size={vertical ? 84 : 96} delay={6} step={3} />
          {v.label && <div style={{ marginTop: 26, fontSize: 36, color: p.style.accent2, fontWeight: 600 }}>— {v.label}</div>}
        </div>
      </Stage>
    </AbsoluteFill>
  );
};

const Stock: React.FC<{ b: Beat; p: Props; vertical: boolean }> = ({ b, p, vertical }) => {
  const f = useCurrentFrame();
  const zoom = interpolate(f, [0, b.dur], [1.0, 1.1]);
  const s = useIn(6);
  return (
    <AbsoluteFill>
      {b.clip && <OffthreadVideo src={staticFile(b.clip)} muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})` }} />}
      <AbsoluteFill style={{ background: vertical
        ? 'linear-gradient(180deg, #000a 0%, #0000 25%, #0000 55%, #000d 75%)'
        : 'linear-gradient(180deg, #0008 0%, #0000 30%, #0000 60%, #000c 100%)' }} />
      {b.visual.overlay && (
        <div style={{ position: 'absolute', left: vertical ? 60 : 120, top: vertical ? 220 : 150 }}>
          <Pill text={b.visual.overlay} p={p} size={vertical ? 70 : 76} s={s} />
        </div>
      )}
    </AbsoluteFill>
  );
};

const fallbackText = (beat: Beat, v: Visual) => v.text || v.overlay || beat.text.split(' ').slice(0, 3).join(' ');

/** Entrance transitions, cycled by beat index: zoom punch, slide from the right, rise, circle wipe. */
const Enter: React.FC<{ idx: number; kind: string; children: React.ReactNode }> = ({ idx, kind, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f, fps, config: { damping: 20, mass: 0.6 } });
  const fade = interpolate(f, [0, 5], [0, 1], CL);
  const m = (kind === 'diagram' ? 2 : idx) % 4;           // diagrams always rise (their own animation does the rest)
  const style: React.CSSProperties =
    m === 0 ? { transform: `scale(${1.25 - 0.25 * s})`, opacity: fade, filter: `blur(${(1 - s) * 10}px)` }
    : m === 1 ? { transform: `translateX(${(1 - s) * 30}%)`, opacity: fade }
    : m === 2 ? { transform: `translateY(${(1 - s) * 18}%)`, opacity: fade }
    : { clipPath: `circle(${s * 120}% at 50% 45%)` };
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

export const VisualView: React.FC<{ beat: Beat; p: Props; vertical: boolean; idx?: number }> = ({ beat, p, vertical, idx = 0 }) => {
  const v = beat.visual;
  const pics = beat.imgs || [];
  const seed = idx * 7 + 3;
  let el: React.ReactNode;
  switch (v.type) {
    case 'stock': el = beat.clip ? <Stock b={beat} p={p} vertical={vertical} />
      : <Keyword v={{ type: 'keyword', text: fallbackText(beat, v) }} beat={beat} p={p} vertical={vertical} seed={seed} />; break;
    case 'title': el = <Keyword v={v} beat={beat} p={p} vertical={vertical} seed={seed} big />; break;
    case 'keyword': el = <Keyword v={v} beat={beat} p={p} vertical={vertical} seed={seed} />; break;
    case 'list': el = <List v={v} beat={beat} p={p} vertical={vertical} seed={seed} />; break;
    case 'stat': el = <Stat v={v} beat={beat} p={p} vertical={vertical} seed={seed} />; break;
    case 'compare': el = pics.length >= 2 ? <Split v={v} beat={beat} p={p} vertical={vertical} seed={seed} />
      : <Compare v={v} beat={beat} p={p} vertical={vertical} />; break;
    case 'split': el = pics.length ? <Split v={v} beat={beat} p={p} vertical={vertical} seed={seed} />
      : <Compare v={v} beat={beat} p={p} vertical={vertical} />; break;
    case 'icons': el = <Icons v={v} beat={beat} p={p} vertical={vertical} seed={seed} />; break;
    case 'exercise_card': el = <ExerciseCard v={v} beat={beat} p={p} vertical={vertical} seed={seed} />; break;
    case 'quote': el = <Quote v={v} beat={beat} p={p} vertical={vertical} seed={seed} />; break;
    case 'image':
      if (!pics.length) { el = <Keyword v={{ type: 'keyword', text: fallbackText(beat, v) }} beat={beat} p={p} vertical={vertical} seed={seed} />; break; }
      el = v.layout === 'card' || (v.labels && v.labels.length) || pics[0].cut
        ? <SinglePicture beat={beat} p={p} vertical={vertical} /> : <FullPicture beat={beat} p={p} vertical={vertical} seed={seed} />;
      break;
    case 'collage': el = pics.length >= 2 ? <Collage beat={beat} p={p} vertical={vertical} />
      : pics.length ? <FullPicture beat={beat} p={p} vertical={vertical} seed={seed} /> : null; break;
    case 'diagram': el = <Push dur={beat.dur} amount={0.03}><Stage vertical={vertical}><Diagram v={v} p={p} vertical={vertical} dur={beat.dur} /></Stage></Push>; break;
    default: el = null;
  }
  return <Enter idx={idx} kind={v.type}>{el}</Enter>;
};
