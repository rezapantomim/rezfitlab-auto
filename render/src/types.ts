export type Style = {
  bg: string; panel: string; text: string; accent: string; accent2: string; good: string; bad: string;
  font_head: string; font_body: string;
};

export type Visual = {
  type: 'stock' | 'keyword' | 'title' | 'list' | 'stat' | 'compare' | 'diagram' | 'exercise_card' | 'quote' | 'image' | 'collage';
  text?: string; highlight?: string; items?: string[]; value?: string; label?: string;
  left?: string; right?: string; verdict?: 'left' | 'right' | 'both' | 'none';
  name?: string; params?: Record<string, any>; muscles?: string[]; cues?: string[]; overlay?: string;
  images?: { caption?: string; cutout?: boolean }[];
  labels?: { text: string; x: number; y: number }[];
};

export type Pic = { src: string; w: number; h: number; cut: boolean };
export type Word = { w: string; f0: number; f1: number };
export type Beat = { text: string; visual: Visual; clip?: string | null; imgs?: Pic[]; scene: number; from: number; dur: number; words: Word[] };
export type Scene = { title: string; layer?: string; from: number };
export type Quiz = { question: string; options: string[]; answer: number; explanation: string; cdFrom: number; cdTo: number };

export type Props = {
  id: string; kind: 'long' | 'short'; fps: number; width: number; height: number; durationInFrames: number;
  style: Style; handle: string; scenes: Scene[]; beats: Beat[]; quiz?: Quiz | null;
  thumbText: string; thumbHighlight: string; thumbClip?: string | null; thumbImg?: string | null;
};

export const trUpper = (s: string) => s.toLocaleUpperCase('tr-TR');
