import {expect,type Page} from '@playwright/test';
export async function enterViewer(page:Page){
  await expect(page.locator('.scene-entry-hint')).toBeVisible();const size=page.viewportSize()!;
  await page.mouse.click(size.width*.65,size.height*.65);await expect(page.locator('.explore-ui')).toBeVisible();
}
export async function openViewerMenu(page:Page){
  if(await page.locator('.viewer-menu').isHidden())await page.locator('.viewer-menu-toggle').click();
}
export async function viewerControl(page:Page,selector:string){
  await openViewerMenu(page);
  if(selector.includes('data-rotate')||selector.includes('data-zoom')){
    if(!await page.locator('.viewer-help').evaluate(element=>(element as HTMLDetailsElement).open))await page.locator('.viewer-help summary').click();
  }
  await page.locator(selector).click();
}
