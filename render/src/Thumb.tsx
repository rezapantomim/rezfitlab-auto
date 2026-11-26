import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, staticFile } from 'remotion';
import type { Props } from './types';
import { trUpper } from './types';
import { HEAD } from './fonts';

/** 1280x720 thumbnail: dark photo background (first stock clip), huge Turkish headline, one word in the accent colour. */
export const Thumb: React.FC<Props> = (p) => {
  const text = trUpper(p.thumbText);
  const hl = p.thumbHighlight ? trUpper(p.thumbHighlight) : '';
  const words = text.split(' ');
  return (
    <AbsoluteFill style={{ background: p.style.bg }}>
      {p.thumbClip ? (
        <AbsoluteFill style={{ opacity: 0.55 }}>
          <OffthreadVideo src={staticFile(p.thumbClip)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </AbsoluteFill>
      ) : p.thumbImg ? (
        <AbsoluteFill style={{ opacity: 0.6 }}>
          <Img src={staticFile(p.thumbImg)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: `linear-gradient(90deg, ${p.style.bg} 0%, ${p.style.bg}dd 45%, #0000 100%)` }} />
      <div style={{ position: 'absolute', left: 60, top: 70, width: 900, fontFamily: HEAD, fontSize: words.length > 3 ? 120 : 150,
        lineHeight: 1.02, color: p.style.text, textShadow: '0 8px 24px #000' }}>
        {words.map((w, i) => (
          <span key={i} style={{ color: hl && hl.includes(w) ? p.style.accent : p.style.text }}>{w} </span>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 60, bottom: 56, display: 'flex', gap: 16 }}>
        <div style={{ background: p.style.accent2, color: p.style.bg, fontFamily: HEAD, fontSize: 40, padding: '6px 18px', borderRadius: 10 }}>SINAV</div>
        <div style={{ background: p.style.accent, color: p.style.bg, fontFamily: HEAD, fontSize: 40, padding: '6px 18px', borderRadius: 10 }}>SALON</div>
      </div>
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 26, background: p.style.accent }} />
    </AbsoluteFill>
  );
};
