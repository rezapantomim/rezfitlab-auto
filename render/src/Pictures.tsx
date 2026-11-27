/* Picture visuals: Ken Burns / parallax photo, full-bleed picture, photo card or cut-out (optional label arrows), animated collage. */
import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Beat, Pic, Props } from './types';
import { trUpper } from './types';
import { HEAD, BODY } from './fonts';
import { KineticText } from './Kinetic';

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


const CL = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** A picture filling its parent with slow Ken Burns motion (4 variants by seed). Vertical frames with a landscape picture get
 *  parallax: a blurred, slower backdrop plus the sharp picture across the full width. Cut-outs float on a soft accent glow. */
export const KenBurns: React.FC<{ pic: Pic; dur: number; seed: number; vertical: boolean; p: Props; centerY?: number }> = (
  { pic, dur, seed, vertical, p, centerY = 640 }) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [0, Math.max(30, dur)], [0, 1], CL);
  const m = seed % 4;
  const s0 = [1.04, 1.2, 1.13, 1.13][m], s1 = [1.18, 1.05, 1.13, 1.13][m];
  const x0 = [0, 0, -3.5, 3.5][m], x1 = [0, 0, 3.5, -3.5][m];
  const sc = s0 + (s1 - s0) * t, tx = x0 + (x1 - x0) * t;
  const src = staticFile(pic.src);
  if (pic.cut) {
    const box = fit(pic, vertical ? 980 : 1300, vertical ? 900 : 860);
    return (
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% ${vertical ? 33 : 50}%, ${p.style.accent}55 0%, ${p.style.bg} 60%)` }}>
        <Img src={src} style={{ position: 'absolute', left: (vertical ? 1080 : 1920) / 2 - box.w / 2, top: (vertical ? centerY : 540) - box.h / 2,
          width: box.w, height: box.h, objectFit: 'contain', transform: `scale(${0.95 + 0.08 * t}) translateY(${Math.sin(f / 20) * 8}px)`,
          filter: 'drop-shadow(0 24px 40px #000c)' }} />
      </AbsoluteFill>
    );
  }
  const cover = (extra: React.CSSProperties, k = 1) => (
    <Img src={src} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
      transform: `scale(${1 + (sc - 1) * k}) translateX(${tx * k}%)`, ...extra }} />
  );
  if (vertical && pic.w / pic.h > 0.85) {
    const h = Math.min(1100, (1080 * pic.h) / pic.w);
    return (
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        {cover({ filter: 'blur(26px) brightness(0.5) saturate(1.2)' }, 0.5)}
        <div style={{ position: 'absolute', left: 0, right: 0, top: centerY - h / 2, height: h, overflow: 'hidden',
          boxShadow: '0 30px 60px #000c', borderTop: `6px solid ${p.style.accent}`, borderBottom: `6px solid ${p.style.accent}` }}>
          {cover({})}
        </div>
      </AbsoluteFill>
    );
  }
  return <AbsoluteFill style={{ overflow: 'hidden' }}>{cover({})}</AbsoluteFill>;
};

/** Full-bleed photo (Ken Burns) with an optional kinetic 1-4 word line. */
export const FullPicture: React.FC<{ beat: Beat; p: Props; vertical: boolean; seed: number }> = ({ beat, p, vertical, seed }) => {
  const pic = beat.imgs![0];
  const v = beat.visual;
  return (
    <AbsoluteFill>
      <KenBurns pic={pic} dur={beat.dur} seed={seed} vertical={vertical} p={p} />
      <AbsoluteFill style={{ background: vertical ? 'linear-gradient(180deg, #0007 0%, #0000 18%, #0000 55%, #000c 72%)'
        : 'linear-gradient(180deg, #0006 0%, #0000 25%, #0000 55%, #000b 100%)' }} />
      {v.text && (
        <div style={{ position: 'absolute', left: vertical ? 60 : 110, right: vertical ? 60 : 500, top: vertical ? 1010 : undefined,
          bottom: vertical ? undefined : 190 }}>
          <KineticText text={v.text} hl={v.highlight} p={p} size={vertical ? 92 : 104} align={vertical ? 'center' : 'left'} delay={6} />
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
// where each card flies in from (dx, dy in px)
const FROM: [number, number][] = [[-1300, -200], [1300, 150], [-200, 1300], [1100, -900]];

export const Collage: React.FC<{ beat: Beat; p: Props; vertical: boolean }> = ({ beat, p, vertical }) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const pics = (beat.imgs || []).slice(0, 4);
  const meta = beat.visual.images || [];
  const n = Math.max(2, Math.min(4, pics.length));
  const slots = (vertical ? SLOTS_V : SLOTS_H)[n];
  const stage = vertical ? { x: 50, y: 250, w: width - 100, h: 820 } : { x: 110, y: 130, w: width - 220, h: height - 330 };
  const step = Math.max(6, Math.min(14, (beat.dur - 20) / n));
  const cam = interpolate(f, [0, Math.max(30, beat.dur)], [1, 1.07], CL);
  const back = pics.find((x) => !x.cut);
  return (
    <AbsoluteFill>
      {back && (
        <AbsoluteFill style={{ opacity: 0.35 }}>
          <Img src={staticFile(back.src)} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(30px) saturate(1.3)',
            transform: `scale(${1.2 * cam})` }} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ transform: `scale(${cam})` }}>
        {pics.map((pic, i) => {
          const [cx, cy, cw, rot] = slots[i];
          const k = spring({ frame: f - i * step, fps, config: { damping: 14, mass: 0.9 } });
          const maxW = (stage.w * cw) / 100, maxH = stage.h * (n === 2 && !vertical ? 0.8 : vertical && n >= 3 ? 0.36 : 0.5);
          const box = fit(pic, maxW, maxH);
          const depth = 1 + i * 0.4;                                    // parallax: later cards drift more
          const drift = Math.sin((f + i * 40) / 40) * 6 * depth;
          const left = stage.x + (stage.w * cx) / 100 - box.w / 2, top = stage.y + (stage.h * cy) / 100 - box.h / 2;
          const [dx, dy] = FROM[i % 4];
          const cap = meta[i]?.caption;
          const zoom = interpolate(f, [i * step, Math.max(i * step + 1, beat.dur)], [1.12, 1.0], CL);
          return (
            <div key={i} style={{ position: 'absolute', left, top: top + drift, width: box.w, height: box.h, opacity: Math.min(1, k * 2),
              transform: `translate(${(1 - k) * dx}px, ${(1 - k) * dy}px) rotate(${rot * k + (1 - k) * (i % 2 ? 25 : -25)}deg)`,
              zIndex: n - i /* earlier cards (and their stickers) stay on top */ }}>
              {pic.cut ? (
                <Img src={staticFile(pic.src)} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 16px 26px #000c)' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#fff', padding: 10, boxSizing: 'border-box', boxShadow: '0 18px 40px #000b' }}>
                  <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                    <Img src={staticFile(pic.src)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})` }} />
                  </div>
                </div>
              )}
              {!pic.cut && <Tape color={i % 2 ? p.style.accent2 : p.style.text} rot={-rot * 1.5} />}
              {cap && <div style={{ opacity: interpolate(f, [i * step + 8, i * step + 14], [0, 1], CL) }}><Sticker text={cap} p={p} size={vertical ? 42 : 38} /></div>}
            </div>
          );
        })}
      </AbsoluteFill>
      {beat.visual.text && (
        <div style={{ position: 'absolute', left: 60, right: 60, top: vertical ? 1100 : 50 }}>
          <KineticText text={beat.visual.text} hl={beat.visual.highlight} p={p} size={vertical ? 72 : 66} delay={n * step} />
        </div>
      )}
    </AbsoluteFill>
  );
};
