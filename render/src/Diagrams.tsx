/* Code-drawn teaching diagrams. Every diagram reads its data from visual.params (written by the weekly writer). */
import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Props, Visual } from './types';
import { trUpper } from './types';
import { HEAD, BODY } from './fonts';

type D = { v: Visual; p: Props; vertical: boolean; dur: number };

const useT = (delay = 0) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping: 16 } });
};

const Title: React.FC<{ v: Visual; p: Props }> = ({ v, p }) =>
  v.text ? <div style={{ fontFamily: HEAD, fontSize: 64, color: p.style.text, textAlign: 'center', marginBottom: 26 }}>{trUpper(v.text)}</div> : null;

/** Simple standing figure (front view), centred at (cx, top). */
const Figure: React.FC<{ cx: number; top: number; s: number; color: string }> = ({ cx, top, s, color }) => (
  <g stroke={color} strokeWidth={10 * s} strokeLinecap="round" fill="none">
    <circle cx={cx} cy={top + 40 * s} r={34 * s} fill={color} stroke="none" />
    <line x1={cx} y1={top + 80 * s} x2={cx} y2={top + 250 * s} />
    <line x1={cx} y1={top + 110 * s} x2={cx - 90 * s} y2={top + 220 * s} />
    <line x1={cx} y1={top + 110 * s} x2={cx + 90 * s} y2={top + 220 * s} />
    <line x1={cx} y1={top + 250 * s} x2={cx - 60 * s} y2={top + 420 * s} />
    <line x1={cx} y1={top + 250 * s} x2={cx + 60 * s} y2={top + 420 * s} />
  </g>
);

const Planes: React.FC<D> = ({ v, p }) => {
  const h = (v.params?.highlight as string) || 'all';
  const a = useT(0), b = useT(10), c = useT(20);
  const on = (k: string) => (h === 'all' || h === k ? 0.55 : 0.12);
  const lab = { sagittal: 'SAGİTTAL — sağ / sol', frontal: 'FRONTAL — ön / arka', transverse: 'TRANSVERS — üst / alt' };
  return (
    <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 50 }}>
      <svg viewBox="0 0 600 560" style={{ flex: 1, maxHeight: 640 }}>
        <polygon points="300,20 360,80 360,540 300,480" fill={p.style.accent} opacity={on('sagittal') * a} />
        <polygon points="120,90 480,90 480,520 120,520" fill={p.style.accent2} opacity={on('frontal') * b} />
        <polygon points="90,290 450,290 510,350 150,350" fill={p.style.good} opacity={on('transverse') * c} />
        <Figure cx={300} top={90} s={1} color={p.style.text} />
      </svg>
      <div style={{ flex: 1, fontFamily: BODY, display: 'flex', flexDirection: 'column', gap: 26 }}>
        {(['sagittal', 'frontal', 'transverse'] as const).map((k, i) => (
          <div key={k} style={{ fontSize: 44, fontWeight: 800, opacity: h === 'all' || h === k ? 1 : 0.35,
            color: [p.style.accent, p.style.accent2, p.style.good][i] }}>{lab[k]}</div>
        ))}
        {v.params?.example && <div style={{ fontSize: 38, color: p.style.text, marginTop: 10 }}>Örnek: {v.params.example}</div>}
      </div>
    </div>
  );
};

const JointAction: React.FC<D> = ({ v, p, dur }) => {
  const f = useCurrentFrame();
  const from = Number(v.params?.from ?? 180), to = Number(v.params?.to ?? 90);
  const ang = interpolate(f, [8, Math.max(20, dur - 12)], [from, to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const r = (d: number) => (d * Math.PI) / 180;
  const jx = 300, jy = 300, L = 220;
  const ex = jx + L * Math.cos(r(180 - ang)), ey = jy - L * Math.sin(r(180 - ang));
  return (
    <div style={{ width: '100%', textAlign: 'center' }}>
      <Title v={v} p={p} />
      <svg viewBox="0 0 600 420" style={{ width: '70%', maxHeight: 560 }}>
        <path d={`M ${jx - 90} ${jy} A 90 90 0 0 1 ${jx + 90 * Math.cos(r(180 - ang))} ${jy - 90 * Math.sin(r(180 - ang))}`}
          stroke={p.style.accent2} strokeWidth={6} fill="none" strokeDasharray="10 8" />
        <line x1={jx - L} y1={jy} x2={jx} y2={jy} stroke={p.style.text} strokeWidth={26} strokeLinecap="round" />
        <line x1={jx} y1={jy} x2={ex} y2={ey} stroke={p.style.accent} strokeWidth={26} strokeLinecap="round" />
        <circle cx={jx} cy={jy} r={26} fill={p.style.bg} stroke={p.style.accent2} strokeWidth={8} />
        <text x={jx} y={jy + 90} fill={p.style.accent2} fontFamily={HEAD} fontSize={64} textAnchor="middle">{Math.round(ang)}°</text>
      </svg>
      {v.params?.label && <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 48, color: p.style.text }}>{v.params.label}</div>}
    </div>
  );
};

type Zone = { label: string; from: number; to: number };
const Zones: React.FC<D & { unit: string; defaults: Zone[] }> = ({ v, p, unit, defaults }) => {
  const zones: Zone[] = (v.params?.zones as Zone[]) || defaults;
  const hl = v.params?.highlight as number | undefined;
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const cols = ['#3BA3FF', p.style.good, p.style.accent2, p.style.accent, p.style.bad];
  return (
    <div style={{ width: '100%', maxWidth: 1400 }}>
      <Title v={v} p={p} />
      {zones.map((z, i) => {
        const s = spring({ frame: f - i * 6, fps, config: { damping: 15 } });
        const dim = hl !== undefined && hl !== i;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 16, opacity: dim ? 0.3 : 1 }}>
            <div style={{ width: 300, fontFamily: BODY, fontWeight: 800, fontSize: 38, color: p.style.text, textAlign: 'right' }}>{z.label}</div>
            <div style={{ flex: 1, height: 64, background: p.style.panel, borderRadius: 12, position: 'relative' }}>
              <div style={{ position: 'absolute', left: `${z.from}%`, width: `${(z.to - z.from) * s}%`, top: 0, bottom: 0,
                background: cols[i % cols.length], borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: HEAD, fontSize: 34, color: p.style.bg, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                %{z.from}–{z.to}
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ textAlign: 'right', fontFamily: BODY, fontSize: 30, color: p.style.text, opacity: 0.7 }}>{unit}</div>
    </div>
  );
};

const HR_DEFAULT: Zone[] = [
  { label: 'Çok hafif', from: 0, to: 20 }, { label: 'Hafif', from: 20, to: 40 }, { label: 'Orta', from: 40, to: 60 },
  { label: 'Yüksek', from: 60, to: 85 }, { label: 'Çok yüksek', from: 85, to: 100 },
];

const Rpe: React.FC<D> = ({ v, p }) => {
  const max = Number(v.params?.max ?? 10);
  const hl: number[] = (v.params?.highlight as number[]) || [];
  const f = useCurrentFrame();
  return (
    <div style={{ width: '100%', maxWidth: 1500, textAlign: 'center' }}>
      <Title v={v} p={p} />
      <div style={{ display: 'flex', gap: 10 }}>
        {Array.from({ length: max + 1 }, (_, i) => {
          const t = i / max; const on = hl.includes(i);
          const col = `hsl(${120 - 120 * t}, 75%, 50%)`;
          const s = interpolate(f, [i * 2, i * 2 + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div key={i} style={{ flex: 1, height: 120 + (on ? 60 : 0), alignSelf: 'flex-end', background: col, borderRadius: 12, opacity: s * (hl.length && !on ? 0.35 : 1),
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HEAD, fontSize: 52, color: '#111',
              outline: on ? `6px solid ${p.style.text}` : 'none' }}>{i}</div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, fontFamily: BODY, fontWeight: 700, fontSize: 34, color: p.style.text }}>
        <span>{v.params?.lowLabel || 'Dinlenme'}</span><span>{v.params?.highLabel || 'Maksimum efor'}</span>
      </div>
    </div>
  );
};

const MMT_DEFAULT = ['Kasılma yok', 'Görünür / hissedilir kasılma', 'Yer çekimi olmadan tam hareket',
  'Yer çekimine karşı tam hareket', 'Orta dirence karşı tam hareket', 'Tam dirence karşı tam hareket'];
const Mmt: React.FC<D> = ({ v, p }) => {
  const labels: string[] = (v.params?.labels as string[]) || MMT_DEFAULT;
  const hl = v.params?.highlight as number | undefined;
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <div style={{ width: '100%', maxWidth: 1400 }}>
      <Title v={v} p={p} />
      {labels.map((l, i) => {
        const s = spring({ frame: f - i * 5, fps, config: { damping: 15 } });
        const on = hl === i;
        return (
          <div key={i} style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 12, opacity: s * (hl !== undefined && !on ? 0.35 : 1),
            transform: `scale(${on ? 1.04 : 1})`, transformOrigin: 'left' }}>
            <div style={{ width: 80, height: 70, borderRadius: 14, background: on ? p.style.accent : p.style.panel, color: on ? p.style.bg : p.style.accent2,
              fontFamily: HEAD, fontSize: 46, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i}</div>
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 40, color: p.style.text }}>{l}</div>
          </div>
        );
      })}
    </div>
  );
};

const Chain: React.FC<D> = ({ v, p }) => {
  const mode = (v.params?.mode as string) || 'both';
  const f = useCurrentFrame();
  const swing = 25 * Math.sin(f / 10);
  const panel = (title: string, closed: boolean, ex: string) => (
    <div style={{ flex: 1, background: p.style.panel, borderRadius: 26, padding: 30, textAlign: 'center',
      border: `4px solid ${closed ? p.style.good : p.style.accent2}` }}>
      <div style={{ fontFamily: HEAD, fontSize: 52, color: closed ? p.style.good : p.style.accent2 }}>{title}</div>
      <svg viewBox="0 0 400 300" style={{ width: '100%', maxHeight: 330 }}>
        <line x1={40} y1={280} x2={360} y2={280} stroke={p.style.text} strokeWidth={6} opacity={0.5} />
        {closed ? (
          <g stroke={p.style.text} strokeWidth={18} strokeLinecap="round">
            <line x1={200} y1={60 + swing} x2={150} y2={170 + swing / 2} /><line x1={150} y1={170 + swing / 2} x2={200} y2={275} />
            <circle cx={200} cy={275} r={14} fill={p.style.good} stroke="none" />
          </g>
        ) : (
          <g stroke={p.style.text} strokeWidth={18} strokeLinecap="round" transform="translate(0,-40)">
            <line x1={80} y1={150} x2={210} y2={150} />
            <line x1={210} y1={150} x2={210 + 110 * Math.cos(((60 + swing) * Math.PI) / 180)} y2={150 + 110 * Math.sin(((60 + swing) * Math.PI) / 180)} />
          </g>
        )}
      </svg>
      <div style={{ fontFamily: BODY, fontSize: 34, fontWeight: 700, color: p.style.text }}>{ex}</div>
    </div>
  );
  return (
    <div style={{ display: 'flex', gap: 40, width: '100%' }}>
      {mode !== 'closed' && panel('AÇIK ZİNCİR', false, v.params?.openExample || 'Leg extension: ayak serbest')}
      {mode !== 'open' && panel('KAPALI ZİNCİR', true, v.params?.closedExample || 'Squat: ayak yerde sabit')}
    </div>
  );
};

const REG: Record<string, [number, number, number, number]> = {           // x, y, w, h on a 300x600 front figure
  shoulders: [70, 120, 160, 40], chest: [95, 160, 110, 60], biceps: [40, 175, 40, 80], triceps: [220, 175, 40, 80],
  core: [110, 225, 80, 90], back: [95, 160, 110, 150], glutes: [95, 315, 110, 45], quads: [95, 360, 110, 120],
  hamstrings: [95, 360, 110, 120], calves: [100, 490, 100, 80], forearms: [25, 260, 40, 70], neck: [130, 95, 40, 25],
};
const BodyMap: React.FC<D> = ({ v, p }) => {
  const regions: string[] = (v.params?.regions as string[]) || [];
  const f = useCurrentFrame();
  const pulse = 0.55 + 0.25 * Math.sin(f / 6);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 60, width: '100%', justifyContent: 'center' }}>
      <svg viewBox="0 0 300 600" style={{ height: 620 }}>
        <g fill={p.style.panel} stroke={p.style.text} strokeOpacity={0.3} strokeWidth={3}>
          <circle cx={150} cy={60} r={40} /><rect x={90} y={110} width={120} height={210} rx={40} />
          <rect x={35} y={125} width={50} height={210} rx={25} /><rect x={215} y={125} width={50} height={210} rx={25} />
          <rect x={95} y={310} width={50} height={270} rx={25} /><rect x={155} y={310} width={50} height={270} rx={25} />
        </g>
        {regions.map((r) => REG[r] && (
          <rect key={r} x={REG[r][0]} y={REG[r][1]} width={REG[r][2]} height={REG[r][3]} rx={18} fill={p.style.accent} opacity={pulse} />
        ))}
      </svg>
      <div style={{ fontFamily: BODY }}>
        <Title v={v} p={p} />
        {(v.params?.labels as string[] || []).map((l, i) => (
          <div key={i} style={{ fontSize: 46, fontWeight: 800, color: p.style.accent2, marginBottom: 12 }}>• {l}</div>
        ))}
      </div>
    </div>
  );
};

const Timeline: React.FC<D> = ({ v, p }) => {
  const pts: { label: string; t: string }[] = (v.params?.points as any[]) || [];
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <div style={{ width: '100%' }}>
      <Title v={v} p={p} />
      <div style={{ position: 'relative', height: 260 }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 120, height: 8, background: p.style.text, opacity: 0.3 }} />
        {pts.map((pt, i) => {
          const s = spring({ frame: f - i * 10, fps, config: { damping: 14 } });
          const x = pts.length > 1 ? (i / (pts.length - 1)) * 90 + 5 : 50;
          return (
            <div key={i} style={{ position: 'absolute', left: `${x}%`, top: 0, transform: `translateX(-50%) scale(${s})`, textAlign: 'center', width: 320 }}>
              <div style={{ fontFamily: HEAD, fontSize: 44, color: p.style.accent2 }}>{pt.t}</div>
              <div style={{ width: 40, height: 40, borderRadius: 20, background: p.style.accent, margin: '24px auto' }} />
              <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 34, color: p.style.text }}>{pt.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Bar: React.FC<D> = ({ v, p }) => {
  const items: { label: string; value: number }[] = (v.params?.items as any[]) || [];
  const max = Math.max(1, ...items.map((x) => x.value));
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <div style={{ width: '100%', maxWidth: 1400 }}>
      <Title v={v} p={p} />
      {items.map((it, i) => {
        const s = spring({ frame: f - i * 6, fps, config: { damping: 16 } });
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 18 }}>
            <div style={{ width: 320, textAlign: 'right', fontFamily: BODY, fontWeight: 800, fontSize: 38, color: p.style.text }}>{it.label}</div>
            <div style={{ height: 60, width: `${(it.value / max) * 60 * s}%`, background: i === 0 ? p.style.accent : p.style.accent2, borderRadius: 10 }} />
            <div style={{ fontFamily: HEAD, fontSize: 44, color: p.style.text }}>{it.value}{v.params?.unit || ''}</div>
          </div>
        );
      })}
    </div>
  );
};

export const Diagram: React.FC<D> = (d) => {
  switch (d.v.name) {
    case 'planes': return <Planes {...d} />;
    case 'joint_action': return <JointAction {...d} />;
    case 'hr_zones': return <Zones {...d} unit={d.v.params?.unit || 'Kalp atım hızı rezervi (HRR) %'} defaults={HR_DEFAULT} />;
    case 'rpe_scale': return <Rpe {...d} />;
    case 'mmt_grades': return <Mmt {...d} />;
    case 'kinetic_chain': return <Chain {...d} />;
    case 'body_map': return <BodyMap {...d} />;
    case 'timeline': return <Timeline {...d} />;
    case 'bar': return <Bar {...d} />;
    default: return null;
  }
};
