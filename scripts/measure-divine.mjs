import {chromium,devices} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.KATANA_PREVIEW_URL??'http://127.0.0.1:4173',browser=await chromium.launch({channel:'msedge',headless:true}),results=[];
async function frames(page,orbit=false){
  return page.evaluate(async orbit=>{
    const frames=[],start=performance.now(),canvas=document.querySelector('canvas'),gl=canvas.getContext('webgl2');
    await new Promise(resolve=>{function tick(now){
      if(orbit&&frames.length%4===0)canvas.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
      gl.finish();frames.push(now);if(now-start<5000)requestAnimationFrame(tick);else resolve();
    }requestAnimationFrame(tick);});
    return{fps:(frames.length-1)*1000/(frames.at(-1)-frames[0]),stats:window.__katana.state().stats,atmosphere:window.__katana.atmosphere()};
  },orbit);
}
try{
  for(const [name,options] of [['desktop',{viewport:{width:1440,height:900},deviceScaleFactor:1}],['Pixel 7 emulation',devices['Pixel 7']]]){
    const context=await browser.newContext(options),page=await context.newPage();await page.goto(`${base}/?capture=1`);
    await page.waitForFunction(()=>window.__katana?.state().view==='3d',undefined,{timeout:60000});
    const gpu=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'Unknown';});
    await page.evaluate(()=>window.__katana.captureProgress(.36));await page.locator('.ambient-control').click();await page.waitForTimeout(1000);
    const awakening=await frames(page);
    await page.evaluate(()=>window.__katana.captureProgress(1));await page.evaluate(()=>window.__katana.captureLeaves(600));
    await page.locator('.explore-button').focus();await page.keyboard.press('Enter');await page.waitForTimeout(500);await page.locator('canvas').focus();
    const grove=await frames(page,true);
    await page.evaluate(()=>window.__katana.captureLeaves(3600));const hour=await frames(page,true);
    results.push({name,browser:await browser.version(),gpu,awakening,grove,hour,method:'Five-second rendered-frame timings synchronized with gl.finish(); real GLB, dragon, mist, sword field, and bounded leaf carpet. Capture hooks prefill leaves; ambient effects are resumed. Mobile is desktop emulation.'});
    await context.close();
  }
  await mkdir('docs/divine-awakening',{recursive:true});await writeFile('docs/divine-awakening/performance.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();}
