import {expect,test,type Page} from '@playwright/test';
import {testGlb} from '../fixture';
import {enterViewer,openViewerMenu} from './viewer';
async function ready(page:Page){
  await page.route('**/assets/model/manifest.json?*',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({status:'ready',url:'/assets/model/katana.glb',modifications:'Test fixture',postersReady:false})}));
  await page.route('**/assets/model/katana.glb?*',route=>route.fulfill({contentType:'model/gltf-binary',body:testGlb()}));
  await page.goto('/?capture=1#form');await expect(page.locator('.scene-entry-hint')).toBeVisible();
}
test('scene entry needs a completed tap and ignores drag, scroll, selection, and controls',async({page})=>{
  await ready(page);const size=page.viewportSize()!,x=size.width*.65,y=size.height*.65;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+35,y+35);await page.mouse.up();
  expect(await page.evaluate(()=>window.__katana.state().exploring)).toBe(false);
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.wheel(0,20);await page.mouse.up();
  expect(await page.evaluate(()=>window.__katana.state().exploring)).toBe(false);
  await page.evaluate(()=>{const range=document.createRange();range.selectNodeContents(document.querySelector('#title-form')!);getSelection()!.removeAllRanges();getSelection()!.addRange(range);});
  expect(await page.evaluate(()=>getSelection()!.isCollapsed)).toBe(false);
  await page.mouse.click(x,y);expect(await page.evaluate(()=>window.__katana.state().exploring)).toBe(false);
  await page.evaluate(()=>getSelection()!.removeAllRanges());
  await page.locator('.about-button').click();await expect(page.locator('.about-dialog')).toBeVisible();
  expect(await page.evaluate(()=>window.__katana.state().exploring)).toBe(false);await page.keyboard.press('Escape');
  await enterViewer(page);await expect(page.locator('.viewer-menu')).toBeHidden();await expect(page.locator('.view-status')).toBeHidden();
  expect(await page.locator('.explore-panel').count()).toBe(0);
});
test('keyboard entry, menu focus, outside close, Exit and Replay work without re-entry',async({page})=>{
  await ready(page);await page.locator('.explore-button').focus();await expect(page.locator('.explore-button')).toBeVisible();await page.keyboard.press('Enter');
  await expect(page.locator('canvas')).toBeFocused();await page.keyboard.press('Shift+Tab');await expect(page.locator('.viewer-menu-toggle')).toBeFocused();
  await page.keyboard.press('Enter');await expect(page.locator('.viewer-menu')).toBeVisible();
  await page.keyboard.press('Escape');await expect(page.locator('.viewer-menu')).toBeHidden();expect(await page.evaluate(()=>window.__katana.state().exploring)).toBe(true);
  await openViewerMenu(page);await page.mouse.click(50,200);await expect(page.locator('.viewer-menu')).toBeHidden();
  await openViewerMenu(page);await page.locator('.exit-button').click();await expect(page.locator('.explore-ui')).toBeHidden();
  expect(await page.evaluate(()=>window.__katana.state().exploring)).toBe(false);await expect(page.locator('.explore-button')).toBeFocused();
  await enterViewer(page);await openViewerMenu(page);await page.locator('.viewer-replay').click();
  await expect.poll(()=>page.evaluate(()=>window.__katana.state().progress)).toBeLessThan(.01);await expect(page.locator('.explore-ui')).toBeHidden();
});
test('touch entry rejects multitouch and accepts a single tap',async({page,context,isMobile})=>{
  test.skip(!isMobile,'Touch input belongs to portrait');await ready(page);
  const session=await context.newCDPSession(page);
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:130,y:500,id:1},{x:230,y:500,id:2}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});expect(await page.evaluate(()=>window.__katana.state().exploring)).toBe(false);
  await page.touchscreen.tap(260,520);await expect(page.locator('.explore-ui')).toBeVisible();await expect(page.locator('.viewer-menu')).toBeHidden();
});
test('field reveal and responsive density reverse while camera ranges remain unchanged',async({page})=>{
  await ready(page);let state=await page.evaluate(()=>window.__katana.state());expect(state.choreography!.field!.count).toBe(await page.evaluate(()=>innerWidth<760)?80:160);
  expect(state.choreography!.field!.trianglesPerSword).toBeLessThan(500);
  await page.evaluate(()=>window.__katana.captureProgress!(.81));expect((await page.evaluate(()=>window.__katana.state())).choreography!.field!.reveal).toBe(0);
  await page.evaluate(()=>window.__katana.captureProgress!(1));await enterViewer(page);state=await page.evaluate(()=>window.__katana.state());
  const starting=Math.hypot(...state.pose.position.map((n,i)=>n-state.pose.target[i]));
  expect(state.choreography!.exploration.minimumDistance).toBeCloseTo(starting*.65,5);expect(state.choreography!.exploration.maximumDistance).toBeCloseTo(starting*1.8,5);
  const tip=state.choreography!.tip;for(let i=0;i<55;i++)await page.keyboard.press('ArrowRight');expect((await page.evaluate(()=>window.__katana.state())).choreography!.tip).toEqual(tip);
});
