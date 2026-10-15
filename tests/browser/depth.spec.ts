import {expect,test} from '@playwright/test';
test('real swords remain visible against ground and rocks from high and reverse viewpoints',async({page})=>{
  await page.goto('/?capture=1#form');await expect(page.locator('body')).toHaveAttribute('data-view','3d');
  await page.evaluate(()=>window.__katana.captureProgress!(1));
  for(const position of [[.95,10,9],[.95,10,-9],[10,8,0],[-9,8,0],[.95,3,16],[.95,3,-16]]){
    await page.evaluate(position=>window.__katana.capturePose!({position:position as[number,number,number],target:[.95,.2,0],fov:43,roll:0}),position);
    const mask=await page.evaluate(()=>window.__katana.captureVisibility!());
    expect(mask.pixels.blade).toBeGreaterThan(0);expect(mask.pixels.handle).toBeGreaterThan(0);
    expect(mask.pixels.field).toBeGreaterThan(50);
  }
  const field=await page.evaluate(()=>window.__katana.state().choreography!.field!);
  expect(field.depthWrite).toBe(true);expect(field.alphaHash).toBe(true);
  await page.evaluate(()=>window.__katana.captureProgress!(.93));
  expect((await page.evaluate(()=>window.__katana.captureVisibility!())).pixels.field).toBeGreaterThan(0);
});
