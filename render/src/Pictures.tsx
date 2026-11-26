/* Picture visuals: a single picture (photo card or cut-out, optional label arrows) and a 2-4 picture collage. */
import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Beat, Pic, Props } from './types';
import { trUpper } from './types';
import { HEAD, BODY } from './fonts';

/** Largest w x h box with the picture's aspect ratio that fits in maxW x maxH. */
const fit = (p: Pic, maxW: number, maxH: number) => {
  const r = p.w / p.h;
  return maxW / maxH > r ? { w: maxH * r, h: maxH } : { w: maxW, h: maxW / r };
};

const Tape: React.FC<{ color: string; rot: number }> = ({ color, rot }) => (
  <div style={{ position: 'absolute', top: -22, left: '50%', width: 150, height: 42, marginLeft: -75, background: color + 'cc',
    transform: `rotate(${rot}deg)`, boxShadow: '0 2px 6px #0006' }} />
);

const Sticker: React.FC<{ text: string; p: Props; size: number }> = ({ text, p, size }) => (
  <div style={{ position: 'absolute', bottom: -26, left: 18, background: p.style.accent, color: p.style.bg, fontFamily: HEAD,
    fontSize: size, padding: '6px 18px', borderRadius: 8, transform: 'rotate(-3deg)', boxShadow: '0 6px 14px #0008', whiteSpace: 'nowrap' }}>
    {trUpper(text)}
  </div>
);

export const SinglePicture: React.FC<{ beat: Beat; p: Props; vertical: boolean }> = ({ beat, p, vertical }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pic = beat.imgs?.[0];
  if (!pic) return null;
  const v = beat.visual;
  const hasSide = !!v.text && !vertical;
  const box = fit(pic, vertical ? 900 : hasSide ? 1000 : 1400, vertical ? 820 : 700);
  const s = spring({ frame: f, fps, config: { damping: 15 } });
  const zoom = interpolate(f, [0, beat.dur], [1.0, 1.06]);
  const bob = pic.cut ? Math.sin(f / 18) * 8 : 0;
  const labels = v.labels || [];
  return (
    <AbsoluteFill style={{ padding: vertical ? '190px 60px 760px' : '130px 120px 180px', display: 'flex', flexDirection: vertical ? 'column' : 'row',
      alignItems: 'center', justifyContent: 'center', gap: 70 }}>
      <div style={{ position: 'relative', width: box.w, height: box.h, flexShrink: 0, opacity: s,
        transform: `translateY(${(1 - s) * 60 + bob}px) rotate(${pic.cut ? 0 : -1.5 * s}deg)` }}>
        {pic.cut && <div style={{ position: 'absolute', inset: '8%', borderRadius: '50%', background: p.style.accent + '40', filter: 'blur(40px)' }} />}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: pic.cut ? 0 : 6,
          border: pic.cut ? 'none' : `12px solid ${p.style.text}`, boxShadow: pic.cut ? 'none' : '0 20px 50px #000a', background: pic.cut ? 'transparent' : '#fff' }}>
          <Img src={staticFile(pic.src)} style={{ width: '100%', height: '100%', objectFit: 'contain', transform: `scale(${zoom})`,
            filter: pic.cut ? 'drop-shadow(0 18px 30px #000c)' : 'none' }} />
        </div>
        {labels.map((l, i) => {
          const k = spring({ frame: f - 12 - i * 10, fps, config: { damping: 14 } });
          const right = l.x < 55;                                       // label goes to the side with more room
          return (
            <div key={i} style={{ position: 'absolute', left: `${l.x}%`, top: `${l.y}%`, opacity: k }}>
              <div style={{ position: 'absolute', width: 22, height: 22, marginLeft: -11, marginTop: -11, borderRadius: 11,
                background: p.style.accent2, border: `4px solid ${p.style.bg}`, transform: `scale(${k})` }} />
              <div style={{ position: 'absolute', top: -2, height: 4, width: 120 * k, background: p.style.accent2,
                left: right ? 8 : undefined, right: right ? undefined : 8 }} />
              <div style={{ position: 'absolute', top: -26, left: right ? 128 : undefined, right: right ? undefined : 128, whiteSpace: 'nowrap',
                background: p.style.bg + 'ee', color: p.style.accent2, border: `3px solid ${p.style.accent2}`, borderRadius: 10,
                padding: '4px 14px', fontFamily: BODY, fontWeight: 800, fontSize: vertical ? 34 : 32 }}>{l.text}</div>
            </div>
          );
        })}
      </div>
      {v.text && (
        <div style={{ maxWidth: vertical ? 900 : 560, opacity: spring({ frame: f - 8, fps, config: { damping: 15 } }) }}>
          <div style={{ fontFamily: HEAD, fontSize: vertical ? 76 : 84, lineHeight: 1.05, color: p.style.text }}>{trUpper(v.text)}</div>
          <div style={{ marginTop: 22, height: 10, width: 200, background: p.style.accent, borderRadius: 5 }} />
        </div>
      )}
    </AbsoluteFill>
  );
};

// slot centres (x %, y %), card width (% of stage) and rotation, per picture count
const SLOTS_H: Record<number, [number, number, number, number][]> = {
  2: [[30, 50, 40, -4], [70, 52, 40, 3]],
  3: [[22, 46, 30, -5], [52, 56, 30, 2], [80, 44, 30, 5]],
  4: [[28, 32, 30, -4], [70, 30, 30, 4], [30, 72, 30, 3], [72, 72, 30, -3]],
};
const SLOTS_V: Record<number, [number, number, number, number][]> = {
  2: [[42, 28, 70, -4], [58, 72, 70, 3]],
  3: [[33, 19, 54, -5], [67, 50, 54, 3], [36, 81, 54, -2]],
  4: [[28, 25, 46, -4], [72, 30, 46, 4], [30, 72, 46, 3], [70, 76, 46, -3]],
};

export const Collage: React.FC<{ beat: Beat; p: Props; vertical: boolean }> = ({ beat, p, vertical }) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const pics = (beat.imgs || []).slice(0, 4);
  const meta = beat.visual.images || [];
  const n = Math.max(2, Math.min(4, pics.length));
  const slots = (vertical ? SLOTS_V : SLOTS_H)[n];
  const stage = vertical ? { x: 50, y: 250, w: width - 100, h: 820 } : { x: 110, y: 130, w: width - 220, h: height - 330 };
  const step = Math.max(6, Math.min(14, (beat.dur - 20) / n));
  return (
    <AbsoluteFill>
      {pics.map((pic, i) => {
        const [cx, cy, cw, rot] = slots[i];
        const k = spring({ frame: f - i * step, fps, config: { damping: 13, mass: 0.8 } });
        const maxW = (stage.w * cw) / 100, maxH = stage.h * (n === 2 && !vertical ? 0.8 : vertical && n >= 3 ? 0.36 : 0.5);
        const box = fit(pic, maxW, maxH);
        const drift = Math.sin((f + i * 40) / 40) * 6;
        const left = stage.x + (stage.w * cx) / 100 - box.w / 2, top = stage.y + (stage.h * cy) / 100 - box.h / 2;
        const cap = meta[i]?.caption;
        return (
          <div key={i} style={{ position: 'absolute', left, top: top + drift, width: box.w, height: box.h, opacity: k,
            transform: `scale(${0.6 + 0.4 * k}) rotate(${rot * k + (1 - k) * 18}deg)`, zIndex: n - i /* earlier cards (and their stickers) stay on top */ }}>
            {pic.cut ? (
              <Img src={staticFile(pic.src)} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 16px 26px #000c)' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#fff', padding: 10, boxSizing: 'border-box', boxShadow: '0 18px 40px #000b' }}>
                <Img src={staticFile(pic.src)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            {!pic.cut && <Tape color={i % 2 ? p.style.accent2 : p.style.text} rot={-rot * 1.5} />}
            {cap && <Sticker text={cap} p={p} size={vertical ? 40 : 36} />}
          </div>
        );
      })}
      {beat.visual.text && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: vertical ? 1125 : 60, textAlign: 'center', fontFamily: HEAD,
          fontSize: vertical ? 64 : 58, color: p.style.text, textShadow: '0 4px 14px #000',
          opacity: interpolate(f, [n * step, n * step + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
          {trUpper(beat.visual.text)}
        </div>
      )}
    </AbsoluteFill>
  );
};
