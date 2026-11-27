/* Line icons drawn in code (own drawings, 24x24 grid). Every stroke has pathLength=1 so it can "draw itself on" (progress 0..1).
   Names must match the "icon" enum in schema/episode.schema.json. */
import React from 'react';

type Prim = string | { c: [number, number, number] } | { r: [number, number, number, number, number] };
const C = (x: number, y: number, r: number): Prim => ({ c: [x, y, r] });
const R = (x: number, y: number, w: number, h: number, rx = 0): Prim => ({ r: [x, y, w, h, rx] });

export const ICONS: Record<string, Prim[]> = {
  dumbbell: ['M6 7v10', 'M3.5 9v6', 'M18 7v10', 'M20.5 9v6', 'M6 12h12'],
  heart: ['M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z'],
  pulse: ['M2 12h4.5l2-5 4 10 2.5-6 1.5 1h5.5'],
  flame: ['M12 2.5c1 3.2 5.5 5.4 5.5 10.5a5.5 5.5 0 0 1-11 0c0-2.2 1-3.8 2.2-4.8 0 2 1 3.3 2.2 3.3 0-3.2-1.2-5.4 1.1-9z'],
  clock: [C(12, 12, 9), 'M12 7v5l3.5 2'],
  timer: [C(12, 13.5, 8), 'M12 9.5v4l2.5 2', 'M9.5 2.5h5', 'M12 2.5v3'],
  scale: [R(3.5, 3.5, 17, 17, 4), 'M8 10a5 5 0 0 1 8 0', 'M12 10l1.5-2'],
  check: ['M4.5 12.5l5 5 10-11'],
  cross: ['M6 6l12 12', 'M18 6L6 18'],
  warning: ['M12 3l10 18H2z', 'M12 10v5', 'M12 18v.01'],
  egg: ['M12 2.5c-4 0-7 6.5-7 11.5a7 7 0 0 0 14 0c0-5-3-11.5-7-11.5z'],
  chicken: ['M14.5 3.5a5.5 5.5 0 0 1 3.8 9.4c-1.6 1.6-3.6 1.4-5.2 1.6L10 17.6', 'M10 17.6l-1.2-1.2', 'M10 17.6a1.8 1.8 0 1 1-2.6 2.6 1.8 1.8 0 1 1-2.6-2.6 1.8 1.8 0 1 1 2.6-2.6', 'M14.5 3.5c-3 0-5.4 2.4-5.4 5.4 0 1.4.1 3.2-1.3 4.6l1 3'],
  milk: ['M7 3h10l-1.6 18H8.6z', 'M7.5 8.5h9'],
  apple: ['M12 7.5c-2.2-2-7-1-7 4.8 0 5 3 8.7 5 8.7 1 0 1.4-.5 2-.5s1 .5 2 .5c2 0 5-3.7 5-8.7 0-5.8-4.8-6.8-7-4.8z', 'M12 7.5c0-2.2 1-4 3-4.5'],
  sleep: ['M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z'],
  brain: ['M11 4.5a3 3 0 0 0-5.2 1.8A3.2 3.2 0 0 0 4 12a3.2 3.2 0 0 0 2 5.6A3 3 0 0 0 11 19.5z', 'M13 4.5a3 3 0 0 1 5.2 1.8A3.2 3.2 0 0 1 20 12a3.2 3.2 0 0 1-2 5.6 3 3 0 0 1-5 1.9z', 'M11 4.5v15', 'M13 4.5v15'],
  bolt: ['M13.5 2L4 14h7l-1.5 8L19 10h-7z'],
  target: [C(12, 12, 9.5), C(12, 12, 5.5), C(12, 12, 1.5)],
  up: ['M12 20V4.5', 'M5 11.5l7-7 7 7'],
  down: ['M12 4v15.5', 'M5 12.5l7 7 7-7'],
  rotate: ['M20 12a8 8 0 1 1-2.4-5.7', 'M20 3.5v4.5h-4.5'],
  question: [C(12, 12, 9.5), 'M9.2 9.2a2.9 2.9 0 1 1 3.9 2.7c-.7.3-1.1.9-1.1 1.6v.8', 'M12 17.2v.01'],
  bone: ['M7.2 4.6a2.2 2.2 0 0 0-2.6 2.6 2.2 2.2 0 0 0 1 3.2l8 8a2.2 2.2 0 0 0 3.2 1 2.2 2.2 0 0 0 2.6-2.6 2.2 2.2 0 0 0-1-3.2l-8-8a2.2 2.2 0 0 0-3.2-1z'],
  person: [C(12, 4.5, 2.2), 'M12 7v7.5', 'M7.5 10h9', 'M12 14.5l-3.2 7', 'M12 14.5l3.2 7'],
  run: [C(14.5, 4, 2), 'M13.5 7.2l-3 5 3.5 2.8-1.2 6', 'M10.5 12.2l-4.5 1', 'M13.5 7.2l3.5 3.8 3-.8'],
  lift: [C(12, 7, 2), 'M3.5 3v4', 'M20.5 3v4', 'M3.5 5h17', 'M12 9.2v6.3', 'M12 10.5L8 5', 'M12 10.5L16 5', 'M12 15.5l-3 6', 'M12 15.5l3 6'],
  squat: [C(9, 4, 2), 'M3.5 7h11', 'M9 6.2v6.3', 'M9 12.5l5 1.5', 'M14 14l-1 7', 'M9 12.5l-1.5 8.5'],
  calendar: [R(3, 5, 18, 16, 2.5), 'M3 10h18', 'M8 3v4', 'M16 3v4'],
  chart: ['M3 20.5h18', 'M5 16l5-5 4 3 6-7', 'M16 7h4v4'],
  shield: ['M12 2.8l8 3v6.2c0 5-3.5 8.2-8 9.2-4.5-1-8-4.2-8-9.2V5.8z', 'M8.5 12l2.5 2.5 4.5-5'],
  water: ['M12 2.8c3 4 6.2 7.6 6.2 11.2a6.2 6.2 0 0 1-12.4 0c0-3.6 3.2-7.2 6.2-11.2z'],
  food: ['M7 3v8', 'M4.8 3v5a2.2 2.2 0 0 0 4.4 0V3', 'M7 11v10', 'M17.5 3c-2.2 0-3.3 3-3.3 6.2s1.1 4.3 3.3 4.3V21'],
  eye: ['M2 12s4-7.2 10-7.2S22 12 22 12s-4 7.2-10 7.2S2 12 2 12z', C(12, 12, 3)],
  muscle: ['M4 20.5c.3-6 1.6-10.3 3.6-13.2L9.5 4l3.2 1-1 3-2.2 1c-.2 2 1 3.3 3 3.3 2.4-1.4 5.7-1 6.7 2.2 1 3.4-1.5 6-4.6 6z'],
  plus: ['M12 4.5v15', 'M4.5 12h15'],
  minus: ['M4.5 12h15'],
};

export const Icon: React.FC<{ name?: string; size: number; color: string; progress?: number; stroke?: number; glow?: string }> = (
  { name, size, color, progress = 1, stroke = 1.9, glow }) => {
  const prims = ICONS[name || ''] || ICONS.bolt;
  const common = { pathLength: 1, strokeDasharray: 1, strokeDashoffset: Math.max(0, 1 - progress) } as const;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
      strokeLinejoin="round" style={{ overflow: 'visible', filter: glow ? `drop-shadow(0 0 ${size / 14}px ${glow})` : undefined }}>
      {prims.map((pr, i) => typeof pr === 'string'
        ? <path key={i} d={pr} {...common} />
        : 'c' in pr ? <circle key={i} cx={pr.c[0]} cy={pr.c[1]} r={pr.c[2]} {...common} />
        : <rect key={i} x={pr.r[0]} y={pr.r[1]} width={pr.r[2]} height={pr.r[3]} rx={pr.r[4]} {...common} />)}
    </svg>
  );
};
