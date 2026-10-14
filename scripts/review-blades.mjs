import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.KATANA_PREVIEW_URL??'http://127.0.0.1:5173',output='docs/field-of-blades';await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),report=[];
try{
  for(const [name,width,height] of [['desktop',1440,900],['wide',1809,685],['portrait',390,844],['landscape',844,390],['compact',320,568]]){
    console.log(`Inspecting ${name}`);const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    const errors=[],consoleErrors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
    await page.goto(`${base}/?capture=1`);await page.waitForFunction(()=>window.__katana?.state().view==='3d',undefined,{timeout:60000});
    for(const [label,p] of [['presence',0],['draw',.22],['draw-late',.34],['mist',.81],['reveal',.93],['impact',.973],['final',1]]){
      await page.evaluate(p=>window.__katana.captureProgress(p),p);if(label==='impact')await page.evaluate(()=>window.__katana.captureImpact(.3));
      await page.waitForTimeout(120);await page.screenshot({path:`${output}/${name}-${label}.png`});
    }
    if(name==='desktop'){
      await page.evaluate(()=>window.__katana.captureProgress(0));
      for(const [label,position] of [['front',[-1,.5,1.7]],['back',[-1,.5,-1.7]],['edge',[-1,1.7,.15]]]){
        await page.evaluate(position=>window.__katana.capturePose({position,target:[-1,0,.15],fov:42,roll:0}),position);
        await page.screenshot({path:`${output}/sheath-${label}.png`});
      }
      await page.evaluate(()=>window.__katana.captureProgress(1));
    }
    await page.mouse.click(width*.65,height*.65);await page.waitForFunction(()=>window.__katana.state().exploring);
    await page.screenshot({path:`${output}/${name}-explore.png`});
    for(let side=1;side<=4;side++){
      await page.locator('canvas').focus();for(let i=0;i<13;i++)await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);await page.screenshot({path:`${output}/${name}-orbit-${side}.png`});
    }
    await page.locator('.viewer-menu-toggle').click();await page.screenshot({path:`${output}/${name}-menu.png`});
    await page.locator('.viewer-help summary').click();await page.screenshot({path:`${output}/${name}-help.png`});
    await page.locator('.reset-button').click();await page.locator('canvas').focus();await page.keyboard.press('Escape');
    for(let i=0;i<5;i++)await page.keyboard.press('+');await page.screenshot({path:`${output}/${name}-close.png`});
    for(let i=0;i<18;i++)await page.keyboard.press('-');await page.screenshot({path:`${output}/${name}-wide-view.png`});
    await page.keyboard.press('Escape');
    report.push({name,width,height,errors,consoleErrors,failed,state:await page.evaluate(()=>window.__katana.state()),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),bottomGap:await page.evaluate(()=>document.documentElement.scrollHeight-document.querySelector('.story').getBoundingClientRect().height)});
    if(name==='portrait'){await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-nav="5"]').click();await page.waitForTimeout(300);await page.screenshot({path:`${output}/portrait-static.png`});}
    await page.close();
  }
  await writeFile(`${output}/visual-checks.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report.map(({name,errors,consoleErrors,failed,overflow,bottomGap})=>({name,errors,consoleErrors,failed,overflow,bottomGap}))));
}finally{await browser.close();}
