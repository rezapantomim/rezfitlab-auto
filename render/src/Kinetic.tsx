/* Kinetic typography + motion decorations shared by the visuals. */
import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Props } from './types';
import { trUpper } from './types';
import { HEAD } from './fonts';

const norm = (w: string) => trUpper(w).replace(/[^\p{L}\p{N}%]/gu, '');

/** Words pop in one by one (scale + tilt); highlighted words get an accent marker that swipes in behind them. */
export const KineticText: React.FC<{ text: string; hl?: string; p: Props; size: number; delay?: number; align?: 'center' | 'left';
  color?: string; step?: number }> = ({ text, hl, p, size, delay = 0, align = 'center', color, step = 4 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = trUpper(text).split(/\s+/).filter(Boolean);
  const hlSet = new Set((hl ? trUpper(hl).split(/\s+/) : []).map(norm).filter(Boolean));
  const chars = text.length;
  const fs = size * (chars > 26 ? 0.72 : chars > 18 ? 0.85 : 1);
  return (
    <div style={{ fontFamily: HEAD, fontSize: fs, lineHeight: 1.12, textAlign: align, color: color || p.style.text,
      textShadow: '0 6px 22px #000c', display: 'flex', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start',
      columnGap: '0.26em', rowGap: '0.06em' }}>
      {words.map((w, i) => {
        const s = spring({ frame: f - delay - i * step, fps, config: { damping: 11, mass: 0.6 } });
        const on = hlSet.has(norm(w));
        const m = spring({ frame: f - delay - i * step - 5, fps, config: { damping: 18 } });
        return (
          <span key={i} style={{ position: 'relative', display: 'inline-block', opacity: Math.min(1, s * 1.6),
            transform: `translateY(${(1 - s) * 50}px) scale(${1.45 - 0.45 * s}) rotate(${(1 - s) * (i % 2 ? 7 : -7)}deg)` }}>
            {on && <span style={{ position: 'absolute', left: '-0.12em', right: '-0.12em', top: '0.08em', bottom: '0.02em',
              background: p.style.accent, borderRadius: '0.08em', transform: `scaleX(${m}) skewX(-6deg)`, transformOrigin: 'left center',
              zIndex: 0, boxShadow: '0 6px 18px #0008' }} />}
            <span style={{ position: 'relative', zIndex: 1, color: on ? '#fff' : undefined, textShadow: on ? 'none' : undefined }}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};

/** Rotating dashed ring + radiating lines behind a word or number (motion when there is no picture). */
export const Burst: React.FC<{ p: Props; size: number; delay?: number; color?: string }> = ({ p, size, delay = 0, color }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - delay, fps, config: { damping: 16 } });
  const c = color || p.style.accent;
  const rays = 14;
  return (
    <svg width={size} height={size} viewBox="-100 -100 200 200" style={{ position: 'absolute', left: '50%', top: '50%',
      marginLeft: -size / 2, marginTop: -size / 2, opacity: 0.55 * s, transform: `rotate(${f * 0.4}deg) scale(${0.6 + 0.4 * s})` }}>
      <circle r="78" fill="none" stroke={c} strokeWidth="2.5" strokeDasharray="10 14" />
      <circle r="92" fill="none" stroke={p.style.accent2} strokeWidth="1.2" strokeDasharray="2 10" opacity="0.7" />
      {Array.from({ length: rays }).map((_, i) => {
        const a = (i / rays) * Math.PI * 2;
        const len = interpolate(s, [0, 1], [0, 10 + (i % 3) * 6]);
        return <line key={i} x1={Math.cos(a) * 60} y1={Math.sin(a) * 60} x2={Math.cos(a) * (60 + len)} y2={Math.sin(a) * (60 + len)}
          stroke={i % 2 ? p.style.accent2 : c} strokeWidth="3" strokeLinecap="round" />;
      })}
    </svg>
  );
};

/** Small accent pill (labels under numbers, split-screen labels...). */
export const Pill: React.FC<{ text: string; p: Props; size: number; s?: number; bg?: string; color?: string }> = (
  { text, p, size, s = 1, bg, color }) => (
  <div style={{ display: 'inline-block', background: bg || p.style.accent, color: color || '#fff', fontFamily: HEAD, fontSize: size,
    padding: '0.12em 0.55em', borderRadius: '0.25em', transform: `scale(${0.6 + 0.4 * s}) rotate(${(1 - s) * -8}deg)`, opacity: s,
    boxShadow: '0 8px 22px #0009', whiteSpace: 'nowrap' }}>{trUpper(text)}</div>
);
