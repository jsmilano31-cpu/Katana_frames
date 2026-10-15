import {describe,it,expect} from 'vitest';
import {sampleDragon} from '../src/dragon';
import {LeafSimulation} from '../src/leaf-state';
import {sceneConfig} from '../src/config';

describe('scroll-linked dragon awakening',()=>{
  it('reveals, opens the eye, dissolves, and samples identically in reverse',()=>{
    expect(sampleDragon(.1).body).toBe(0);expect(sampleDragon(.24).body).toBe(1);
    expect(sampleDragon(.24).eye).toBe(0);expect(sampleDragon(.36).eye).toBe(1);
    expect(sampleDragon(.52).body).toBe(0);expect(sampleDragon(.56).eye).toBe(0);
    const forward=Array.from({length:101},(_,i)=>sampleDragon(i/100));
    expect(Array.from({length:101},(_,i)=>sampleDragon((100-i)/100)).reverse()).toEqual(forward);
  });
});
describe('persistent, bounded leaf accumulation',()=>{
  it('keeps every spawned leaf accounted for through an hour of accumulation',()=>{
    let baked=0;const state=new LeafSimulation(leaf=>{baked++;expect(Math.hypot(leaf.x,leaf.z)).toBeGreaterThan(sceneConfig.leafFall.innerRadius);});
    state.advance(3600);
    expect(state.airborne.length).toBeLessThanOrEqual(96);expect(state.landed.length).toBe(512);
    expect(state.baked).toBe(baked);expect(baked).toBeGreaterThan(20000);
    expect(state.airborne.length+state.landed.length+state.baked).toBe(state.spawned);
    const settled={...state.landed[10]};state.advance(1);expect(state.landed.some(leaf=>leaf.id===settled.id&&leaf.x===settled.x&&leaf.z===settled.z)).toBe(true);
    state.reset();expect(state.diagnostics()).toMatchObject({time:0,airborne:0,landed:0,baked:0,spawned:0});
  });
  it('preserves accumulation when density changes and lands at the ground without tunneling',()=>{
    const state=new LeafSimulation();state.advance(80);const before=state.spawned;
    state.setMobile(true);expect(state.landed.length).toBeLessThanOrEqual(256);
    state.advance(120);expect(state.airborne.length).toBeLessThanOrEqual(48);expect(state.landed.length).toBe(256);
    expect(state.spawned).toBeGreaterThan(before);expect(state.baked).toBeGreaterThan(0);
    for(const leaf of state.airborne)expect(state.pose(leaf).y).toBeGreaterThanOrEqual(0);
    expect(state.baked+state.landed.length+state.airborne.length).toBe(state.spawned);
  });
});
