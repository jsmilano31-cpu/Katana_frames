import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const base=process.env.KATANA_PREVIEW_URL??'http://127.0.0.1:5173';
const out='docs/dragon-refinement',browser=await chromium.launch({channel:'msedge',headless:true}),report=[];
await mkdir(out,{recursive:true});
try{
  for(const [name,width,height] of [['desktop',1440,900],['wide',1809,685],['portrait',390,844],['landscape',844,390],['compact',320,568]]){
    console.log(`Reviewing ${name}`);
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1}),errors=[],failed=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
    await page.goto(`${base}/?capture=1`);await page.waitForFunction(()=>window.__katana?.state().view==='3d',undefined,{timeout:60000});
    const stages=[];
    for(const [label,p] of [['seated',.12],['first-steel',.16],['emerging',.2],['partial',.25],['eye-opening',.28],['awakened',.34],['comparison',.36],['hold',.4],['dissolve',.46],['stillness',.56],['ending',1]]){
      await page.evaluate(p=>window.__katana.captureProgress(p),p);
      await page.screenshot({path:`${out}/${name}-${label}.png`});
      stages.push({label,progress:p,...await page.evaluate(()=>({dragon:window.__katana.atmosphere().dragon,blade:window.__katana.state().choreography.effects}))});
    }
    await page.evaluate(()=>window.__katana.captureProgress(.34));
    const before=await page.evaluate(()=>window.__katana.atmosphere().dragon);
    await page.waitForTimeout(150);const stopped=await page.evaluate(()=>window.__katana.atmosphere().dragon);
    for(const p of [.28,.2,.12,.34,.56,.34])await page.evaluate(p=>window.__katana.captureProgress(p),p);
    const reversed=await page.evaluate(()=>window.__katana.atmosphere().dragon);
    report.push({name,width,height,errors,failed,stages,stoppedStable:JSON.stringify(before)===JSON.stringify(stopped),reversedStable:JSON.stringify(before)===JSON.stringify(reversed),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
    await page.close();
  }
  await writeFile(`${out}/visual-checks.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify(report.map(({name,errors,failed,stoppedStable,reversedStable,overflow})=>({name,errors,failed,stoppedStable,reversedStable,overflow}))));
}finally{await browser.close();}
