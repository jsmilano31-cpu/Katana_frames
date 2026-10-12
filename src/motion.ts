import { chapters, type CameraPose, type Vec3 } from './config';

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

export function cubicBezier(a: Vec3, b: Vec3, c: Vec3, d: Vec3, t: number): Vec3 {
  const u = 1 - clamp01(t);
  const v = clamp01(t);
  return [0, 1, 2].map(i => u ** 3 * a[i] + 3 * u ** 2 * v * b[i] + 3 * u * v ** 2 * c[i] + v ** 3 * d[i]) as unknown as Vec3;
}

const mix = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const ease = (t: number) => t * t * (3 - 2 * t);

export function sampleCamera(progress: number, mobile: boolean): CameraPose {
  const p = clamp01(progress);
  const index = Math.min(chapters.length - 2, Math.floor(p * (chapters.length - 1)));
  const from = chapters[index][mobile ? 'mobile' : 'desktop'];
  const to = chapters[index + 1][mobile ? 'mobile' : 'desktop'];
  const local = ease((p - chapters[index].progress) / (chapters[index + 1].progress - chapters[index].progress));
  const positionB = [...mix(from.position, to.position, 0.32)] as [number, number, number];
  const positionC = [...mix(from.position, to.position, 0.68)] as [number, number, number];
  // A restrained sideways arc gives each transition depth without a camera spin.
  const arc = [0.22, -0.28, 0.12, 0.35][index];
  positionB[0] += arc;
  positionC[0] += arc;
  positionB[1] += 0.12;
  positionC[1] += 0.12;
  return {
    position: cubicBezier(from.position, positionB, positionC, to.position, local),
    target: cubicBezier(from.target, mix(from.target, to.target, 0.33), mix(from.target, to.target, 0.67), to.target, local),
    fov: from.fov + (to.fov - from.fov) * local,
    roll: (from.roll ?? 0) + ((to.roll ?? 0) - (from.roll ?? 0)) * local,
  };
}

export function activeChapter(progress: number): number {
  return Math.min(chapters.length - 1, Math.max(0, Math.round(clamp01(progress) * (chapters.length - 1))));
}
