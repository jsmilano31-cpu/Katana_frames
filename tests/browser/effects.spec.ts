import {enterViewer,viewerControl} from './viewer';
import { test, expect } from '@playwright/test';
import { sceneConfig } from '../../src/config';

test('wind rewinds cleanly and planted contact survives exploration and resizing',async({page})=>{
  await page.goto('/?capture=1');
  await expect(page.locator('body')).toHaveAttribute('data-view','3d');
  const samples=new Map<number,unknown>();
  for(const p of [.18,.3,.94,.97,.985,1,.985,.97,.94,.3,.18]){
    await page.evaluate(p=>window.__katana.captureProgress!(p),p);
    const state=await page.evaluate(()=>window.__katana.state().choreography!);
    const stable={effects:state.effects,tip:state.tip,rotation:state.rotation};
    if(samples.has(p))expect(stable).toEqual(samples.get(p));else samples.set(p,stable);
    expect(state.effects.contact).toBe(p>=sceneConfig.effects.impact);
    if(p>=sceneConfig.effects.impact){
      expect(state.tip[0]).toBeCloseTo(sceneConfig.effects.ground[0],7);
      expect(state.tip[1]).toBeCloseTo(sceneConfig.effects.ground[1]-sceneConfig.effects.embedDepth,7);
      expect(state.tip[2]).toBeCloseTo(sceneConfig.effects.ground[2],7);
    }
  }
  // Use native navigation for the interaction phase, rather than the paused capture hook.
  await page.goto('/#form');
  await expect(page.locator('body')).toHaveAttribute('data-view','3d');
  await expect(page.locator('.explore-button')).toBeEnabled();
  const tip=await page.evaluate(()=>window.__katana.state().choreography!.tip);
  await enterViewer(page);
  for(let i=0;i<20;i++)await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  const orbited=await page.evaluate(()=>window.__katana.state());
  expect(orbited.choreography!.tip).toEqual(tip);
  expect(orbited.pose.position[1]).toBeGreaterThan(sceneConfig.effects.ground[1]);
  await page.setViewportSize({width:844,height:390});
  await page.waitForTimeout(350);
  expect(await page.evaluate(()=>window.__katana.state().choreography!.tip)).toEqual(tip);
  await viewerControl(page,'.reset-button');
  await viewerControl(page,'.exit-button');
  await expect(page.locator('.explore-ui')).toBeHidden();
  expect(await page.evaluate(()=>window.__katana.state().choreography!.tip)).toEqual(tip);
});

test('ambient motion pauses while scroll choreography remains active',async({page})=>{
  await page.goto('/');await expect(page.locator('body')).toHaveAttribute('data-view','3d');
  const clock=()=>page.evaluate(()=>window.__katana.state().choreography!.ambientTime);
  const start=await clock();
  await expect.poll(clock).toBeGreaterThan(start);
  await page.locator('.ambient-control').click();
  await expect(page.locator('.ambient-control')).toHaveAttribute('aria-pressed','true');
  const paused=await clock();await page.waitForTimeout(250);expect(await clock()).toBe(paused);
  await page.locator('[data-nav="1"]').click();
  await expect.poll(()=>page.evaluate(()=>window.__katana.state().choreography!.effects.drawStrength)).toBeGreaterThan(.3);
  expect(await clock()).toBe(paused);
  await page.locator('.ambient-control').click();
  await expect.poll(clock).toBeGreaterThan(paused);
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('body')).toHaveAttribute('data-view','static');
  await expect(page.locator('.ambient-control')).toBeHidden();
});

async function scrollToProgress(page:import('@playwright/test').Page,p:number){
  await page.evaluate(value=>window.scrollTo({top:(document.querySelector('.story')!.getBoundingClientRect().height-innerHeight)*value,behavior:'instant'}),p);
}

test('the real landing completes while scroll is stationary, cancels, and re-arms',async({page})=>{
  await page.goto('/');await expect(page.locator('body')).toHaveAttribute('data-view','3d');
  await scrollToProgress(page,.974);
  await expect.poll(()=>page.evaluate(()=>window.__katana.state().choreography!.impact.mode)).toBe('playing');
  await expect.poll(()=>page.evaluate(()=>window.__katana.state().choreography!.impact.mode)).toBe('settled');
  const landed=await page.evaluate(()=>window.__katana.state());
  expect(landed.choreography!.impact.count).toBe(1);
  expect(Math.abs(landed.progress-.974)).toBeLessThan(.001);
  await scrollToProgress(page,.93);
  await expect.poll(()=>page.evaluate(()=>window.__katana.state().progress)).toBeLessThan(.94);
  await scrollToProgress(page,.974);
  await expect.poll(()=>page.evaluate(()=>window.__katana.state().choreography!.impact.count)).toBe(2);
  await scrollToProgress(page,.95);
  await expect.poll(()=>page.evaluate(()=>window.__katana.state().progress)).toBeLessThan(.965);
  expect(await page.evaluate(()=>window.__katana.state().choreography!.impact.mode)).toBe('armed');
  await scrollToProgress(page,.974);
  await expect.poll(()=>page.evaluate(()=>window.__katana.state().choreography!.impact.mode)).toBe('settled');
  expect(await page.evaluate(()=>window.__katana.state().choreography!.impact.count)).toBe(2);
});

test('the document ends at the planted scene and direct entry does not replay impact',async({page})=>{
  await page.goto('/#form');await expect(page.locator('body')).toHaveAttribute('data-view','3d');
  await expect(page.locator('.explore-button')).toBeEnabled();
  expect(await page.evaluate(()=>window.__katana.state().choreography!.impact.count)).toBe(0);
  expect(await page.evaluate(()=>Math.abs(document.documentElement.scrollHeight-document.querySelector('.story')!.getBoundingClientRect().height))).toBeLessThanOrEqual(1);
  await expect(page.locator('footer')).toHaveCount(0);
  await page.locator('.about-button').click();
  await expect(page.getByRole('dialog').getByRole('link',{name:'Katana by J.AkioHonda'})).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('.replay-button').click();
  await expect.poll(()=>page.evaluate(()=>window.__katana.state().progress)).toBeLessThan(.01);
  await page.locator('[data-nav="5"]').click();await expect(page.locator('.explore-button')).toBeEnabled();
  expect(await page.evaluate(()=>window.__katana.state().choreography!.impact.count)).toBe(1);
});

test('pausing during impact settles the scene and keeps exploration available',async({page})=>{
  await page.goto('/');await expect(page.locator('body')).toHaveAttribute('data-view','3d');
  await scrollToProgress(page,1);
  await expect.poll(()=>page.evaluate(()=>window.__katana.state().choreography!.impact.mode)).toBe('playing');
  await page.locator('.ambient-control').click();
  expect(await page.evaluate(()=>window.__katana.state().choreography!.impact.mode)).toBe('settled');
  await expect(page.locator('.explore-button')).toBeEnabled();
  await enterViewer(page);
  await expect(page.locator('.explore-ui')).toBeVisible();
  await page.keyboard.press('Escape');
});

test('awakening stays on exposed steel and reverses to a dormant blade',async({page})=>{
  await page.goto('/?capture=1');await expect(page.locator('body')).toHaveAttribute('data-view','3d');
  for(const p of [.12,.18,.25,.34,.38,.4,.25,.12]){
    await page.evaluate(value=>window.__katana.captureProgress!(value),p);
    const effect=await page.evaluate(()=>window.__katana.state().choreography!.effects);
    expect(effect.awakening.pulsePosition).toBeLessThanOrEqual(effect.exposed);
    if(p===.25)expect(effect.awakening.pulseStrength).toBeGreaterThan(.7);
    if(p===.4)expect(effect.awakening.glint).toBeGreaterThan(.9);
    if(p===.12)expect(effect.awakening.aura).toBe(0);
  }
});
