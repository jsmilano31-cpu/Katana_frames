import {
  ACESFilmicToneMapping, Box3, Color, DirectionalLight, Group, HemisphereLight,
  LoadingManager, Material, Mesh, PerspectiveCamera, PMREMGenerator, Scene,
  Quaternion, Spherical, Texture, Vector3, WebGLRenderer, type WebGLRenderTarget,
  Euler, Matrix4, Plane, MeshBasicMaterial, ShaderMaterial, FogExp2,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { sceneConfig, type CameraPose } from './config';
import { clamp01, ease, sampleAwakening, sampleChoreography, sampleEffects } from './motion';
import { createInk } from './ink';
import { WindEffects } from './effects';
import { awakeningMaterial } from './awakening';
import { LandingImpact } from './impact';
import { MoonlitGrove } from './grove';

export interface SceneStats { fps: number; dpr: number; drawCalls: number; triangles: number }

export class KatanaScene {
  readonly renderer: WebGLRenderer;
  readonly camera = new PerspectiveCamera(36, 1, 0.025, 100);
  readonly scene = new Scene();
  controls: OrbitControls;
  readonly model = new Group();
  readonly sword = new Group();
  readonly scabbard = new Group();
  private ink = new Group();
  private sheathMaterials: Material[] = [];
  private bladeMaterials: Material[] = [];
  private mouthX = -1;
  private mouth = new Vector3();
  private bladeTip = new Vector3(2,0,0);
  private bladeGuide=[new Vector3(-1,0,0),new Vector3(2,0,0)];
  private bladeMinX=-1;
  private aura:ShaderMaterial|null=null;
  private exposed=0;
  private impact=new LandingImpact();
  private captureMode=new URLSearchParams(location.search).has('capture');
  private captureImpactPhase:number|null=null;
  private onImpact?:()=>void;
  private movement=0;
  private direction=1;
  private lastStoryTime=0;
  private frameClock=0;
  private authoredCamera=new Vector3();
  private effects = new WindEffects();
  private grove = new MoonlitGrove();
  private groveFog = new FogExp2('#14262f',0);
  private exploreOrigin = new Vector3();
  private exploreUp = new Vector3(0,1,0);
  private exploreStarted = 0;
  private ambientPaused = new URLSearchParams(location.search).has('capture');
  private ambientTime = 0;
  private ambientFrame = 0;
  private bladePlane = new Plane();
  private storyProgress = 0;
  private key = new DirectionalLight('#e3f3f0', 2.8);
  private rim = new DirectionalLight('#87cbc9', 2);
  private qa = new Quaternion();
  private qb = new Quaternion();
  private rotation = new Euler();
  private environment: WebGLRenderTarget;
  private draco = new DRACOLoader();
  private basis = new KTX2Loader();
  private manager = new LoadingManager();
  private dirty = true;
  private disposed = false;
  private exploring = false;
  private resetPose: CameraPose | null = null;
  private pixelRatio: number;
  private frameCount = 0;
  private frameSeconds = 0;
  private slowWindows = 0;
  private lastFrame = 0;
  private onFrame?: (stats: SceneStats) => void;

  constructor(canvas: HTMLCanvasElement, private onContextLost: () => void) {
    this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: new URLSearchParams(location.search).has('capture') });
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = sceneConfig.renderer.exposure;
    this.renderer.setClearColor(new Color('#171713'), 0);
    this.renderer.localClippingEnabled = true;
    this.pixelRatio = Math.min(devicePixelRatio, innerWidth < sceneConfig.breakpoint ? sceneConfig.renderer.mobileDpr : sceneConfig.renderer.desktopDpr);
    this.renderer.setPixelRatio(this.pixelRatio);
    const room = new RoomEnvironment();
    const pmrem = new PMREMGenerator(this.renderer);
    this.environment = pmrem.fromScene(room, 0.025);
    this.scene.environment = this.environment.texture;
    this.scene.environmentIntensity = 0.75;
    room.dispose();
    pmrem.dispose();
    this.scene.add(new HemisphereLight('#d9eeeb', '#192b32', 0.8));
    const key = this.key;
    key.position.set(-2, 4, 5);
    const rim = this.rim;
    rim.position.set(2, -1, -3);
    const warm = new DirectionalLight('#89c5ca', 0.45);
    warm.position.set(-4, 1, -2);
    this.scene.add(key, rim, warm, this.model, this.effects.root,this.grove.root);
    this.scene.fog=this.groveFog;
    this.model.add(this.sword, this.scabbard);
    this.draco.setDecoderPath('/assets/decoders/draco/');
    this.basis.setTranscoderPath('/assets/decoders/basis/').detectSupport(this.renderer);
    this.controls = this.createControls();
    canvas.addEventListener('webglcontextlost', this.contextLost);
    this.resize();
    this.renderer.setAnimationLoop(this.render);
  }

  async load(url: string, onProgress: (percent: number | null) => void): Promise<void> {
    const loader = new GLTFLoader(this.manager).setDRACOLoader(this.draco).setKTX2Loader(this.basis).setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(url, event => onProgress(event.lengthComputable ? Math.round(event.loaded / event.total * 100) : null));
    const source = gltf.scene;
    const presentation = source.getObjectByName(sceneConfig.model.presentationNode);
    if (presentation) {
      presentation.rotation.set(0, 0, 0);
      source.rotation.set(...sceneConfig.model.sourceRotation);
    }
    source.updateMatrixWorld(true);
    const meshes: Mesh[] = [];
    source.traverse(object => { if (object instanceof Mesh) meshes.push(object); });
    const bounds = new Box3();
    meshes.filter(m => !sceneConfig.model.sheathMeshes.test(m.name)).forEach(m => bounds.expandByObject(m, true));
    const length = bounds.getSize(new Vector3()).x;
    if (!Number.isFinite(length) || length <= 0) throw new Error('The katana has invalid geometry bounds.');
    const center = bounds.getCenter(new Vector3());
    const scale = sceneConfig.model.length / length;
    const normalize = new Matrix4().makeScale(scale, scale, scale).multiply(new Matrix4().makeTranslation(-center.x,-center.y,-center.z));
    const mouth = new Vector3(...sceneConfig.model.sheathMouth);
    const fitted = new Vector3(...sceneConfig.model.sheathedMouth);
    const align = new Matrix4().makeTranslation(fitted.x,fitted.y,fitted.z)
      .multiply(new Matrix4().makeRotationZ(sceneConfig.model.sheathAngle))
      .multiply(new Matrix4().makeTranslation(-mouth.x,-mouth.y,-mouth.z));
    this.mouth.copy(fitted).sub(center).multiplyScalar(scale);
    this.mouthX = this.mouth.x;
    for (const object of meshes) {
      const sheath = sceneConfig.model.sheathMeshes.test(object.name);
      const geometry = object.geometry.clone();
      geometry.applyMatrix4(object.matrixWorld);
      if (sheath) geometry.applyMatrix4(align);
      geometry.applyMatrix4(normalize);
      // World transforms are baked into runtime geometry; the licensed GLB remains intact.
      object.geometry.dispose(); object.geometry = geometry;
      object.removeFromParent(); object.position.set(0,0,0); object.quaternion.identity(); object.scale.set(1,1,1);
      const original = Array.isArray(object.material) ? object.material : [object.material];
      const blade = /nagasa|blade/i.test(object.name);
      if(blade){
        const positions=geometry.getAttribute('position');
        this.bladeTip.set(-Infinity,0,0);
        for(let i=0;i<positions.count;i++)if(positions.getX(i)>this.bladeTip.x)this.bladeTip.fromBufferAttribute(positions,i);
        geometry.computeBoundingBox();this.bladeMinX=geometry.boundingBox!.min.x;
        this.bladeGuide=[];
        for(let step=0;step<=32;step++){
          const x=this.bladeMinX+(this.bladeTip.x-this.bladeMinX)*step/32;
          let minY=Infinity,maxY=-Infinity;
          for(let i=0;i<positions.count;i++)if(Math.abs(positions.getX(i)-x)<(this.bladeTip.x-this.bladeMinX)/40){
            minY=Math.min(minY,positions.getY(i));maxY=Math.max(maxY,positions.getY(i));
          }
          this.bladeGuide.push(new Vector3(x,Number.isFinite(minY)?(minY+maxY)/2:this.bladeTip.y,0));
        }
        this.bladeGuide[32].copy(this.bladeTip);
        const startY=this.bladeGuide[0].y,midY=this.bladeGuide[16].y,endY=this.bladeTip.y;
        const controlY=2*midY-(startY+endY)/2;
        this.bladeGuide.forEach((point,index)=>{
          const t=index/32;point.y=(1-t)**2*startY+2*(1-t)*t*controlY+t*t*endY;
        });
        this.aura=awakeningMaterial(this.bladePlane,this.bladeMinX,this.bladeTip.x);
        const overlay=new Mesh(geometry.clone(),this.aura);overlay.name='Blade awakening layer';
        this.sword.add(overlay);
      }
      const copies = original.map(material => {
        const copy = material.clone();
        if (sheath) { copy.transparent = true; this.sheathMaterials.push(copy); }
        if (blade) { copy.clippingPlanes = [this.bladePlane]; this.bladeMaterials.push(copy); }
        return copy;
      });
      object.material = Array.isArray(object.material) ? copies : copies[0];
      (sheath ? this.scabbard : this.sword).add(object);
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        for (const value of Object.values(material)) {
          if (value instanceof Texture) value.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
        }
      }
    }
    this.ink = await createInk(); this.scene.add(this.ink);
    this.setStory(this.storyProgress);
    await this.renderer.compileAsync(this.scene, this.camera);
    // Warm the finale's instanced shaders during loading, rather than at impact.
    const groveVisible=this.grove.root.visible;
    this.grove.root.visible=true;
    await this.renderer.compileAsync(this.scene,this.camera);
    // Upload the grove buffers and local textures while the loading poster is visible.
    this.renderer.render(this.scene,this.camera);
    this.grove.root.visible=groveVisible;
    this.renderer.render(this.scene,this.camera);
    this.dirty = true;
  }

  setStory(progress: number): void {
    if (this.disposed || this.exploring) return;
    const now=performance.now(),difference=progress-this.storyProgress;
    if(Math.abs(difference)>1e-8){
      this.direction=Math.sign(difference);
      this.movement=this.captureMode?.55:Math.min(1,Math.abs(difference)/Math.max(.016,(now-this.lastStoryTime)/1000)/sceneConfig.effects.maximumVelocity);
    }
    this.lastStoryTime=now;
    this.storyProgress = progress;
    const previousImpact=this.impact.mode;
    if(this.captureMode)this.impact.restore(progress);else this.impact.observe(progress,this.ambientPaused);
    const state = sampleChoreography(progress);
    this.grove.setProgress(progress);
    this.groveFog.density=sceneConfig.grove.fogDensity*this.grove.diagnostics().reveal;
    this.qa.setFromEuler(this.rotation.set(...state.fromRotation));
    this.qb.setFromEuler(this.rotation.set(...state.toRotation));
    this.model.quaternion.copy(this.qa).slerp(this.qb, state.rotationMix);
    this.sword.position.set(...state.sword); this.scabbard.position.set(...state.scabbard);
    this.model.position.copy(this.modelPosition(progress,this.model.quaternion,this.sword.position));
    this.scabbard.visible = state.scabbardOpacity > .01;
    this.sheathMaterials.forEach(material => { material.opacity = state.scabbardOpacity; });
    this.model.updateMatrixWorld(true);
    // Expose only the portion past the saya mouth while the curved blade is drawn.
    this.bladePlane.set(new Vector3(-1,0,0),this.mouthX+state.scabbard[0]).applyMatrix4(this.model.matrixWorld);
    this.exposed=clamp01((this.mouthX+state.scabbard[0]-state.sword[0]-this.bladeMinX)/(this.bladeTip.x-this.bladeMinX));
    const awakening=sampleAwakening(progress,this.exposed);
    if(this.aura){
      this.aura.uniforms.uPulse.value=awakening.pulsePosition;
      this.aura.uniforms.uStrength.value=awakening.pulseStrength;
      this.aura.uniforms.uAura.value=awakening.aura;
    }
    const lighting=sceneConfig.lighting;
    this.key.position.set(...lighting.keyStart);this.key.position.x+=state.reflection*lighting.keyTravel;
    this.rim.position.set(...lighting.rimStart);this.rim.position.x+=state.reflection*lighting.rimTravel;
    this.scene.environmentRotation.y = state.reflection * lighting.reflectionRotation;
    this.scene.environmentIntensity = lighting.environment + state.light * lighting.paperBoost;
    this.renderer.toneMappingExposure = sceneConfig.renderer.exposure + state.light * .06;
    this.ink.children.forEach((object, index) => {
      const plane = object as Mesh;
      const material = plane.material as MeshBasicMaterial;
      const artwork=sceneConfig.artwork,layer=artwork.layers[index];
      material.opacity = state.ink * layer.opacity * (1-state.light*artwork.paperFade) * (innerWidth<sceneConfig.breakpoint?artwork.mobileOpacity:1) * (1-this.grove.diagnostics().reveal);
      material.color.set('#86afaf').lerp(new Color('#91b6bd'),state.light);
      plane.position.x = layer.x + Math.sin(progress*Math.PI)*(artwork.sway+index*artwork.swayStep);
      plane.position.y = layer.y + state.light*artwork.paperLift;
      plane.userData.baseY=plane.position.y;
      plane.userData.baseX=plane.position.x;
      plane.position.y+=Math.sin(this.ambientTime*sceneConfig.effects.ambientSpeed+index)*.025;
      plane.position.x+=Math.sin(this.ambientTime*.09+index)*.035;
      plane.scale.x = layer.width*(1+state.ink*artwork.growth);
      plane.visible = innerWidth>=sceneConfig.breakpoint || layer.mobile;
    });
    this.effects.setStory(progress,this.scabbard.localToWorld(this.mouth.clone()),this.model.quaternion,
      {bladeMatrix:this.sword.matrixWorld.clone(),guide:this.bladeGuide,trail:this.sampleTrail(progress),exposed:this.exposed});
    this.updateEffects();
    if(previousImpact!==this.impact.mode)this.onImpact?.();
    this.dirty = true;
  }

  storyState() { return { progress:this.storyProgress,rotation:this.model.quaternion.toArray(),sword:this.sword.position.toArray(),scabbard:this.scabbard.position.toArray(),scabbardVisible:this.scabbard.visible,tip:this.sword.localToWorld(this.bladeTip.clone()).toArray(),effects:{...this.effects.diagnostics(),awakening:sampleAwakening(this.storyProgress,this.exposed),exposed:this.exposed},impact:this.impact.snapshot(),ambientPaused:this.ambientPaused,ambientTime:this.ambientTime,grove:this.grove.diagnostics(),exploration:{origin:this.exploreOrigin.toArray(),minimumDistance:this.controls.minDistance,maximumDistance:this.controls.maxDistance,panRadius:sceneConfig.model.length*sceneConfig.explore.panRadius} }; }

  get impactSettled(){return this.impact.mode!=='playing';}
  setImpactCallback(callback:()=>void){this.onImpact=callback;}
  prepareEntry(settled:boolean){this.impact.prepareEntry(settled);}
  setCaptureImpact(phase:number|null){
    if(!this.captureMode)return;
    this.captureImpactPhase=phase===null?null:clamp01(phase);this.updateEffects();this.dirty=true;
  }
  setAmbientPaused(paused:boolean):void {
    this.ambientPaused=paused;this.ambientFrame=0;this.frameClock=0;
    if(paused)this.impact.settle();this.updateEffects();this.onImpact?.();this.dirty=true;
  }

  private modelPosition(progress:number,rotation:Quaternion,sword:Vector3){
    const state=sampleEffects(progress),presence=1-ease(progress/.12),portrait=innerWidth<sceneConfig.breakpoint;
    const position=new Vector3((portrait?.15:0)*presence,(portrait?-.22:.28)*presence,0);
    if(state.alignment>0){
      const contact=new Vector3(...sceneConfig.effects.ground);contact.y+=state.lift-sceneConfig.effects.embedDepth;
      position.copy(contact.sub(this.bladeTip.clone().add(sword).applyQuaternion(rotation)).multiplyScalar(state.alignment));
    }
    return position;
  }

  private sampleTrail(progress:number){
    const points:Vector3[]=[];
    for(let i=0;i<7;i++){
      const p=clamp01(progress-this.direction*(.008+sceneConfig.effects.trailSpan*this.movement)*i/6);
      const state=sampleChoreography(p);
      const q=new Quaternion().setFromEuler(new Euler(...state.fromRotation)).slerp(new Quaternion().setFromEuler(new Euler(...state.toRotation)),state.rotationMix);
      const sword=new Vector3(...state.sword);
      const exposed=clamp01((this.mouthX+state.scabbard[0]-state.sword[0]-this.bladeMinX)/(this.bladeTip.x-this.bladeMinX));
      const at=exposed*(this.bladeGuide.length-1),index=Math.min(this.bladeGuide.length-2,Math.floor(at));
      const tip=new Vector3().lerpVectors(this.bladeGuide[index],this.bladeGuide[index+1],at-index);
      points.push(tip.add(sword).applyQuaternion(q).add(this.modelPosition(p,q,sword)));
    }
    return points;
  }

  private updateEffects(){this.effects.update(this.ambientTime,this.captureImpactPhase??this.impact.phase,this.movement);}

  setPose(pose: CameraPose): void {
    if (this.exploring || this.disposed) return;
    this.camera.position.set(...pose.position);
    this.authoredCamera.copy(this.camera.position);
    this.camera.up.set(Math.sin(pose.roll ?? 0), Math.cos(pose.roll ?? 0), 0);
    this.camera.fov = pose.fov;
    this.camera.updateProjectionMatrix();
    this.controls.target.set(...pose.target);
    this.camera.lookAt(this.controls.target);
    this.dirty = true;
  }

  resize(): void {
    if (this.disposed) return;
    this.renderer.setSize(innerWidth, innerHeight, false);
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
    this.grove.setProgress(this.storyProgress);
    // Never exceed the portrait performance cap after rotating/resizing.
    const cap = Math.min(devicePixelRatio, innerWidth < sceneConfig.breakpoint ? sceneConfig.renderer.mobileDpr : sceneConfig.renderer.desktopDpr);
    if (this.pixelRatio > cap) this.setPixelRatio(cap);
  }

  beginExplore(pose: CameraPose): void {
    this.impact.settle();
    this.setPose(pose);
    this.exploreUp.copy(this.camera.up);
    this.camera.up.set(0,1,0);
    this.exploreStarted=performance.now();
    // Recreate controls against world-up, including after a portrait resize.
    this.controls.removeEventListener('change', this.markDirty);
    this.controls.dispose();
    this.controls = this.createControls();
    this.controls.target.set(...pose.target);
    this.configureExplore(pose);
    this.exploring = true;
    this.controls.enabled = true;
    this.controls.enableDamping = false;
    this.controls.update();
    this.controls.enableDamping = true;
    this.renderer.domElement.style.touchAction = 'none';
    this.dirty = true;
  }

  resetExplore(): void {
    if (!this.resetPose) return;
    this.controls.enableDamping = false;
    this.controls.update();
    this.camera.position.set(...this.resetPose.position);
    this.camera.up.set(0,1,0);
    this.exploreStarted=0;
    this.camera.fov = this.resetPose.fov;
    this.camera.updateProjectionMatrix();
    this.controls.target.set(...this.resetPose.target);
    // Flush damping momentum so reset is stable even during an active drag.
    this.controls.update();
    this.controls.enableDamping = true;
    this.dirty = true;
  }

  rotate(horizontal: number, vertical: number): void {
    if (!this.exploring) return;
    const alignment = new Quaternion().setFromUnitVectors(this.camera.up, new Vector3(0, 1, 0));
    const spherical = new Spherical().setFromVector3(this.camera.position.clone().sub(this.controls.target).applyQuaternion(alignment));
    spherical.theta += horizontal;
    spherical.phi = Math.max(this.controls.minPolarAngle, Math.min(this.controls.maxPolarAngle, spherical.phi + vertical));
    this.camera.position.copy(this.controls.target).add(new Vector3().setFromSpherical(spherical).applyQuaternion(alignment.invert()));
    this.controls.update();
    this.dirty = true;
  }

  pan(horizontal:number,vertical:number):void {
    if(!this.exploring)return;
    this.camera.updateMatrixWorld();
    const offset=new Vector3().setFromMatrixColumn(this.camera.matrixWorld,0).multiplyScalar(horizontal)
      .add(new Vector3().setFromMatrixColumn(this.camera.matrixWorld,1).multiplyScalar(vertical));
    this.camera.position.add(offset);this.controls.target.add(offset);
    this.constrainExplore();this.controls.update();this.dirty=true;
  }

  zoom(factor:number):void {
    if(!this.exploring)return;
    const offset=this.camera.position.clone().sub(this.controls.target);
    offset.setLength(Math.max(this.controls.minDistance,Math.min(this.controls.maxDistance,offset.length()*factor)));
    this.camera.position.copy(this.controls.target).add(offset);
    this.constrainExplore();this.controls.update();this.dirty=true;
  }

  reframeExplore(pose:CameraPose):void {
    if(!this.exploring)return;
    const delta=this.controls.target.clone().sub(this.exploreOrigin);
    this.configureExplore(pose);
    const newTarget=this.exploreOrigin.clone().add(delta);
    this.camera.position.add(newTarget.clone().sub(this.controls.target));this.controls.target.copy(newTarget);
    this.constrainExplore();this.controls.update();this.dirty=true;
  }

  private configureExplore(pose:CameraPose){
    this.resetPose={...pose,roll:0};this.exploreOrigin.set(...pose.target);
    this.controls.cursor.copy(this.exploreOrigin);
    this.controls.maxTargetRadius=sceneConfig.model.length*sceneConfig.explore.panRadius;
    const distance=new Vector3(...pose.position).distanceTo(this.exploreOrigin);
    this.controls.minDistance=distance*sceneConfig.explore.minimumDistance;
    this.controls.maxDistance=distance*sceneConfig.explore.maximumDistance;
  }

  private constrainExplore(){
    const radius=sceneConfig.model.length*sceneConfig.explore.panRadius;
    const target=this.controls.target.clone(),offset=target.clone().sub(this.exploreOrigin);
    if(offset.length()>radius)target.copy(this.exploreOrigin).add(offset.setLength(radius));
    this.camera.position.add(target.clone().sub(this.controls.target));this.controls.target.copy(target);
    const view=this.camera.position.clone().sub(target);
    const spherical=new Spherical().setFromVector3(view);
    spherical.radius=Math.max(this.controls.minDistance,Math.min(this.controls.maxDistance,spherical.radius));
    spherical.phi=Math.max(this.controls.minPolarAngle,Math.min(this.controls.maxPolarAngle,spherical.phi));
    const minimumY=sceneConfig.grove.groundY+sceneConfig.explore.groundClearance;
    const safePhi=Math.acos(Math.max(-1,Math.min(1,(minimumY-target.y)/spherical.radius)));
    spherical.phi=Math.min(spherical.phi,safePhi);
    this.camera.position.copy(target).add(view.setFromSpherical(spherical));
  }

  endExplore(pose: CameraPose): void {
    this.exploring = false;
    this.controls.enabled = false;
    this.controls.enableDamping = false;
    this.controls.update();
    this.controls.maxTargetRadius=Infinity;
    this.renderer.domElement.style.touchAction = '';
    this.setPose(pose);
    this.setStory(this.storyProgress);
    this.controls.enableDamping = true;
  }

  setStatsCallback(callback: (stats: SceneStats) => void): void { this.onFrame = callback; }

  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enabled = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.zoomSpeed = .65;
    controls.panSpeed = .65;
    controls.minPolarAngle = sceneConfig.explore.minPolarAngle;
    controls.maxPolarAngle = sceneConfig.explore.maxPolarAngle;
    controls.addEventListener('change', this.markDirty);
    return controls;
  }

  private setPixelRatio(value: number): void {
    this.pixelRatio = value;
    this.renderer.setPixelRatio(value);
    this.resize();
  }

  private markDirty = (): void => { this.dirty = true; };
  private contextLost = (event: Event): void => { event.preventDefault(); this.onContextLost(); };

  private render = (time: number): void => {
    if (this.disposed || document.hidden) { this.lastFrame = 0; this.ambientFrame=0;this.frameClock=0;return; }
    const seconds=this.frameClock?Math.min((time-this.frameClock)/1000,.05):0;
    this.frameClock=time;
    const previousImpact=this.impact.mode;
    if(!this.ambientPaused)this.impact.advance(seconds);
    if(previousImpact!==this.impact.mode)this.onImpact?.();
    if(!this.ambientPaused){
      if(this.ambientFrame)this.ambientTime+=Math.min((time-this.ambientFrame)/1000,.05);
      this.ambientFrame=time;
      this.movement*=Math.exp(-seconds*4);
      this.updateEffects();
      this.ink.children.forEach((object,index)=>{
        object.position.y=(object.userData.baseY??object.position.y)+Math.sin(this.ambientTime*sceneConfig.effects.ambientSpeed+index)*.025;
        object.position.x=(object.userData.baseX??object.position.x)+Math.sin(this.ambientTime*.09+index)*.035;
      });
      this.dirty=true;
    }
    if(!this.exploring){
      this.camera.position.copy(this.authoredCamera);
      const phase=this.captureImpactPhase??this.impact.phase;
      if(this.impact.mode==='playing'||this.captureImpactPhase!==null){
        const impulse=Math.sin(phase*Math.PI*13)*Math.exp(-phase*10);
        this.camera.position.y+=impulse*.045;this.camera.position.x+=impulse*.015;
      }
      this.camera.lookAt(this.controls.target);
    }
    if (this.exploring) {
      this.camera.up.set(0,1,0);this.controls.update();this.constrainExplore();
      const t=this.exploreStarted?ease(clamp01((time-this.exploreStarted)/(sceneConfig.explore.transitionSeconds*1000))):1;
      this.camera.up.copy(this.exploreUp).lerp(new Vector3(0,1,0),t).normalize();this.camera.lookAt(this.controls.target);
      if(t<1)this.dirty=true;
    }
    if (!this.dirty) { this.lastFrame = 0; return; }
    this.effects.faceCamera(this.camera);
    this.grove.update(this.ambientTime,this.camera);
    if (this.lastFrame) {
      const seconds = Math.min((time - this.lastFrame) / 1000, 0.2);
      this.frameSeconds += seconds;
      this.frameCount++;
    }
    this.lastFrame = time;
    this.renderer.render(this.scene, this.camera);
    this.dirty = false;
    if (this.frameSeconds >= 2) {
      const fps = this.frameCount / this.frameSeconds;
      this.onFrame?.({ fps, dpr: this.pixelRatio, drawCalls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles });
      const minimumFps = innerWidth < sceneConfig.breakpoint ? 27 : 45;
      this.slowWindows = fps < minimumFps ? this.slowWindows + 1 : 0;
      if (this.slowWindows >= 2 && this.pixelRatio > sceneConfig.renderer.minimumDpr) {
        this.slowWindows = 0;
        this.setPixelRatio(Math.max(sceneConfig.renderer.minimumDpr, this.pixelRatio - 0.25));
      }
      this.frameCount = 0;
      this.frameSeconds = 0;
    }
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.effects.dispose();
    this.grove.dispose();
    this.controls.removeEventListener('change', this.markDirty);
    this.controls.dispose();
    this.renderer.domElement.removeEventListener('webglcontextlost', this.contextLost);
    const textures = new Set<Texture>();
    const materials = new Set<Material>();
    for (const root of [this.model, this.ink]) root.traverse(object => {
      if (!(object instanceof Mesh)) return;
      object.geometry.dispose();
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
    });
    for (const material of materials) {
      for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value);
      material.dispose();
    }
    for (const texture of textures) {
      const image = texture.source.data;
      if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) image.close();
      texture.dispose();
    }
    this.environment.dispose();
    this.draco.dispose();
    this.basis.dispose();
    this.renderer.dispose();
  }
}
