import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const base=process.env.KATANA_PREVIEW_URL??'http://127.0.0.1:5173';
const output='docs/wind-impact';await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const report=[];
try{
  for(const [name,width,height] of [['desktop',1440,900],['wide',1809,685],['portrait',390,844],['landscape',844,390],['compact',320,568]]){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    const errors=[],failed=[];page.on('pageerror',error=>errors.push(error.message));
    page.on('response',response=>{if(response.status()>=400)failed.push({url:response.url(),status:response.status()});});
    const response=await page.goto(`${base}/?capture=1`);
    await page.waitForFunction(()=>window.__katana?.state().view==='3d',undefined,{timeout:60000});
    await page.waitForTimeout(1100);
    for(const [act,progress] of [['0',0],['1',.25],['2',.47],['3',.64],['4',.81],['turn',.94],['impact',.973],['5',1]]){
      await page.evaluate(p=>window.__katana.captureProgress(p),progress);
      await page.waitForTimeout(250);
      await page.screenshot({path:`${output}/${name}-${act}.png`});
    }
    report.push({name,width,height,status:response.status(),errors,failed,final:await page.evaluate(()=>window.__katana.state()),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
    await page.locator('.explore-button').click();
    await page.screenshot({path:`${output}/${name}-explore.png`});
    for(let i=0;i<8;i++)await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    await page.screenshot({path:`${output}/${name}-orbit.png`});
    await page.keyboard.press('Escape');
    if(name==='portrait'){
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.locator('[data-nav="5"]').click();
      await page.waitForTimeout(500);
      await page.screenshot({path:`${output}/portrait-static.png`});
    }
    await page.close();
  }
  await writeFile(`${output}/visual-checks.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify(report.map(({name,status,errors,failed,overflow})=>({name,status,errors,failed,overflow}))));
}finally{await browser.close();}
