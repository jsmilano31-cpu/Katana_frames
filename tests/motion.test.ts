import { describe, expect, it } from 'vitest';
import { chapters } from '../src/config';
import { activeChapter, sampleCamera } from '../src/motion';

describe('the reversible camera journey', () => {
  it('hits every authored chapter pose in desktop and portrait framing', () => {
    for (const mobile of [false, true]) for (const chapter of chapters) {
      const actual = sampleCamera(chapter.progress, mobile);
      const expected = chapter[mobile ? 'mobile' : 'desktop'];
      actual.position.forEach((value, axis) => expect(value).toBeCloseTo(expected.position[axis], 8));
      actual.target.forEach((value, axis) => expect(value).toBeCloseTo(expected.target[axis], 8));
    }
  });

  it('stays continuous at chapter boundaries and produces identical views on reversal', () => {
    for (const mobile of [false, true]) {
      for (const chapter of chapters.slice(1, -1)) {
        const before = sampleCamera(chapter.progress - 0.00001, mobile);
        const after = sampleCamera(chapter.progress + 0.00001, mobile);
        before.position.forEach((value, axis) => expect(Math.abs(value - after.position[axis])).toBeLessThan(0.001));
      }
      const forward = Array.from({ length: 101 }, (_, step) => sampleCamera(step / 100, mobile));
      const reverse = Array.from({ length: 101 }, (_, step) => sampleCamera((100 - step) / 100, mobile)).reverse();
      expect(reverse).toEqual(forward);
      forward.forEach(pose => {
        expect([...pose.position, ...pose.target, pose.fov].every(Number.isFinite)).toBe(true);
        expect(pose.position[2]).toBeGreaterThan(1);
      });
    }
  });

  it('clamps overscroll and selects the endpoints correctly', () => {
    expect(sampleCamera(-1, false)).toEqual(sampleCamera(0, false));
    expect(sampleCamera(2, false)).toEqual(sampleCamera(1, false));
    expect(activeChapter(-1)).toBe(0);
    expect(activeChapter(2)).toBe(4);
  });
});
