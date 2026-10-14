import {enterViewer,openViewerMenu,viewerControl} from './viewer';
import {expect,test,type Page} from '@playwright/test';
import {testGlb} from '../fixture';
import {sceneConfig} from '../../src/config';

async function openGrove(page:Page){
  await page.route('**/assets/model/manifest.json?*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({status:'ready',url:'/assets/model/katana.glb',modifications:'Test-only fixture',postersReady:false})}));
  await page.route('**/assets/model/katana.glb?*',route=>route.fulfill({contentType:'model/gltf-binary',body:testGlb()}));
  await page.goto('/?capture=1#form');await expect(page.locator('body')).toHaveAttribute('data-view','3d');
  await page.evaluate(()=>window.__katana.captureProgress!(1));await enterViewer(page);
  await page.waitForTimeout(350);
}
const state=(page:Page)=>page.evaluate(()=>window.__katana.state());
const distance=(a:readonly number[],b:readonly number[])=>Math.hypot(...a.map((n,i)=>n-b[i]));

test('grove reveal reverses and ending remains the document bottom',async({page})=>{
  await openGrove(page);await page.keyboard.press('Escape');
  for(const [progress,expected] of [[1,1],[.93,.442],[.9,0],[.81,0],[1,1]]){
    await page.evaluate(p=>window.__katana.captureProgress!(p),progress);
    expect((await state(page)).choreography!.grove.reveal).toBeCloseTo(expected,2);
  }
  const dimensions=await page.evaluate(()=>({document:document.documentElement.scrollHeight,story:document.querySelector('.story')!.getBoundingClientRect().height}));
  expect(Math.abs(dimensions.document-dimensions.story)).toBeLessThanOrEqual(1);
  expect((await state(page)).choreography!.grove.stalks).toBe(await page.evaluate(()=>innerWidth<760)?sceneConfig.grove.mobileStalks:sceneConfig.grove.desktopStalks);
});

test('keyboard and toolbar zoom and pan stay bounded without moving tip or scroll',async({page})=>{
  await openGrove(page);const before=await state(page),scroll=await page.evaluate(()=>scrollY);
  for(let i=0;i<35;i++)await page.keyboard.press('+');
  let current=await state(page);expect(distance(current.pose.position,current.pose.target)).toBeCloseTo(current.choreography!.exploration.minimumDistance,3);
  for(let i=0;i<70;i++)await page.keyboard.press('Shift+ArrowRight');
  current=await state(page);expect(distance(current.pose.target,current.choreography!.exploration.origin)).toBeLessThanOrEqual(current.choreography!.exploration.panRadius+1e-5);
  expect(current.pose.target).not.toEqual(before.pose.target);
  for(let i=0;i<40;i++)await page.keyboard.press('-');
  current=await state(page);expect(distance(current.pose.position,current.pose.target)).toBeCloseTo(current.choreography!.exploration.maximumDistance,3);
  for(let i=0;i<30;i++)await page.keyboard.press('ArrowDown');
  expect((await state(page)).pose.position[1]).toBeGreaterThan(sceneConfig.grove.groundY+sceneConfig.explore.groundClearance-.001);
  expect((await state(page)).choreography!.tip).toEqual(before.choreography!.tip);expect(await page.evaluate(()=>scrollY)).toBe(scroll);
  await viewerControl(page,'.reset-button');const reset=await state(page);reset.pose.position.forEach((n,i)=>expect(n).toBeCloseTo(before.pose.position[i],5));
  await viewerControl(page,'[data-zoom="in"]');expect(distance((await state(page)).pose.position,(await state(page)).pose.target)).toBeLessThan(distance(reset.pose.position,reset.pose.target));
  await page.keyboard.press('Escape');expect((await state(page)).choreography!.impact.count).toBe(before.choreography!.impact.count);
});

test('mouse wheel and right drag control the view and reset clears damping',async({page,isMobile})=>{
  test.skip(isMobile,'Mouse gestures use the desktop project');await openGrove(page);
  const before=await state(page);await page.mouse.move(800,500);await page.mouse.wheel(0,-450);await page.waitForTimeout(350);
  expect(distance((await state(page)).pose.position,(await state(page)).pose.target)).toBeLessThan(distance(before.pose.position,before.pose.target));
  await page.mouse.down({button:'right'});await page.mouse.move(980,540,{steps:8});await page.mouse.up({button:'right'});await page.waitForTimeout(200);
  expect((await state(page)).pose.target).not.toEqual(before.pose.target);
  await viewerControl(page,'.reset-button');const reset=await state(page);await page.waitForTimeout(500);
  (await state(page)).pose.position.forEach((n,i)=>expect(n).toBeCloseTo(reset.pose.position[i],5));
});

test('orientation change preserves orbit and paused grove still permits camera movement',async({page})=>{
  await openGrove(page);await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await page.keyboard.press('Shift+ArrowUp');
  const before=await state(page);const direction=before.pose.position.map((n,i)=>n-before.pose.target[i]);
  await page.setViewportSize({width:844,height:390});await page.waitForTimeout(500);
  const after=await state(page),nextDirection=after.pose.position.map((n,i)=>n-after.pose.target[i]);
  direction.forEach((n,i)=>expect(nextDirection[i]/distance(after.pose.position,after.pose.target)).toBeCloseTo(n/distance(before.pose.position,before.pose.target),3));
  expect(after.choreography!.tip).toEqual(before.choreography!.tip);expect(after.choreography!.impact.count).toBe(before.choreography!.impact.count);
  // Capture starts with effects paused; enable, then explicitly pause again.
  await viewerControl(page,'.explore-ui .effects-button');await page.waitForTimeout(150);await viewerControl(page,'.explore-ui .effects-button');
  const clock=(await state(page)).choreography!.ambientTime;await page.waitForTimeout(250);
  expect((await state(page)).choreography!.ambientTime).toBe(clock);
  await viewerControl(page,'[data-rotate="right"]');expect((await state(page)).pose.position).not.toEqual(after.pose.position);
});

test('two-finger pinch and pan move the mobile camera',async({page,context,isMobile})=>{
  test.skip(!isMobile,'Touch gestures use the portrait project');await openGrove(page);
  const session=await context.newCDPSession(page),before=await state(page);
  const touch=(x:number,y:number,id:number)=>({x,y,id,radiusX:5,radiusY:5});
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(140,520,1),touch(240,520,2)]});
  for(let i=1;i<=8;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(140-i*5,520+i*3,1),touch(240+i*5,520+i*3,2)]});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(350);
  const after=await state(page);expect(distance(after.pose.position,after.pose.target)).toBeLessThan(distance(before.pose.position,before.pose.target));
  expect(after.pose.target).not.toEqual(before.pose.target);expect(after.choreography!.tip).toEqual(before.choreography!.tip);
  await openViewerMenu(page);await page.locator('.exit-button').tap();await expect(page.locator('.explore-ui')).toBeHidden();
});
