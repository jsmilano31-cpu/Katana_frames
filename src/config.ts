export type Vec3 = readonly [number, number, number];
export type ChapterId = 'presence' | 'draw' | 'edge' | 'stillness' | 'light' | 'form';
export interface CameraPose { position: Vec3; target: Vec3; fov: number; roll?: number }
export interface Chapter {
  id: ChapterId; label: string; japanese: string; eyebrow: string; title: string;
  description: string; note: string; start: number; end: number; progress: number;
  desktop: CameraPose; mobile: CameraPose; poster: { position: string; scale: number };
}
const desktop = (position: Vec3, target: Vec3, fov = 36): CameraPose => ({ position, target, fov, roll: 0 });
const mobile = (position: Vec3, target: Vec3, roll = 0.55): CameraPose => ({ position, target, fov: 43, roll });
export const chapters: readonly Chapter[] = [
  { id: 'presence', label: 'Presence', japanese: '刀', eyebrow: 'An unfolding study / 01',
    title: 'Quiet.<br>Until drawn.', description: 'Steel, suspended.<br>A story revealed by your scroll.', note: 'SCROLL TO UNFOLD',
    start: 0, end: .12, progress: 0, desktop: desktop([.1, .6, 6.8], [0, -.2, 0]), mobile: mobile([.15, .25, 9.2], [0, -.25, 0]), poster: {position:'center',scale:1} },
  { id: 'draw', label: 'The draw', japanese: '抜', eyebrow: 'The draw / 02',
    title: 'The first<br>light.', description: 'Lacquer gives way to steel.<br>The blade emerges, one reflection at a time.', note: 'SAYA / THE SCABBARD',
    start: .12, end: .38, progress: .25, desktop: desktop([.3, .7, 8.9], [-.1, -.3, 0]), mobile: mobile([.2, .4, 11.6], [-.25, -.98, 0], .7), poster: {position:'center',scale:1} },
  { id: 'edge', label: 'The edge', japanese: '刃', eyebrow: 'The edge / 03',
    title: 'A different<br>dimension.', description: 'Across the edge.<br>A line becomes a form.', note: 'NAGASA / THE BLADE',
    start: .38, end: .56, progress: .47, desktop: desktop([1.5, 1.1, 4.8], [-.55, -.15, 0], 39), mobile: mobile([.7, .5, 7.5], [-.1, -.3, 0], .4), poster: {position:'center',scale:1} },
  { id: 'stillness', label: 'Stillness', japanese: '鍔', eyebrow: 'A closer look / 04',
    title: 'Held in<br>the details.', description: 'The guard. The wrap. The curve.<br>A moment to look closer.', note: 'TSUBA / GUARD · TSUKA / GRIP',
    start: .56, end: .72, progress: .64, desktop: desktop([.7, .7, 3.3], [1.05, .02, 0], 38), mobile: mobile([.7, .2, 6.2], [.95, -.35, 0], .45), poster: {position:'center',scale:1} },
  { id: 'light', label: 'Through the mist', japanese: '霧', eyebrow: 'Through the mist / 05',
    title: 'The veil<br>parts.', description: 'Mist recedes.<br>The whole form returns.', note: 'MIST / STEEL / SILENCE',
    start: .72, end: .9, progress: .81, desktop: desktop([.5, .8, 7.8], [0, -.1, 0]), mobile: mobile([.2, .4, 9.4], [0, -.35, 0], -.6), poster: {position:'center',scale:1} },
  { id: 'form', label: 'Your perspective', japanese: '形', eyebrow: 'Your perspective / 06',
    title: 'Motion ends.<br>Form remains.', description: 'Rooted in stone. Wrapped in moonlight.<br>The grove is yours to explore.', note: 'STEEL / STONE / MOONLIGHT',
    start: .9, end: 1, progress: 1, desktop: desktop([.2, 1.7, 8.7], [-.55, .55, 0]), mobile: mobile([.35, 1.3, 9.8], [0, .6, 0], 0), poster: {position:'center',scale:1} },
];
export const cameraKeys = [
  {...chapters[0]},
  {progress:.12,desktop:desktop([.15,.6,7.6],[0,-.25,0]),mobile:mobile([.15,.3,10],[0,-.25,0],.6)},
  {...chapters[1]},
  {progress:.38,desktop:desktop([.4,.8,10.5],[.1,-.25,0]),mobile:mobile([.2,.4,15],[.1,-.65,0],.85)},
  {...chapters[2]},
  {progress:.56,desktop:desktop([.85,.8,4.2],[.7,-.1,0],38),mobile:mobile([.6,.35,7],[.7,-.3,0],.4)},
  {...chapters[3]}, {...chapters[4]},
  {progress:.94,desktop:chapters[5].desktop,mobile:chapters[5].mobile},
  {progress:.965,desktop:chapters[5].desktop,mobile:chapters[5].mobile},
  {...chapters[5]},
] as const;

export interface ChoreographyKey {
  progress: number; rotation: Vec3; sword: Vec3; scabbard: Vec3; scabbardOpacity: number;
  light: number; ink: number; reflection: number;
}
export const choreography: readonly ChoreographyKey[] = [
  {progress:0,rotation:[-.08,-.16,.3],sword:[0,0,0],scabbard:[0,0,0],scabbardOpacity:1,light:0,ink:.12,reflection:0},
  {progress:.12,rotation:[-.05,.08,.24],sword:[0,0,0],scabbard:[0,0,0],scabbardOpacity:1,light:0,ink:.12,reflection:.15},
  {progress:.38,rotation:[.04,.28,.12],sword:[-1.3,0,0],scabbard:[1.95,0,0],scabbardOpacity:1,light:0,ink:.65,reflection:.5},
  {progress:.47,rotation:[-.1,1.15,-.14],sword:[-.3,0,0],scabbard:[6,-.1,0],scabbardOpacity:0,light:0,ink:.85,reflection:.7},
  {progress:.56,rotation:[.04,3.12,-.12],sword:[0,0,0],scabbard:[5.8,-.3,0],scabbardOpacity:0,light:.02,ink:1,reflection:.82},
  {progress:.72,rotation:[.05,3.35,-.08],sword:[0,0,0],scabbard:[6,-.3,0],scabbardOpacity:0,light:.08,ink:1,reflection:1},
  {progress:.81,rotation:[-.04,3.24,.12],sword:[0,0,0],scabbard:[6,-.3,0],scabbardOpacity:0,light:1,ink:.9,reflection:1.3},
  {progress:.9,rotation:[-.08,3.15,.28],sword:[0,0,0],scabbard:[6,-.3,0],scabbardOpacity:0,light:1,ink:.8,reflection:1.5},
  {progress:.94,rotation:[0,.25,-Math.PI/2+.12],sword:[0,0,0],scabbard:[6,-.3,0],scabbardOpacity:0,light:1,ink:.65,reflection:1.6},
  {progress:1,rotation:[0,.25,-Math.PI/2+.12],sword:[0,0,0],scabbard:[6,-.3,0],scabbardOpacity:0,light:1,ink:.55,reflection:1.6},
];
export const sceneConfig = {
  breakpoint:760,desktopTravel:8,mobileTravel:6,scrubSeconds:.8,
  framing:{compactPortraitHeight:700,compactHeroDistance:1.6,compactHeroTargetX:-.4},
  model:{length:4,presentationNode:'Sketchfab_model',sourceRotation:[-Math.PI/2,0,0] as Vec3,
    sheathMeshes:/saya|scabbard|sheath|kurikata/i,
    // Source-space measurements of Saya and Habaki cross-sections, before normalization.
    sheathFrame:{center:[-1.23,-.315725,0] as Vec3,axis:[.991174,.132572,0] as Vec3},
    collarFrame:{center:[-1.23,.106985,0] as Vec3,axis:[.991172,.132589,0] as Vec3}},
  motion:{cameraArcs:[.08,.12,.12,.35,.22,.1,-.12,-.15,0,0],cameraLift:.15,textFade:.025,lightCopyAt:.79,lightCopyFade:.018,drawDip:0,drawStart:.12,drawEnd:.38},
  effects:{
    ground:[.95,-1.7,0] as Vec3,embedDepth:.045,
    alignStart:.9,alignEnd:.94,impact:.965,burstEnd:.995,dropHeight:.65,
    desktopParticles:100,mobileParticles:48,ribbons:7,ambientSpeed:.18,
    awakeningStart:.16,awakeningEnd:.38,glintEnd:.42,auraIntensity:.12,
    mistRibbons:8,mobileMistRibbons:4,mistLayers:6,mobileMistLayers:3,
    trailSpan:.035,maximumVelocity:.6,impactSeconds:1.6,stoneFragments:24,mobileStoneFragments:12,
    mistColor:'#d6f0ed',accentColor:'#8adbcf',groundColor:'#303c3b',
  },
  artwork:{layers:[
    {x:-1.6,y:-.1,z:-3.5,width:13,height:7,angle:-.08,opacity:.7,mobile:true},
    {x:2.6,y:-.8,z:-1.5,width:11.5,height:6.3,angle:.12,opacity:.7,mobile:true},
    {x:-1.6,y:-1.5,z:.5,width:10,height:5.6,angle:-.08,opacity:.32,mobile:false},
  ],sway:.6,swayStep:.25,growth:.06,paperLift:.4,paperFade:.25,mobileOpacity:.75},
  grove:{revealStart:.9,revealEnd:.965,groundY:-1.94,innerRadius:26,outerRadius:39,
    desktopStalks:180,mobileStalks:90,desktopRocks:42,mobileRocks:24,
    sway:.11,swaySpeed:.35,motes:70,mobileMotes:32,fogDensity:.022,
    moonColor:'#c9e5ef',bambooColor:'#324f50',groundColor:'#0c1a20'},
  explore:{minimumDistance:.65,maximumDistance:1.8,panRadius:.25,groundClearance:.38,
    minPolarAngle:Math.PI*.08,maxPolarAngle:Math.PI*.49,transitionSeconds:.28,
    panStep:.12,zoomStep:.88},
  swordField:{desktopCount:160,mobileCount:80,innerRadius:5.5,outerRadius:24.5,
    minimumScale:.64,maximumScale:.91,maximumLean:.22,color:'#050b0f',
    nearFadeStart:1.1,nearFadeEnd:.35,occlusionRadius:.5,minimumOcclusionOpacity:.12},
  interaction:{tapTravel:10,tapMilliseconds:450},
  lighting:{environment:.85,paperBoost:.25,reflectionRotation:.7,keyStart:[-3,4,3.5] as Vec3,keyTravel:5,rimStart:[3,-1,-3] as Vec3,rimTravel:-3},
  renderer:{desktopDpr:1.75,mobileDpr:1.25,minimumDpr:.75,exposure:1.05},
} as const;
export interface AssetManifest {
  status:'ready'|'awaiting-official-download';url:string;name:string;author:string;source:string;
  license:string;licenseUrl:string;modifications:string;postersReady:boolean;
}
