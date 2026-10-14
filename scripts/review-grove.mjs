import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const base=process.env.KATANA_PREVIEW_URL??'http://127.0.0.1:5173';
const output='docs/moonlit-grove';await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});const report=[];
try{
  for(const [name,width,height] of [['desktop',1440,900],['wide',1809,685],['portrait',390,844],['landscape',844,390],['compact',320,568]]){
    console.log(`Inspecting ${name}`);
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    const errors=[],consoleErrors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
    await page.goto(`${base}/?capture=1`);await page.waitForFunction(()=>window.__katana?.state().view==='3d',undefined,{timeout:60000});
    for(const [label,progress] of [['draw',.25],['mist',.81],['reveal',.93],['impact',.973],['final',1]]){
      await page.evaluate(p=>window.__katana.captureProgress(p),progress);
      if(label==='impact')await page.evaluate(()=>window.__katana.captureImpact(.3));
      await page.waitForTimeout(200);await page.screenshot({path:`${output}/${name}-${label}.png`});
    }
    await page.locator('.explore-button').focus();await page.keyboard.press('Enter');await page.waitForTimeout(400);
    await page.screenshot({path:`${output}/${name}-explore.png`});
    for(let side=1;side<=4;side++){
      await page.locator('canvas').focus();for(let i=0;i<13;i++)await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(250);await page.screenshot({path:`${output}/${name}-orbit-${side}.png`});
    }
    await page.locator('.viewer-menu-toggle').click();await page.locator('.viewer-help summary').click();for(let i=0;i<4;i++)await page.locator('[data-zoom="in"]').click();await page.screenshot({path:`${output}/${name}-close.png`});
    await page.locator('.reset-button').click();await page.keyboard.press('Escape');await page.keyboard.press('Escape');
    const state=await page.evaluate(()=>window.__katana.state());
    report.push({name,width,height,errors,consoleErrors,failed,state,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),bottomGap:await page.evaluate(()=>document.documentElement.scrollHeight-document.querySelector('.story').getBoundingClientRect().height)});
    if(name==='portrait'){
      await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-nav="5"]').click();await page.waitForTimeout(500);await page.screenshot({path:`${output}/portrait-static.png`});
    }
    await page.close();
  }
  await writeFile(`${output}/visual-checks.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify(report.map(({name,errors,consoleErrors,failed,overflow,bottomGap})=>({name,errors,consoleErrors,failed,overflow,bottomGap}))));
}finally{await browser.close();}
