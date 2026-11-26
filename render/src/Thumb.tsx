import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, staticFile } from 'remotion';
import type { Props } from './types';
import { trUpper } from './types';
import { HEAD } from './fonts';

/** 1280x720 thumbnail: topic picture in the background, the coach on the right, huge Turkish headline on the left. */
export const Thumb: React.FC<Props> = (p) => {
  const text = trUpper(p.thumbText);
  const hl = p.thumbHighlight ? trUpper(p.thumbHighlight) : '';
  const words = text.split(' ');
  const coach = p.coachImg;
  const textW = coach ? 700 : 900;
  const size = words.length > 3 ? (coach ? 104 : 120) : coach ? 128 : 150;
  return (
    <AbsoluteFill style={{ background: p.style.bg, overflow: 'hidden' }}>
      {p.thumbClip ? (
        <AbsoluteFill style={{ opacity: coach ? 0.35 : 0.55 }}>
          <OffthreadVideo src={staticFile(p.thumbClip)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </AbsoluteFill>
      ) : p.thumbImg ? (
        <AbsoluteFill style={{ opacity: coach ? 0.35 : 0.6 }}>
          <Img src={staticFile(p.thumbImg)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: `linear-gradient(90deg, ${p.style.bg} 0%, ${p.style.bg}dd 45%, #0000 100%)` }} />

      {coach && p.coachCut && (
        <>
          <div style={{ position: 'absolute', right: 60, bottom: -120, width: 560, height: 560, borderRadius: 280,
            background: `radial-gradient(circle, ${p.style.accent}cc 0%, ${p.style.accent}00 70%)` }} />
          <Img src={staticFile(coach)} style={{ position: 'absolute', right: 10, bottom: 0, height: 700, maxWidth: 640, objectFit: 'contain',
            objectPosition: 'bottom right', filter: 'drop-shadow(0 10px 30px #000)' }} />
        </>
      )}
      {coach && !p.coachCut && (
        <Img src={staticFile(coach)} style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 640, objectFit: 'cover',
          objectPosition: 'center top', WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 35%)',
          maskImage: 'linear-gradient(90deg, transparent 0%, #000 35%)' }} />
      )}

      <div style={{ position: 'absolute', left: 56, top: 70, width: textW, fontFamily: HEAD, fontSize: size, lineHeight: 1.02,
        color: p.style.text, textShadow: '0 8px 24px #000' }}>
        {words.map((w, i) => (
          <span key={i} style={{ color: hl && hl.includes(w) ? p.style.accent : p.style.text }}>{w} </span>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 56, bottom: 56, display: 'flex', gap: 16 }}>
        <div style={{ background: p.style.accent2, color: p.style.bg, fontFamily: HEAD, fontSize: 40, padding: '6px 18px', borderRadius: 10 }}>SINAV</div>
        <div style={{ background: p.style.accent, color: p.style.bg, fontFamily: HEAD, fontSize: 40, padding: '6px 18px', borderRadius: 10 }}>SALON</div>
      </div>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 18, background: p.style.accent }} />
    </AbsoluteFill>
  );
};
