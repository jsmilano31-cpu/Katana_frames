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
  await page.locator('.explore-button').click();
  for(let i=0;i<20;i++)await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  const orbited=await page.evaluate(()=>window.__katana.state());
  expect(orbited.choreography!.tip).toEqual(tip);
  expect(orbited.pose.position[1]).toBeGreaterThan(sceneConfig.effects.ground[1]);
  await page.setViewportSize({width:844,height:390});
  await page.waitForTimeout(350);
  expect(await page.evaluate(()=>window.__katana.state().choreography!.tip)).toEqual(tip);
  await page.locator('.reset-button').click();
  await page.locator('.exit-button').click();
  await expect(page.locator('.explore-panel')).toBeHidden();
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
