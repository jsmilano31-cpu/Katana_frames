import { chapters, choreography, cameraKeys, sceneConfig, type CameraPose, type Vec3 } from './config';
export const clamp01 = (v:number):number => Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
export const ease = (t:number):number => { const v=clamp01(t);return v*v*(3-2*v); };
export function cubicBezier(a:Vec3,b:Vec3,c:Vec3,d:Vec3,t:number):Vec3 {
  const v=clamp01(t),u=1-v;
  return [0,1,2].map(i=>u**3*a[i]+3*u*u*v*b[i]+3*u*v*v*c[i]+v**3*d[i]) as unknown as Vec3;
}
const mix=(a:Vec3,b:Vec3,t:number):Vec3=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
export function sampleCamera(progress:number,mobile:boolean,viewportHeight=Infinity):CameraPose {
  const p=clamp01(progress);
  const index=Math.max(0,Math.min(cameraKeys.length-2,cameraKeys.findIndex((_,i)=>i<cameraKeys.length-1&&p<=cameraKeys[i+1].progress)));
  const a=cameraKeys[index],b=cameraKeys[index+1];
  const from=a[mobile?'mobile':'desktop'],to=b[mobile?'mobile':'desktop'];
  const t=ease((p-a.progress)/(b.progress-a.progress));
  const c1=[...mix(from.position,to.position,.32)] as [number,number,number];
  const c2=[...mix(from.position,to.position,.68)] as [number,number,number];
  const arc=sceneConfig.motion.cameraArcs[index]??0;
  const lift=a.progress>=.94?0:sceneConfig.motion.cameraLift;
  c1[0]+=arc;c2[0]+=arc;c1[1]+=lift;c2[1]+=lift;
  const position=[...cubicBezier(from.position,c1,c2,to.position,t)] as [number,number,number];
  const target=[...cubicBezier(from.target,mix(from.target,to.target,.33),mix(from.target,to.target,.67),to.target,t)] as [number,number,number];
  if(mobile&&viewportHeight<sceneConfig.framing.compactPortraitHeight){
    const presence=1-ease(p/sceneConfig.motion.drawStart);
    position[2]+=sceneConfig.framing.compactHeroDistance*presence;
    target[0]+=sceneConfig.framing.compactHeroTargetX*presence;
  }
  return {position,target,fov:from.fov+(to.fov-from.fov)*t,roll:(from.roll??0)+((to.roll??0)-(from.roll??0))*t};
}
/** Pure scroll sampling keeps gusts, contact and reverse playback deterministic. */
export function sampleEffects(progress:number) {
  const p=clamp01(progress),config=sceneConfig.effects;
  const drawPhase=clamp01((p-sceneConfig.motion.drawStart)/(sceneConfig.motion.drawEnd-sceneConfig.motion.drawStart));
  const alignment=ease((p-config.alignStart)/(config.alignEnd-config.alignStart));
  const descent=clamp01((p-config.alignEnd)/(config.impact-config.alignEnd));
  return {drawPhase,drawStrength:Math.sin(Math.PI*drawPhase)*(.35+.65*drawPhase),alignment,
    lift:config.dropHeight*(1-descent**2),groundOpacity:alignment,
    contact:p>=config.impact};
}
export function sampleAwakening(progress:number,exposedFraction=1){
  const p=clamp01(progress),config=sceneConfig.effects;
  const phase=ease((p-config.awakeningStart)/(config.awakeningEnd-config.awakeningStart));
  const active=p>config.awakeningStart&&p<config.awakeningEnd;
  return {phase,pulsePosition:Math.min(phase,Math.max(0,exposedFraction-.012)),
    pulseStrength:active?Math.sin(Math.PI*phase)**.4:0,
    aura:ease((p-config.awakeningStart)/.1)*config.auraIntensity,
    glint:p>=config.awakeningEnd?Math.sin(Math.PI*clamp01((p-config.awakeningEnd)/(config.glintEnd-config.awakeningEnd))):0};
}
export function activeChapter(progress:number):number {
  const p=clamp01(progress);return chapters.reduce((index,c,i)=>p>=c.start?i:index,0);
}
export function sampleChoreography(progress:number) {
  const p=clamp01(progress);
  const index=Math.max(0,Math.min(choreography.length-2,choreography.findIndex((_,i)=>i<choreography.length-1&&p<=choreography[i+1].progress)));
  const a=choreography[index],b=choreography[index+1],t=ease((p-a.progress)/(b.progress-a.progress));
  const scalar=(key:'scabbardOpacity'|'light'|'ink'|'reflection')=>a[key]+(b[key]-a[key])*t;
  return {fromRotation:a.rotation,toRotation:b.rotation,rotationMix:t,sword:(()=>{const v=[...mix(a.sword,b.sword,t)] as [number,number,number];v[1]-=sceneConfig.motion.drawDip*Math.sin(Math.PI*clamp01((p-sceneConfig.motion.drawStart)/(sceneConfig.motion.drawEnd-sceneConfig.motion.drawStart)));return v;})(),scabbard:mix(a.scabbard,b.scabbard,t),scabbardOpacity:scalar('scabbardOpacity'),light:scalar('light'),ink:scalar('ink'),reflection:scalar('reflection')};
}
export function chapterOpacity(progress:number,index:number):number {
  const c=chapters[index],p=clamp01(progress);
  if(p<c.start||p>c.end)return 0;
  const lightPause=index===4?ease((p-sceneConfig.motion.lightCopyAt)/sceneConfig.motion.lightCopyFade):1;
  return lightPause*(index===0?1:ease((p-c.start)/sceneConfig.motion.textFade))*(index===chapters.length-1?1:ease((c.end-p)/sceneConfig.motion.textFade));
}
