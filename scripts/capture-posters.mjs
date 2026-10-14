import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const manifestPath = path.join(process.cwd(), 'public/assets/model/manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (manifest.status !== 'ready') throw new Error('Import the official katana before rendering chapter posters.');
const base = process.env.KATANA_PREVIEW_URL ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: process.env.KATANA_BROWSER_CHANNEL ?? 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(`${base}/?capture=1`);
  await page.waitForFunction(() => window.__katana?.state().view === '3d', undefined, { timeout: 60000 });
  await page.addStyleTag({ content: '.site-header,.chapter-panels,.chapter-panels *,.chapter-nav,.object-caption,.view-status,.site-footer,.journey-progress,.skip-link,.ambient-control{visibility:hidden!important} .scene-stage{visibility:visible!important} canvas{transition:none!important;opacity:1!important}' });
  const output = path.join(process.cwd(), 'public/assets/posters');
  await mkdir(output, { recursive: true });
  for (const [suffix, width, height] of [['', 1440, 900], ['-mobile', 390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(200);
    for (let index = 0; index < 6; index++) {
      await page.evaluate(index => window.__katana.captureChapter(index), index);
      await page.waitForTimeout(80);
      await page.screenshot({ path: path.join(output, `chapter-${index}${suffix}.png`) });
    }
  }
  manifest.postersReady = true;
  manifest.modifications = 'glTF resources embedded into GLB; original geometry and PBR textures preserved. Presentation orientation reset; sword/scabbard groups aligned and normalized for reversible unsheathing. Separate awakening light layer, original procedural mist and ink artwork, studio lighting, and a stone impact setting added. Original procedural moonlit bamboo grove with camera orbit, zoom, and pan added. Desktop and portrait chapter posters rendered.';
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log('Captured twelve chapter posters from the official model. Inspect them before the final asset check.');
} finally {
  await browser.close();
}
