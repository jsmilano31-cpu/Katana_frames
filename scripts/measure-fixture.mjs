import { chromium, devices } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { testGlb } from '../tests/fixture.ts';
import { readFile } from 'node:fs/promises';

const base = process.env.KATANA_PREVIEW_URL ?? 'http://127.0.0.1:5174';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const realModel = process.argv.includes('--real');
const manifest = JSON.parse(await readFile('public/assets/model/manifest.json', 'utf8'));
if (realModel && manifest.status !== 'ready') throw new Error('Import the official model first.');
const results = [];
try {
  for (const [name, options] of [
    ['Desktop 1440 × 900', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }],
    ['Pixel 7 emulation', devices['Pixel 7']],
  ]) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    if (!realModel) {
      await page.route('**/assets/model/manifest.json?*', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ status: 'ready', url: '/assets/model/katana.glb', modifications: 'Test-only fixture; not the selected katana.', postersReady: false }) }));
      await page.route('**/assets/model/katana.glb?*', route => route.fulfill({ contentType: 'model/gltf-binary', body: testGlb() }));
    }
    await page.goto(base);
    await page.waitForFunction(() => document.body.dataset.view === '3d');
    const gpu = await page.evaluate(() => {
      const context = document.querySelector('canvas').getContext('webgl2');
      const extension = context.getExtension('WEBGL_debug_renderer_info');
      return extension ? context.getParameter(extension.UNMASKED_RENDERER_WEBGL) : 'Unavailable';
    });
    const samples = await page.evaluate(async () => {
      const started = performance.now();
      const end = document.querySelector('.story').getBoundingClientRect().height - innerHeight;
      const samples = [];
      await new Promise(resolve => {
        function step(now) {
          const t = Math.min(1, (now - started) / 6500);
          window.scrollTo(0, end * (0.5 - Math.cos(t * Math.PI * 2) * 0.5));
          if (window.__katana.state().stats) samples.push(window.__katana.state().stats);
          if (t < 1) requestAnimationFrame(step);
          else resolve();
        }
        requestAnimationFrame(step);
      });
      return samples;
    });
    const unique = [...new Map(samples.map(sample => [sample.fps, sample])).values()];
    const effects=[];
    if(process.argv.includes('--effects')){
      for(const [phase,progress] of [['awakening and mist',.25],['repeated landing bursts',1],['planted ambient',1]]){
        if(phase==='repeated landing bursts'){
          const bursts=[];
          for(let cycle=0;cycle<3;cycle++){
            await page.evaluate(()=>window.scrollTo({top:(document.querySelector('.story').getBoundingClientRect().height-innerHeight)*.93,behavior:'instant'}));
            await page.waitForTimeout(1100);
            await page.evaluate(()=>window.scrollTo({top:document.querySelector('.story').getBoundingClientRect().height-innerHeight,behavior:'instant'}));
            await page.waitForFunction(()=>window.__katana.state().choreography.impact.mode==='playing');
            const sample=await page.evaluate(async()=>{
              const frames=[],started=performance.now();
              await new Promise(resolve=>{
                function frame(now){
                  const canvas=document.querySelector('canvas'),gl=canvas.getContext('webgl2');
                  // synchronize to the completed rendered frame, not a queued RAF callback.
                  gl.finish();frames.push(now);
                  if(now-started<1400)requestAnimationFrame(frame);else resolve();
                }
                requestAnimationFrame(frame);
              });
              return {reportedStats:window.__katana.state().stats,fps:(frames.length-1)*1000/(frames.at(-1)-frames[0])};
            });
            bursts.push(sample);
          }
          effects.push({phase,measurements:bursts,method:'Three native-scroll landings; frame timings synchronized with gl.finish().'});
          continue;
        }
        await page.evaluate(p=>window.scrollTo({top:(document.querySelector('.story').getBoundingClientRect().height-innerHeight)*p,behavior:'instant'}),progress);
        // Allow catch-up and two full measurement windows before sampling.
        await page.waitForTimeout(5600);
        effects.push({phase,...await page.evaluate(()=>window.__katana.state().stats)});
      }
    }
    results.push({ name, browser: await browser.version(), gpu, asset: realModel ? 'Official Katana by J.AkioHonda' : '12-triangle test fixture', measurements: unique, effects, limitation: realModel ? 'Actual model in headless Edge. Portrait is desktop browser emulation, not a physical phone.' : 'Renderer/controller smoke test only; portrait is desktop emulation.' });
    await context.close();
  }
  await mkdir('test-results', { recursive: true });
  await writeFile(realModel ? 'test-results/model-performance.json' : 'test-results/fixture-performance.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
