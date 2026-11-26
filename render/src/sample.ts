import type { Beat, Props } from './types';

/** Demo props so Remotion Studio (npm run studio) shows every visual type without a real episode. */
const style = {
  bg: '#0E1116', panel: '#1A1F27', text: '#F4F6F8', accent: '#FF5A1F', accent2: '#FFC233', good: '#2BD67B', bad: '#FF3B4E',
  font_head: 'Anton', font_body: 'Inter',
};

const words = (t: string, from: number, dur: number) => {
  const ws = t.split(' '); const step = dur / ws.length;
  return ws.map((w, i) => ({ w, f0: Math.round(from + i * step), f1: Math.round(from + (i + 1) * step) }));
};

export const sample = (kind: 'long' | 'short'): Props => {
  const raw: [string, Beat['visual'], number][] = [
    ['Nabzın sana yağ yakımı hakkında yalan söylüyor olabilir mi?', { type: 'title', text: 'Nabız bölgeleri', highlight: 'Nabız' }, 0],
    ['Önce üç hareket düzlemini tanıyalım.', { type: 'diagram', name: 'planes', params: { highlight: 'all', example: 'squat = sagittal' } }, 1],
    ['Kalp atım hızı rezervine göre şiddet beş bölgeye ayrılır.', { type: 'diagram', name: 'hr_zones', text: 'HRR şiddet bölgeleri', params: { highlight: 2 } }, 1],
    ['Algılanan efor ölçeğinde altı ile yedi orta şiddettir.', { type: 'diagram', name: 'rpe_scale', text: 'RPE', params: { highlight: [6, 7] } }, 2],
    ['Squatta diz fleksiyondan ekstansiyona geçer.', { type: 'diagram', name: 'joint_action', text: 'Diz', params: { from: 90, to: 175, label: 'Ekstansiyon' } }, 2],
    ['Açık ve kapalı zincir arasındaki fark ayağın sabit olmasıdır.', { type: 'diagram', name: 'kinetic_chain', params: { mode: 'both' } }, 2],
    ['Haftada en az yüz elli dakika orta şiddet önerilir.', { type: 'stat', value: '150', label: 'dakika / hafta (WHO)' }, 3],
    ['Hatırla: üç kural.', { type: 'list', text: 'Salonda uygula', items: ['Isın', 'Şiddeti ölç', 'Kademeli artır'] }, 3],
    ['Plank mı, crunch mı?', { type: 'compare', left: 'Plank', right: 'Crunch', verdict: 'left' }, 3],
    ['Plankta vücut tek bir çizgi olmalı.', { type: 'exercise_card', text: 'Ön kol plank', muscles: ['Core', 'Omuz', 'Kalça'], cues: ['Kalça düşmesin', 'Karın sıkı', 'Nefesi tutma'] }, 3],
  ];
  const fps = 30, D = 120;
  const beats: Beat[] = raw.map(([text, visual, scene], i) => ({ text, visual, scene, from: i * D, dur: D, words: words(text, i * D, D - 10), clip: null }));
  const scenes = [{ title: 'Giriş', layer: 'hook' }, { title: 'Sınavda bilmen gerekenler', layer: 'exam' },
    { title: 'Salonda uygulama', layer: 'gym' }, { title: 'Özet', layer: 'summary' }]
    .map((s, i) => ({ ...s, from: beats.find((b) => b.scene === i)!.from }));
  const vertical = kind === 'short';
  return {
    id: 'sample', kind, fps, width: vertical ? 1080 : 1920, height: vertical ? 1920 : 1080, durationInFrames: beats.length * D,
    style, handle: '@RezFitlab', scenes, beats, thumbText: 'Yağ yakımı için doğru nabız', thumbHighlight: 'nabız', thumbClip: null,
    quiz: vertical ? { question: 'RPE 6–7 hangi şiddet sınıfıdır?', options: ['Hafif', 'Orta', 'Yüksek', 'Maksimal'], answer: 1,
      explanation: 'Orta şiddet', cdFrom: 100, cdTo: 220 } : undefined,
  };
};
