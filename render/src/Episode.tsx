import React from 'react';
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Beat, Props, Quiz } from './types';
import { trUpper } from './types';
import { VisualView } from './Visuals';
import { HEAD, BODY } from './fonts';

const LAYER: Record<string, string> = { hook: '', exam: 'SINAV', gym: 'SALON', summary: 'ÖZET', cta: '' };

const Background: React.FC<{ p: Props }> = ({ p }) => {
  const f = useCurrentFrame();
  const x = 50 + 20 * Math.sin(f / 240), y = 40 + 15 * Math.cos(f / 300);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at ${x}% ${y}%, ${p.style.accent}33 0%, ${p.style.bg} 55%)` }}>
      <AbsoluteFill style={{
        backgroundImage: `linear-gradient(${p.style.text}08 1px, transparent 1px), linear-gradient(90deg, ${p.style.text}08 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
    </AbsoluteFill>
  );
};

const Captions: React.FC<{ beat: Beat; p: Props; vertical: boolean }> = ({ beat, p, vertical }) => {
  const f = useCurrentFrame() + beat.from;               // absolute frame
  const size = vertical ? 3 : 7;
  const idx = Math.max(0, beat.words.findIndex((w) => w.f1 >= f));
  const start = Math.floor(idx / size) * size;
  const chunk = beat.words.slice(start, start + size);
  if (!chunk.length) return null;
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, top: vertical ? 1240 : undefined, bottom: vertical ? undefined : 70,
      display: 'flex', justifyContent: 'center', padding: '0 60px',
    }}>
      <div style={{
        background: vertical ? 'transparent' : '#000000aa', padding: vertical ? 0 : '14px 28px', borderRadius: 14,
        fontFamily: vertical ? HEAD : BODY, fontWeight: 800, fontSize: vertical ? 78 : 46, lineHeight: 1.15, textAlign: 'center',
        color: p.style.text, textShadow: vertical ? '0 6px 18px #000, 0 0 4px #000' : 'none', maxWidth: vertical ? 960 : 1500,
      }}>
        {chunk.map((w, i) => {
          const on = f >= w.f0 && f <= w.f1 + 2;
          return (
            <span key={i} style={{ color: on ? p.style.accent2 : p.style.text, marginRight: '0.28em', display: 'inline-block',
              transform: on && vertical ? 'scale(1.08)' : 'none' }}>
              {vertical ? trUpper(w.w) : w.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const QuizView: React.FC<{ q: Quiz; p: Props }> = ({ q, p }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = f >= q.cdTo;
  const left = Math.max(0, Math.ceil((q.cdTo - f) / fps));
  return (
    <AbsoluteFill style={{ padding: '170px 70px 0', fontFamily: BODY, color: p.style.text }}>
      <div style={{ fontFamily: HEAD, fontSize: 30, letterSpacing: 4, color: p.style.accent }}>FITNESS QUIZ</div>
      <div style={{ fontWeight: 800, fontSize: 64, lineHeight: 1.15, marginTop: 18 }}>{q.question}</div>
      <div style={{ marginTop: 50, display: 'flex', flexDirection: 'column', gap: 22 }}>
        {q.options.map((o, i) => {
          const s = spring({ frame: f - 8 - i * 6, fps, config: { damping: 14 } });
          const ok = reveal && i === q.answer, dim = reveal && i !== q.answer;
          return (
            <div key={i} style={{
              transform: `translateX(${(1 - s) * 200}px)`, opacity: s * (dim ? 0.35 : 1), display: 'flex', alignItems: 'center', gap: 26,
              background: ok ? p.style.good : p.style.panel, border: `3px solid ${ok ? p.style.good : p.style.text + '22'}`,
              borderRadius: 22, padding: '26px 30px', fontSize: 50, fontWeight: 600,
            }}>
              <span style={{ fontFamily: HEAD, color: ok ? p.style.bg : p.style.accent, fontSize: 56 }}>{'ABCD'[i]}</span>
              <span style={{ color: ok ? p.style.bg : p.style.text }}>{o}</span>
            </div>
          );
        })}
      </div>
      {f >= q.cdFrom && !reveal && (
        <div style={{ position: 'absolute', right: 70, top: 120, width: 130, height: 130, borderRadius: 65,
          border: `8px solid ${p.style.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: HEAD, fontSize: 80, color: p.style.accent }}>{left}</div>
      )}
    </AbsoluteFill>
  );
};

export const Episode: React.FC<Props> = (p) => {
  const f = useCurrentFrame();
  const vertical = p.kind === 'short';
  const scene = [...p.scenes].reverse().find((s) => f >= s.from);
  const quizEnd = p.quiz ? p.quiz.cdTo + Math.round(p.fps * 3.5) : -1;
  const prog = f / p.durationInFrames;
  return (
    <AbsoluteFill style={{ backgroundColor: p.style.bg, fontFamily: BODY }}>
      <Background p={p} />
      {p.beats.map((b, i) => (
        <Sequence key={i} from={b.from} durationInFrames={b.dur}>
          {!(p.quiz && b.from < quizEnd) && <VisualView beat={b} p={p} vertical={vertical} />}
          {!(p.quiz && b.from < p.quiz.cdTo) && <Captions beat={b} p={p} vertical={vertical} />}
        </Sequence>
      ))}
      {p.quiz && f < quizEnd && <QuizView q={p.quiz} p={p} />}
      {!vertical && scene && (
        <div style={{ position: 'absolute', top: 44, left: 56, display: 'flex', gap: 14, alignItems: 'center' }}>
          {LAYER[scene.layer || ''] && (
            <div style={{ background: scene.layer === 'exam' ? p.style.accent2 : p.style.accent, color: p.style.bg, fontFamily: HEAD,
              fontSize: 26, letterSpacing: 2, padding: '6px 14px', borderRadius: 8 }}>{LAYER[scene.layer || '']}</div>
          )}
          <div style={{ color: p.style.text, opacity: 0.85, fontWeight: 600, fontSize: 28 }}>{scene.title}</div>
        </div>
      )}
      <div style={{ position: 'absolute', top: vertical ? 70 : 44, right: vertical ? 0 : 56, left: vertical ? 0 : undefined,
        textAlign: 'center', fontFamily: HEAD, fontSize: vertical ? 34 : 26, color: p.style.text,
        opacity: interpolate(f, [0, 20], [0, 0.7], { extrapolateRight: 'clamp' }) }}>{p.handle}</div>
      <div style={{ position: 'absolute', left: 0, bottom: 0, height: 8, width: `${prog * 100}%`, background: p.style.accent }} />
    </AbsoluteFill>
  );
};
