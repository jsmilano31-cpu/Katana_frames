import {chromium,devices} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.KATANA_PREVIEW_URL??'http://127.0.0.1:4173';
const browser=await chromium.launch({channel:'msedge',headless:true}),results=[];
try{
  for(const [name,options] of [['desktop',{viewport:{width:1440,height:900},deviceScaleFactor:1}],['Pixel 7 emulation',devices['Pixel 7']]]){
    const context=await browser.newContext(options),page=await context.newPage();const errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(`${base}/?capture=1`);await page.waitForFunction(()=>window.__katana?.state().view==='3d',undefined,{timeout:60000});
    const gpu=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'Unknown';});
    await page.evaluate(()=>window.__katana.captureProgress(.34));await page.locator('.ambient-control').click();await page.waitForTimeout(1000);
    const measurement=await page.evaluate(async()=>{
      const frames=[],start=performance.now(),gl=document.querySelector('canvas').getContext('webgl2');
      await new Promise(resolve=>{function tick(now){gl.finish();frames.push(now);if(now-start<5000)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});
      return{fps:(frames.length-1)*1000/(frames.at(-1)-frames[0]),stats:window.__katana.state().stats,dragon:window.__katana.atmosphere().dragon};
    });
    results.push({name,browser:await browser.version(),gpu,errors,...measurement,method:'Five-second headless rendered-frame throughput synchronized with gl.finish(); production build, real GLB, painted dragon, vermilion sun, registered eye, and active ambient mist. Mobile is desktop emulation, not physical-device testing.'});
    await context.close();
  }
  await mkdir('docs/dragon-refinement',{recursive:true});await writeFile('docs/dragon-refinement/performance.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();}
