import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, DoubleSide,
  Group, Matrix4, Mesh, MeshBasicMaterial, PlaneGeometry, Sprite, SpriteMaterial, Vector3, type PerspectiveCamera,
} from 'three';
import { sceneConfig } from './config';
import { sampleAwakening } from './motion';

export interface MistAnchors {bladeMatrix:Matrix4;guide:Vector3[];trail:Vector3[];exposed:number}
const seed=(n:number)=>{const v=Math.sin(n*127.1)*43758.5453;return v-Math.floor(v);};

/** Soft cloud texture generated locally; no imported anime artwork. */
function cloudTexture(){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;
  const ctx=canvas.getContext('2d')!;
  for(let i=0;i<24;i++){
    const x=24+seed(i+1)*208,y=44+seed(i+31)*40,radius=16+seed(i+61)*27;
    const gradient=ctx.createRadialGradient(x,y,0,x,y,radius);
    gradient.addColorStop(0,'rgba(255,255,255,.16)');gradient.addColorStop(.45,'rgba(255,255,255,.08)');gradient.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,256,128);
  }
  // Fade every boundary so a fog card never exposes its rectangle.
  ctx.globalCompositeOperation='destination-in';
  const vertical=ctx.createLinearGradient(0,0,0,128);
  vertical.addColorStop(0,'transparent');vertical.addColorStop(.3,'white');vertical.addColorStop(.7,'white');vertical.addColorStop(1,'transparent');
  ctx.fillStyle=vertical;ctx.fillRect(0,0,256,128);
  const horizontal=ctx.createLinearGradient(0,0,256,0);
  horizontal.addColorStop(0,'transparent');horizontal.addColorStop(.15,'white');horizontal.addColorStop(.85,'white');horizontal.addColorStop(1,'transparent');
  ctx.fillStyle=horizontal;ctx.fillRect(0,0,256,128);
  return new CanvasTexture(canvas);
}

function ribbon(texture:CanvasTexture,thin=false){
  const geometry=new BufferGeometry();
  geometry.setAttribute('position',new BufferAttribute(new Float32Array(33*2*3),3));
  const uv=new Float32Array(33*2*2),indices:number[]=[];
  for(let i=0;i<=32;i++){uv.set([i/32,0,i/32,1],i*4);if(i<32){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}}
  geometry.setAttribute('uv',new BufferAttribute(uv,2));geometry.setIndex(indices);
  const material=new MeshBasicMaterial({map:texture,color:thin?sceneConfig.effects.accentColor:sceneConfig.effects.mistColor,
    side:DoubleSide,forceSinglePass:true,transparent:true,opacity:0,depthWrite:false,toneMapped:false,...(thin?{blending:AdditiveBlending}:{})});
  const mesh=new Mesh(geometry,material);mesh.frustumCulled=false;return mesh;
}

export class MistField {
  readonly root=new Group();
  private blade=new Group();
  private texture=cloudTexture();
  private ribbons=Array.from({length:sceneConfig.effects.mistRibbons},(_,i)=>ribbon(this.texture,i%2===1));
  private trails=Array.from({length:3},(_,i)=>ribbon(this.texture,i===1));
  private fog:Mesh<PlaneGeometry,MeshBasicMaterial>[]=[];
  private glint=new Sprite(new SpriteMaterial({map:this.texture,color:'#b9fff2',transparent:true,depthWrite:false,blending:AdditiveBlending,toneMapped:false}));
  private guide=[new Vector3(-1,0,0),new Vector3(2,0,0)];
  private trail=[new Vector3(),new Vector3()];
  private exposed=0;
  private progress=0;

  constructor(){
    this.blade.matrixAutoUpdate=false;
    this.root.add(this.blade,...this.trails);this.blade.add(...this.ribbons,this.glint);
    for(let i=0;i<sceneConfig.effects.mistLayers;i++){
      const material=new MeshBasicMaterial({map:this.texture,color:sceneConfig.effects.mistColor,transparent:true,opacity:.08,depthWrite:false,side:DoubleSide,forceSinglePass:true,toneMapped:false});
      const mesh=new Mesh(new PlaneGeometry(1,1),material);this.fog.push(mesh);this.root.add(mesh);
    }
  }

  setStory(progress:number,anchors:MistAnchors){
    this.progress=progress;this.exposed=anchors.exposed;this.guide=anchors.guide;this.trail=anchors.trail;
    this.blade.matrix.copy(anchors.bladeMatrix);
  }

  update(time:number,movement:number){
    const config=sceneConfig.effects,mobile=innerWidth<sceneConfig.breakpoint;
    const awakening=sampleAwakening(this.progress,this.exposed);
    const awake=awakening.aura/config.auraIntensity;
    const phase=this.progress*14+time*.22;
    this.blade.visible=this.exposed>.005&&awake>0;
    for(let i=0;i<this.ribbons.length;i++){
      const mesh=this.ribbons[i],positions=mesh.geometry.getAttribute('position') as BufferAttribute;
      mesh.visible=i<(mobile?config.mobileMistRibbons:config.mistRibbons);
      for(let j=0;j<=32;j++){
        const t=j/32,along=t*this.exposed,point=this.at(this.guide,along);
        const angle=i*2.399+along*7-phase;
        const radius=.06+.045*Math.sin(along*5+phase)+movement*.12;
        const width=Math.sin(Math.PI*t)*(i%2?.018:.24)*(1+movement*.7);
        const y=point.y+Math.cos(angle)*radius,z=point.z+Math.sin(angle)*radius;
        positions.setXYZ(j*2,point.x,y-width,z);positions.setXYZ(j*2+1,point.x,y+width,z);
      }
      positions.needsUpdate=true;
      mesh.material.opacity=awake*(i%2?.3:.55)*(1+movement*.45);
    }
    for(let i=0;i<this.trails.length;i++){
      const mesh=this.trails[i],positions=mesh.geometry.getAttribute('position') as BufferAttribute;
      mesh.visible=awake>0&&movement>.005&&(!mobile||i<2);
      for(let j=0;j<=32;j++){
        const t=j/32,point=this.at(this.trail,t);
        const curl=Math.sin(t*6-phase+i)*t*.22;
        const width=Math.sin(Math.PI*t)*(.09+i*.045)*(1+movement);
        positions.setXYZ(j*2,point.x,point.y+curl-width,point.z+.12+t*.3);
        positions.setXYZ(j*2+1,point.x,point.y+curl+width,point.z+.12+t*.3);
      }
      positions.needsUpdate=true;mesh.material.opacity=awake*movement*.65;
    }
    const tip=this.guide[this.guide.length-1];this.glint.position.copy(tip);
    this.glint.scale.setScalar(.34+awakening.glint*.34);
    (this.glint.material as SpriteMaterial).opacity=awakening.glint*.9;
    this.glint.visible=awakening.glint>.001;
    for(let i=0;i<this.fog.length;i++){
      const plane=this.fog[i],ground=this.progress>=.9&&i<2;
      plane.visible=i<(mobile?config.mobileMistLayers:config.mistLayers)&&!(this.progress>=sceneConfig.grove.revealEnd&&i>=2);
      if(ground){
        plane.position.set(config.ground[0]+Math.sin(time*.07+i)*.6,config.ground[1]+.12+i*.12,-.2+i*.5);
        plane.scale.set(6.5,1.1,1);plane.material.opacity=.28;
      }else{
        plane.position.set(-3+i*1.1+Math.sin(time*.045+i)*.65,-.9+(i%3)*1.15+Math.sin(time*.06+i)*.12,-2.5-i*.35);
        plane.scale.set(8.5,2.2,1);plane.material.opacity=.16+movement*.06;
      }
      plane.rotation.z=Math.sin(time*.04+i)*.09;
    }
  }

  faceCamera(camera:PerspectiveCamera){
    if(this.progress<sceneConfig.grove.revealStart)return;
    for(const plane of this.fog)plane.quaternion.copy(camera.quaternion);
  }

  private at(points:Vector3[],t:number){
    const value=Math.max(0,Math.min(1,t))*(points.length-1),index=Math.min(points.length-2,Math.floor(value));
    return new Vector3().lerpVectors(points[index],points[index+1],value-index);
  }

  dispose(){
    this.root.traverse(object=>{
      if(object instanceof Mesh){object.geometry.dispose();for(const material of Array.isArray(object.material)?object.material:[object.material])material.dispose();}
      if(object instanceof Sprite)(object.material as SpriteMaterial).dispose();
    });
    this.texture.dispose();this.root.removeFromParent();
  }
}
