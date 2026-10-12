import { expect, test, type Page } from '@playwright/test';
import { testGlb } from '../fixture';
import { chapters } from '../../src/config';
import { existsSync } from 'node:fs';

async function withFixture(page: Page): Promise<void> {
  await page.route('**/assets/model/manifest.json?*', route => route.fulfill({
    contentType: 'application/json', body: JSON.stringify({ status: 'ready', url: '/assets/model/katana.glb', name: 'Test fixture', author: 'Test', modifications: 'Test-only fixture; not the selected katana.', postersReady: false }),
  }));
  await page.route('**/assets/model/katana.glb?*', route => route.fulfill({ contentType: 'model/gltf-binary', body: testGlb() }));
}

async function waitForProgress(page: Page, value: number): Promise<void> {
  // Some devices round a chapter destination to the nearest CSS pixel.
  await expect.poll(async () => page.evaluate(value => {
    const travel = document.querySelector('.story')!.getBoundingClientRect().height - innerHeight;
    return Math.abs(window.__katana.state().progress - value) * travel;
  }, value), { timeout: 10_000 }).toBeLessThanOrEqual(1);
}

test('missing model gives a complete accessible still-image journey and retry', async ({ page }) => {
  await page.route('**/assets/model/manifest.json?*', route => route.fulfill({
    contentType: 'application/json', body: JSON.stringify({ status: 'awaiting-official-download', modifications: 'Missing-model test', postersReady: false }),
  }));
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.status-text')).toHaveText('Still-image view · 3D unavailable');
  await expect(page.locator('.chapter')).toHaveCount(6);
  await expect(page.locator('.retry-button')).toBeVisible();
  await expect(page.locator('.explore-button')).toBeDisabled();
  await page.getByRole('navigation', { name: 'Study chapters' }).getByRole('link', { name: 'The edge' }).click();
  await expect(page.locator('[data-nav="2"]')).toHaveAttribute('aria-current', 'step');
  await page.locator('.about-button').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('real WebGL loads, scrolls forward and reverses, then reframes on resize', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await withFixture(page);
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-view', '3d');
  const startingPose = await page.evaluate(() => window.__katana.state().pose);
  await page.locator('[data-nav="2"]').click();
  await waitForProgress(page, chapters[2].progress);
  await expect(page.locator('#edge')).toHaveAttribute('aria-hidden', 'false');
  await page.locator('[data-nav="0"]').click();
  await waitForProgress(page, 0);
  const returned = await page.evaluate(() => window.__katana.state().pose);
  returned.position.forEach((value, axis) => expect(value).toBeCloseTo(startingPose.position[axis], 2));
  await page.evaluate(() => {
    const story = document.querySelector('.story')!;
    window.scrollTo(0, (story.getBoundingClientRect().height - innerHeight) * 0.75);
    window.scrollTo(0, 0);
    window.scrollTo(0, (story.getBoundingClientRect().height - innerHeight) * 0.47);
  });
  await waitForProgress(page, chapters[2].progress);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-nav="3"]').click();
  await waitForProgress(page, chapters[3].progress);
  const portrait = await page.evaluate(() => window.__katana.state().pose);
  expect(portrait.fov).toBe(43);
  expect(portrait.position[2]).toBeCloseTo(chapters[3].mobile.position[2], 1);
  expect(errors).toEqual([]);
});

test('exploration rotates by keyboard and drag, resets, and restores the authored camera on exit', async ({ page }) => {
  await withFixture(page);
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-view', '3d');
  await page.locator('[data-nav="5"]').click();
  await waitForProgress(page, 1);
  const authored = await page.evaluate(() => window.__katana.state().pose);
  const scroll = await page.evaluate(() => scrollY);
  await page.locator('.explore-button').click();
  await expect(page.locator('.explore-panel')).toBeVisible();
  await expect(page.locator('#katana-canvas')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('.exit-button')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#katana-canvas')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowUp');
  const rotated = await page.evaluate(() => window.__katana.state().pose);
  expect(rotated.position).not.toEqual(authored.position);
  await page.locator('.reset-button').click();
  const reset = await page.evaluate(() => window.__katana.state().pose);
  reset.position.forEach((value, axis) => expect(value).toBeCloseTo(authored.position[axis], 1));
  await page.mouse.move(210, 220);
  const beforeDrag = await page.evaluate(() => window.__katana.state().pose.position);
  await page.mouse.down();
  await page.mouse.move(280, 255, { steps: 6 });
  await page.mouse.up();
  await expect.poll(async () => JSON.stringify(await page.evaluate(() => window.__katana.state().pose.position))).not.toBe(JSON.stringify(beforeDrag));
  await page.locator('#katana-canvas').focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('.explore-panel')).toBeHidden();
  await expect(page.locator('.explore-button')).toBeFocused();
  const restored = await page.evaluate(() => window.__katana.state().pose);
  restored.position.forEach((value, axis) => expect(value).toBeCloseTo(authored.position[axis], 2));
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(scroll, 0);
  await page.locator('.replay-button').click();
  await waitForProgress(page, 0);
});

test('reduced motion uses still images without requesting WebGL assets', async ({ page }) => {
  await withFixture(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const assets: string[] = [];
  page.on('request', request => { if (request.url().includes('katana.glb')) assets.push(request.url()); });
  await page.goto('/');
  await expect(page.locator('.status-text')).toHaveText('Still-image view · reduced motion');
  await expect(page.locator('.retry-button')).toBeHidden();
  await page.locator('[data-nav="5"]').click();
  await expect(page.locator('[data-nav="5"]')).toHaveAttribute('aria-current', 'step');
  expect(assets).toEqual([]);
});

test('asset failures fall back and a retry recovers the 3D journey', async ({ page }) => {
  await withFixture(page);
  await page.unroute('**/assets/model/katana.glb?*');
  await page.route('**/assets/model/katana.glb?*', route => route.fulfill({ status: 503, body: 'unavailable' }));
  await page.goto('/');
  await expect(page.locator('.status-text')).toHaveText('Still-image view · 3D unavailable');
  await page.unroute('**/assets/model/katana.glb?*');
  await page.route('**/assets/model/katana.glb?*', route => route.fulfill({ contentType: 'model/gltf-binary', body: testGlb() }));
  await page.locator('.retry-button').click();
  await expect(page.locator('body')).toHaveAttribute('data-view', '3d');
});

test('unavailable WebGL preserves the static journey', async ({ page }) => {
  await withFixture(page);
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto('/');
  await expect(page.locator('.status-text')).toHaveText('Still-image view · 3D unavailable');
  await expect(page.locator('.chapter')).toHaveCount(6);
  await expect(page.locator('.retry-button')).toBeVisible();
});

test('a runtime reduced-motion change exits exploration and keeps navigation usable', async ({ page }) => {
  await withFixture(page);
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-view', '3d');
  await page.locator('[data-nav="5"]').click();
  await waitForProgress(page, 1);
  await page.locator('.explore-button').click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.status-text')).toHaveText('Still-image view · reduced motion');
  await expect(page.locator('.explore-panel')).toBeHidden();
  await page.locator('[data-nav="1"]').click();
  await expect(page.locator('[data-nav="1"]')).toHaveAttribute('aria-current', 'step');
});

test('portrait exploration responds to a touch drag and exits through its toolbar', async ({ page, context, isMobile }) => {
  test.skip(!isMobile, 'Touch input is exercised in the portrait project.');
  await withFixture(page);
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-view', '3d');
  await page.locator('[data-nav="5"]').click();
  await waitForProgress(page, 1);
  await page.locator('.explore-button').tap();
  const before = await page.evaluate(() => window.__katana.state().pose.position);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 130, y: 220 }] });
  for (const x of [145, 160, 175, 190, 205]) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: 240 }] });
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
  await expect.poll(async () => JSON.stringify(await page.evaluate(() => window.__katana.state().pose.position))).not.toBe(JSON.stringify(before));
  await page.locator('.exit-button').tap();
  await expect(page.locator('.explore-panel')).toBeHidden();
  await waitForProgress(page, 1);
});

test('the official katana loads with local textures and all six authored views', async ({ page }) => {
  test.skip(!existsSync('public/assets/model/katana.glb'), 'An official model must be imported.');
  const errors: string[] = [];
  const failed: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failed.push(response.url()); });
  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-view', '3d');
  const seated = await page.evaluate(() => window.__katana.state().choreography);
  for (const index of [1, 2, 3, 4, 5]) {
    await page.locator(`[data-nav="${index}"]`).click();
    await waitForProgress(page, chapters[index].progress);
    const state = await page.evaluate(() => window.__katana.state());
    expect(state.pose.position.every(Number.isFinite)).toBe(true);
    expect(state.chapter).toBe(index);
  }
  await page.locator('.explore-button').click();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Escape');
  await expect(page.locator('.explore-panel')).toBeHidden();
  await page.locator('[data-nav="1"]').click();
  await waitForProgress(page,chapters[1].progress);
  const draw=await page.evaluate(()=>window.__katana.state().choreography!);
  expect(draw.sword[0]).toBeLessThan(-.5);
  expect(draw.scabbard[0]).toBeGreaterThan(.8);
  expect(draw.scabbardVisible).toBe(true);
  await page.locator('[data-nav="0"]').click();
  await waitForProgress(page,0);
  const reseated=await page.evaluate(()=>window.__katana.state().choreography!);
  expect(reseated.sword).toEqual(seated!.sword);
  expect(reseated.scabbard).toEqual(seated!.scabbard);
  reseated.rotation.forEach((v,i)=>expect(v).toBeCloseTo(seated!.rotation[i],5));
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
});


test('the real fallback posters load for all six acts without requesting the GLB',async({page,isMobile})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const glbs:string[]=[];page.on('request',r=>{if(r.url().includes('katana.glb'))glbs.push(r.url())});
  await page.goto('/');await expect(page.locator('body')).toHaveAttribute('data-view','static');
  await expect.poll(()=>page.locator('.chapter-image img').evaluateAll(images=>images.every(image=>(image as HTMLImageElement).complete&&(image as HTMLImageElement).naturalWidth>0))).toBe(true);
  const widths=await page.locator('.chapter-image img').evaluateAll(images=>images.map(image=>(image as HTMLImageElement).naturalWidth));
  expect(widths).toEqual(Array(6).fill(isMobile?390:1440));expect(glbs).toEqual([]);
});


test('orientation changes preserve the draw progress and object transforms',async({page})=>{
  await page.goto('/');await expect(page.locator('body')).toHaveAttribute('data-view','3d');
  await page.locator('[data-nav="1"]').click();await waitForProgress(page,.25);
  const initial=await page.evaluate(()=>window.__katana.state().choreography!);
  for(const viewport of [{width:390,height:844},{width:844,height:390},{width:1440,height:900}]){
    await page.setViewportSize(viewport);
    await expect.poll(()=>page.evaluate(()=>({width:innerWidth,height:innerHeight}))).toEqual(viewport);
    await page.waitForTimeout(300);await waitForProgress(page,.25);
    const reframed=await page.evaluate(()=>window.__katana.state().choreography!);
    reframed.sword.forEach((v,i)=>expect(v).toBeCloseTo(initial.sword[i],2));
    reframed.scabbard.forEach((v,i)=>expect(v).toBeCloseTo(initial.scabbard[i],2));
    expect(await page.evaluate(()=>window.__katana.state().chapter)).toBe(1);
  }
});
