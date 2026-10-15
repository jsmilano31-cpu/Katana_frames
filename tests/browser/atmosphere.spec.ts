import {expect,test} from '@playwright/test';
import {enterViewer,viewerControl} from './viewer';

test('dragon follows reversible scroll and disappears before the grove',async({page})=>{
  test.setTimeout(90000);await page.goto('/?capture=1');
  await expect(page.locator('body')).toHaveAttribute('data-view','3d',{timeout:60000});
  for(const [p,visible] of [[0,false],[.2,true],[.36,true],[.56,false],[1,false],[.36,true],[0,false]] as const){
    await page.evaluate(p=>window.__katana.captureProgress!(p),p);
    expect((await page.evaluate(()=>window.__katana.atmosphere()))!.dragon.visible).toBe(visible);
  }
  await page.evaluate(()=>window.__katana.captureProgress!(.36));
  expect((await page.evaluate(()=>window.__katana.atmosphere()))!.dragon.eye).toBe(1);
  expect((await page.evaluate(()=>window.__katana.atmosphere()))!.dragon.loaded).toBe(true);
  await page.evaluate(()=>window.__katana.captureProgress!(.25));
  const partial=await page.evaluate(()=>({dragon:window.__katana.atmosphere()!.dragon,blade:window.__katana.state().choreography!.effects}));
  expect(partial.dragon.extraction).toBeCloseTo((partial.blade.exposed-.01)/.99,8);
  expect(partial.dragon.eye).toBe(0);
  await page.evaluate(()=>window.__katana.captureProgress!(.34));
  expect((await page.evaluate(()=>window.__katana.state().choreography))!.effects.awakening.glint).toBe(1);
  expect((await page.evaluate(()=>window.__katana.atmosphere()))!.dragon.eye).toBe(1);
  await page.setViewportSize({width:844,height:390});
  expect((await page.evaluate(()=>window.__katana.atmosphere()))!.dragon.eye).toBe(1);
});

test('a failed decorative dragon texture leaves the katana and finale usable',async({page})=>{
  test.setTimeout(90000);await page.route('**/assets/dragon/*.png',route=>route.abort());
  await page.goto('/?capture=1');
  await expect(page.locator('body')).toHaveAttribute('data-view','3d',{timeout:60000});
  await page.evaluate(()=>window.__katana.captureProgress!(.34));
  expect((await page.evaluate(()=>window.__katana.atmosphere()))!.dragon).toMatchObject({failed:true,loaded:false,visible:false});
  await page.evaluate(()=>window.__katana.captureProgress!(1));await enterViewer(page);
  expect(await page.evaluate(()=>window.__katana.state().exploring)).toBe(true);
});

test('leaf carpet survives camera and pause controls, stays bounded, and Replay clears it',async({page})=>{
  test.setTimeout(90000);await page.goto('/?capture=1#form');
  await expect(page.locator('body')).toHaveAttribute('data-view','3d',{timeout:60000});
  await page.evaluate(()=>window.__katana.captureProgress!(1));
  await page.evaluate(()=>window.__katana.captureLeaves!(600));
  const before=(await page.evaluate(()=>window.__katana.atmosphere()))!.leaves;
  expect(before.baked).toBeGreaterThan(1000);expect(before.airborne).toBeLessThanOrEqual(before.airborneLimit);
  expect(before.landed).toBe(before.landedLimit);expect(before.baked+before.airborne+before.landed).toBe(before.spawned);
  await enterViewer(page);await page.keyboard.press('ArrowRight');await page.keyboard.press('+');
  await viewerControl(page,'.reset-button');
  expect((await page.evaluate(()=>window.__katana.atmosphere()))!.leaves).toEqual(before);
  await viewerControl(page,'.explore-ui .effects-button');await page.waitForTimeout(450);
  await viewerControl(page,'.explore-ui .effects-button');
  const paused=(await page.evaluate(()=>window.__katana.atmosphere()))!.leaves;
  expect(paused.time).toBeGreaterThan(before.time);await page.waitForTimeout(200);
  expect((await page.evaluate(()=>window.__katana.atmosphere()))!.leaves.time).toBe(paused.time);
  await page.keyboard.press('Escape');await page.keyboard.press('Escape');
  await page.evaluate(()=>window.__katana.captureProgress!(.81));
  expect((await page.evaluate(()=>window.__katana.atmosphere()))!.leaves.spawned).toBe(paused.spawned);
  await page.evaluate(()=>window.__katana.captureProgress!(1));await page.locator('.ambient-control').click();await page.locator('.replay-button').click();
  await page.waitForTimeout(350);
  expect((await page.evaluate(()=>window.__katana.atmosphere()))!.leaves.spawned).toBe(0);
});
