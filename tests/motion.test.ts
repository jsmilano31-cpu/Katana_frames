import { describe, expect, it } from 'vitest';
import { chapters, choreography } from '../src/config';
import { activeChapter, sampleCamera, sampleChoreography, sampleEffects } from '../src/motion';

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
    expect(activeChapter(2)).toBe(5);
  });
});

describe('wind and ground contact',()=>{
  it('keeps wind inside extraction and removes impact state when rewound',()=>{
    expect(sampleEffects(0).drawStrength).toBe(0);
    expect(sampleEffects(.25).drawStrength).toBeGreaterThan(.3);
    expect(sampleEffects(.4).drawStrength).toBeCloseTo(0);
    expect(sampleEffects(.964).contact).toBe(false);
    expect(sampleEffects(.965).contact).toBe(true);
    expect(sampleEffects(.98).burst).toBeGreaterThan(.9);
    expect(sampleEffects(1).burst).toBeCloseTo(0);
    const forward=Array.from({length:1001},(_,i)=>sampleEffects(i/1000));
    const reverse=Array.from({length:1001},(_,i)=>sampleEffects((1000-i)/1000)).reverse();
    expect(reverse).toEqual(forward);
  });
  it('holds the planted transform and camera after settling',()=>{
    const contact=sampleChoreography(.965),settled=sampleChoreography(1);
    expect(contact.toRotation).toEqual(settled.toRotation);
    for(const p of [.965,.98,1])expect(sampleEffects(p).lift).toBe(0);
    expect(sampleCamera(.995,false)).toEqual(sampleCamera(1,false));
    expect(sampleEffects(.94).lift).toBeGreaterThan(sampleEffects(.95).lift);
  });
});


describe('the draw and scene choreography', () => {
  it('clears the full blade before the camera sweep and keeps the scabbard away', () => {
    const seated=sampleChoreography(.12);
    expect(seated.sword).toEqual([0,0,0]);
    expect(seated.scabbard).toEqual([0,0,0]);
    const cleared=sampleChoreography(.38);
    expect(cleared.scabbard[0]-cleared.sword[0]).toBeGreaterThan(3.2);
    for(let p=.38;p<=1;p+=.01){const state=sampleChoreography(p);expect(state.scabbard[0]-state.sword[0]).toBeGreaterThan(3.2);}
  });
  it('restores object transforms, lighting and artwork exactly on reverse scroll', () => {
    const forward=Array.from({length:101},(_,i)=>sampleChoreography(i/100));
    const reversed=Array.from({length:101},(_,i)=>sampleChoreography((100-i)/100)).reverse();
    expect(reversed).toEqual(forward);
    for(const key of choreography.slice(1,-1)){
      const before=sampleChoreography(key.progress-.00001),after=sampleChoreography(key.progress+.00001);
      [...before.sword,...before.scabbard,before.light,before.ink].forEach((v,i)=>expect(Math.abs(v-[...after.sword,...after.scabbard,after.light,after.ink][i])).toBeLessThan(.001));
    }
    forward.forEach(state=>expect([...state.sword,...state.scabbard,state.light,state.ink].every(Number.isFinite)).toBe(true));
    expect(sampleChoreography(0).light).toBe(0);
    expect(sampleChoreography(1).light).toBe(1);
    expect(sampleChoreography(1).scabbardOpacity).toBe(0);
  });
});
