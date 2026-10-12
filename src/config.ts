export type Vec3 = readonly [number, number, number];
export type ChapterId = 'reveal' | 'blade' | 'guard' | 'handle' | 'form';

export interface CameraPose {
  position: Vec3;
  target: Vec3;
  fov: number;
  roll?: number;
}

export interface Chapter {
  id: ChapterId;
  label: string;
  japanese: string;
  eyebrow: string;
  title: string;
  description: string;
  note: string;
  progress: number;
  desktop: CameraPose;
  mobile: CameraPose;
  poster: { position: string; scale: number };
}

export const chapters: readonly Chapter[] = [
  {
    id: 'reveal', label: 'The reveal', japanese: '刀', eyebrow: 'A study in form',
    title: 'The quiet<br>edge of form.',
    description: 'One blade. A different perspective.<br>A journey through the details of a katana.',
    note: 'Scroll to begin the study', progress: 0,
    desktop: { position: [0.1, 0.8, 8], target: [-1.7, 0.15, 0], fov: 36 },
    mobile: { position: [1.3, -1.05, 11.5], target: [1.23, -1.45, 0], fov: 43, roll: -0.7 },
    poster: { position: '58% 50%', scale: 1 },
  },
  {
    id: 'blade', label: 'The blade', japanese: '刃', eyebrow: '01 / The blade',
    title: 'A line.<br>A presence.',
    description: 'Follow the curve of the steel.<br>Light traces what the eye might miss.',
    note: 'Steel · curve · reflection', progress: 0.25,
    desktop: { position: [0.9, 0.45, 2.8], target: [0.35, -0.28, 0], fov: 36 },
    mobile: { position: [1.3, -0.45, 3.7], target: [1.3, -0.9, 0], fov: 43, roll: -0.7 },
    poster: { position: '92% 83%', scale: 1.55 },
  },
  {
    id: 'guard', label: 'The guard', japanese: '鍔', eyebrow: '02 / Tsuba',
    title: 'Where two<br>worlds meet.',
    description: 'Between blade and hand, the guard.<br>A small form with a distinct presence.',
    note: 'Tsuba · the guard', progress: 0.5,
    desktop: { position: [-0.4, 0.6, 1.85], target: [-1.45, 0.34, 0], fov: 36 },
    mobile: { position: [-0.1, 0.4, 2.6], target: [-0.65, -0.12, 0], fov: 43, roll: -0.7 },
    poster: { position: '44% 39%', scale: 1.75 },
  },
  {
    id: 'handle', label: 'The handle', japanese: '柄', eyebrow: '03 / Tsuka',
    title: 'A rhythm<br>in the wrap.',
    description: 'Repeating diamonds. Woven texture.<br>Discover the detail along the grip.',
    note: 'Tsuka · the wrapped handle', progress: 0.75,
    desktop: { position: [-1.15, 0.8, 2.6], target: [-2, 0.53, 0], fov: 36 },
    mobile: { position: [-1.3, 0.5, 3.6], target: [-1.11, -0.03, 0], fov: 43, roll: -0.7 },
    poster: { position: '14% 20%', scale: 1.7 },
  },
  {
    id: 'form', label: 'The full form', japanese: '形', eyebrow: '04 / The full form',
    title: 'Every angle.<br>One form.',
    description: 'The details return to the whole.<br>Take a moment. Make it your own perspective.',
    note: 'The study is yours to explore', progress: 1,
    desktop: { position: [0.2, 0.6, 7.8], target: [-1.7, 0.1, 0], fov: 36 },
    mobile: { position: [1.3, -1.05, 11.3], target: [1.23, -1.45, 0], fov: 43, roll: -0.7 },
    poster: { position: '60% 50%', scale: 1 },
  },
];

export const sceneConfig = {
  breakpoint: 760,
  desktopTravel: 8,
  mobileTravel: 6,
  scrubSeconds: 0.8,
  model: {
    length: 4, rotation: [0, 0, -0.32] as Vec3, flipBlade: false,
    presentationNode: 'Sketchfab_model', sourceRotation: [-Math.PI / 2, 0, 0] as Vec3,
    hiddenMeshes: /saya|scabbard|sheath|kurikata/i,
  },
  renderer: { desktopDpr: 1.75, mobileDpr: 1.25, minimumDpr: 0.75, exposure: 0.92 },
} as const;

export interface AssetManifest {
  status: 'ready' | 'awaiting-official-download';
  url: string;
  name: string;
  author: string;
  source: string;
  license: string;
  licenseUrl: string;
  modifications: string;
  postersReady: boolean;
}
