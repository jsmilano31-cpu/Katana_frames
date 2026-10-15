import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.KATANA_PREVIEW_URL??'http://127.0.0.1:5173',out='docs/divine-awakening';
await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true}),report=[];
try{
  for(const [name,width,height] of [['desktop',1440,900],['wide',1809,685],['portrait',390,844],['landscape',844,390],['compact',320,568]]){
    console.log(`Reviewing ${name}`);const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
    await page.goto(`${base}/?capture=1`);await page.waitForFunction(()=>window.__katana?.state().view==='3d',undefined,{timeout:60000});
    for(const [label,p] of [['emerge',.2],['eye-opening',.28],['awakened',.36],['dissolve',.44],['stillness',.56]]){
      await page.evaluate(p=>window.__katana.captureProgress(p),p);await page.screenshot({path:`${out}/${name}-${label}.png`});
    }
    await page.evaluate(()=>window.__katana.captureProgress(1));await page.evaluate(()=>window.__katana.captureLeaves(90));
    await page.screenshot({path:`${out}/${name}-ending.png`});
    await page.mouse.click(width*.65,height*.65);await page.waitForFunction(()=>window.__katana.state().exploring);
    await page.screenshot({path:`${out}/${name}-grove.png`});
    for(let side=1;side<=4;side++){
      await page.locator('canvas').focus();for(let i=0;i<13;i++)await page.keyboard.press('ArrowRight');
      await page.screenshot({path:`${out}/${name}-orbit-${side}.png`});
    }
    await page.evaluate(()=>window.__katana.captureLeaves(600));await page.screenshot({path:`${out}/${name}-carpet.png`});
    for(let i=0;i<8;i++)await page.keyboard.press('+');await page.screenshot({path:`${out}/${name}-close.png`});
    for(let i=0;i<22;i++)await page.keyboard.press('-');await page.screenshot({path:`${out}/${name}-wide-view.png`});
    const leaves=await page.evaluate(()=>window.__katana.atmosphere().leaves);
    await page.keyboard.press('Escape');await page.evaluate(()=>window.__katana.captureProgress(1));
    const visibility=await page.evaluate(()=>window.__katana.captureVisibility());
    report.push({name,width,height,errors,failed,leaves,visibility,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),bottomGap:await page.evaluate(()=>document.documentElement.scrollHeight-document.querySelector('.story').getBoundingClientRect().height)});
    if(name==='portrait'){await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-nav="5"]').click();await page.screenshot({path:`${out}/portrait-static.png`});}
    await page.close();
  }
  await writeFile(`${out}/visual-checks.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
