import {
  BufferAttribute, BufferGeometry, CanvasTexture, Color, CylinderGeometry, DoubleSide,
  Group, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, MeshStandardMaterial,
  PlaneGeometry, Points, PointsMaterial, Quaternion, RingGeometry, Vector3,
  AdditiveBlending, IcosahedronGeometry, InstancedMesh, Object3D, type PerspectiveCamera,
} from 'three';
import { sceneConfig } from './config';
import { sampleEffects } from './motion';
import { MistField, type MistAnchors } from './mist';

const seed = (n:number) => { const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v); };
const white = new Color(sceneConfig.effects.mistColor);

function mistTexture():CanvasTexture {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  const ctx=canvas.getContext('2d')!;
  const gradient=ctx.createRadialGradient(32,32,0,32,32,32);
  gradient.addColorStop(0,'rgba(255,255,255,.8)');gradient.addColorStop(.3,'rgba(255,255,255,.25)');gradient.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  return new CanvasTexture(canvas);
}

function ribbon():Mesh<BufferGeometry,MeshBasicMaterial> {
  const geometry=new BufferGeometry();
  geometry.setAttribute('position',new BufferAttribute(new Float32Array(33*2*3),3));
  const indices:number[]=[];
  for(let i=0;i<32;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  geometry.setIndex(indices);
  return new Mesh(geometry,new MeshBasicMaterial({color:white,transparent:true,opacity:0,side:DoubleSide,forceSinglePass:true,depthWrite:false,toneMapped:false}));
}

/** Small, bounded effect pools. All major motion is sampled, never accumulated. */
export class WindEffects {
  readonly root=new Group();
  readonly sheath=new Group();
  readonly ground=new Group();
  private mist=new MistField();
  private ribbons=Array.from({length:sceneConfig.effects.ribbons},()=>ribbon());
  private impactRibbons=Array.from({length:5},()=>ribbon());
  private texture=mistTexture();
  private drawDust:Points<BufferGeometry,PointsMaterial>;
  private impactDust:Points<BufferGeometry,PointsMaterial>;
  private ambient:Points<BufferGeometry,PointsMaterial>;
  private stone:Mesh<CylinderGeometry,MeshStandardMaterial>;
  private wash:Mesh<PlaneGeometry,MeshBasicMaterial>;
  private ring:Mesh<RingGeometry,MeshBasicMaterial>;
  private ringOuter:Mesh<RingGeometry,MeshBasicMaterial>;
  private cracks:LineSegments<BufferGeometry,LineBasicMaterial>;
  private flare:Mesh<PlaneGeometry,MeshBasicMaterial>;
  private fragments:InstancedMesh<IcosahedronGeometry,MeshStandardMaterial>;
  private fragmentPose=new Object3D();
  private impactPhase=1;
  private mouth=new Vector3();
  private orientation=new Quaternion();
  private progress=0;
  private count=sceneConfig.effects.desktopParticles as number;

  constructor(){
    this.root.add(this.sheath,this.ground,this.mist.root);
    this.sheath.add(...this.ribbons);
    this.ground.add(...this.impactRibbons);
    const points=(size:number)=>{
      const geometry=new BufferGeometry();geometry.setAttribute('position',new BufferAttribute(new Float32Array(sceneConfig.effects.desktopParticles*3),3));
      const material=new PointsMaterial({color:white,size,map:this.texture,transparent:true,opacity:.3,depthWrite:false,toneMapped:false});
      const pool=new Points(geometry,material);pool.frustumCulled=false;return pool;
    };
    this.drawDust=points(.28);this.impactDust=points(.095);this.ambient=points(.045);
    this.sheath.add(this.drawDust);this.root.add(this.impactDust,this.ambient);

    const stoneGeometry=new CylinderGeometry(1.75,1.98,.24,11,1);
    const positions=stoneGeometry.getAttribute('position');
    for(let i=0;i<positions.count;i++){
      const x=positions.getX(i),z=positions.getZ(i);
      const irregular=1+.04*Math.sin(Math.atan2(z,x)*5);
      positions.setXYZ(i,x*irregular,positions.getY(i),z*irregular*.59);
    }
    stoneGeometry.computeVertexNormals();
    const stoneMaterial=new MeshStandardMaterial({color:sceneConfig.effects.groundColor,roughness:.96,metalness:.03,flatShading:true,transparent:true});
    // Object-space mineral grain stays attached to the slab as the camera orbits.
    stoneMaterial.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vStone;').replace('#include <begin_vertex>','#include <begin_vertex>\nvStone=position;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vStone;').replace('#include <color_fragment>',`#include <color_fragment>
        float grain=fract(sin(dot(floor(vStone.xz*340.0),vec2(12.9898,78.233)))*43758.5453);
        float strata=sin(vStone.x*31.0+sin(vStone.z*16.0)*2.0);
        float brush=sin(vStone.x*3.0+sin(vStone.z*7.0)*.65)+sin(vStone.z*4.0)*.4;
        float ink=smoothstep(.0,.65,brush)*smoothstep(-.1,.07,vStone.y);
        diffuseColor.rgb*=(.87+grain*.13+strata*.035)*mix(1.0,.36,ink);`);
    };
    this.stone=new Mesh(stoneGeometry,stoneMaterial);this.stone.position.y=-.12;
    this.ground.position.set(...sceneConfig.effects.ground);this.ground.add(this.stone);

    this.wash=new Mesh(new PlaneGeometry(6,3.3),new MeshBasicMaterial({color:'#0b1519',map:this.texture,transparent:true,depthWrite:false,opacity:.3,side:DoubleSide,forceSinglePass:true}));
    this.wash.rotation.x=-Math.PI/2;this.wash.position.y=-.235;this.ground.add(this.wash);
    // A small, flat contact mark makes the shallow embed legible.
    const contact=new Mesh(new PlaneGeometry(.5,.32),new MeshBasicMaterial({color:'#101510',map:this.texture,transparent:true,depthWrite:false,opacity:.85}));
    contact.rotation.x=-Math.PI/2;contact.position.y=.003;this.ground.add(contact);
    contact.name='contact';

    const crackPositions:number[]=[];
    for(let branch=0;branch<7;branch++){
      const angle=branch*Math.PI*2/7+.2;let x=0,z=0;
      for(let part=1;part<=4;part++){
        const distance=part*.2*(.7+seed(branch+9)*.7);
        const nextX=Math.cos(angle)*distance+(seed(branch*10+part)-.5)*.13;
        const nextZ=Math.sin(angle)*distance*.7+(seed(branch*11+part)-.5)*.08;
        crackPositions.push(x,.005,z,nextX,.005,nextZ);x=nextX;z=nextZ;
      }
    }
    const crackGeometry=new BufferGeometry();crackGeometry.setAttribute('position',new BufferAttribute(new Float32Array(crackPositions),3));
    this.cracks=new LineSegments(crackGeometry,new LineBasicMaterial({color:'#80bdba',transparent:true,opacity:0,toneMapped:false}));this.ground.add(this.cracks);
    const ring=()=>{
      const mesh=new Mesh(new RingGeometry(.94,1,96),new MeshBasicMaterial({color:'#bcece4',transparent:true,opacity:0,side:DoubleSide,forceSinglePass:true,depthWrite:false,toneMapped:false,blending:AdditiveBlending}));
      mesh.rotation.x=-Math.PI/2;mesh.position.y=.035;this.ground.add(mesh);return mesh;
    };
    this.ring=ring();this.ringOuter=ring();
    this.flare=new Mesh(new PlaneGeometry(1,1),new MeshBasicMaterial({map:this.texture,color:'#a9fff0',transparent:true,depthWrite:false,side:DoubleSide,forceSinglePass:true,blending:AdditiveBlending,toneMapped:false}));
    this.flare.rotation.x=-Math.PI/2;this.flare.position.y=.014;this.ground.add(this.flare);
    this.fragments=new InstancedMesh(new IcosahedronGeometry(.065,0),new MeshStandardMaterial({color:'#344b4d',roughness:.9,flatShading:true,transparent:true}),sceneConfig.effects.stoneFragments);
    this.fragments.frustumCulled=false;this.ground.add(this.fragments);
  }

  setStory(progress:number,mouth:Vector3,orientation:Quaternion,anchors:MistAnchors){
    this.progress=progress;this.mouth.copy(mouth);this.orientation.copy(orientation);
    this.count=innerWidth<sceneConfig.breakpoint?sceneConfig.effects.mobileParticles:sceneConfig.effects.desktopParticles;
    for(const pool of [this.drawDust,this.impactDust,this.ambient])pool.geometry.setDrawRange(0,this.count);
    this.mist.setStory(progress,anchors);
  }

  update(time:number,impactPhase=1,movement=0){
    const sampled=sampleEffects(this.progress);
    const phase=sampled.contact?impactPhase:0;
    this.impactPhase=phase;
    const state={...sampled,impactPhase:phase,burst:sampled.contact?Math.sin(Math.PI*phase):0};
    this.mist.update(time,movement);
    this.sheath.position.copy(this.mouth);this.sheath.quaternion.copy(this.orientation);
    this.sheath.visible=state.drawStrength>.001;
    for(let i=0;i<this.ribbons.length;i++){
      const mesh=this.ribbons[i],positions=mesh.geometry.getAttribute('position') as BufferAttribute;
      mesh.visible=i<(this.count<60?4:7);
      const phase=state.drawPhase*2.4+i*.19,angle=i*2.399;
      for(let j=0;j<=32;j++){
        const t=j/32,spread=t*(.16+.34*state.drawPhase),curl=Math.sin(t*5-phase)*.1*t;
        const x=-t*(.65+state.drawPhase*1.5)-.04;
        const y=Math.cos(angle)*spread+curl,z=Math.sin(angle)*spread+Math.cos(t*4+phase)*.07*t;
        const width=Math.sin(Math.PI*t)*(.004+.004*(i%3));
        positions.setXYZ(j*2,x,y-width,z);positions.setXYZ(j*2+1,x,y+width,z);
      }
      positions.needsUpdate=true;mesh.frustumCulled=false;
      mesh.material.opacity=state.drawStrength*(.24+seed(i)*.27);
    }
    const draw=this.drawDust.geometry.getAttribute('position') as BufferAttribute;
    const impact=this.impactDust.geometry.getAttribute('position') as BufferAttribute;
    const ambient=this.ambient.geometry.getAttribute('position') as BufferAttribute;
    for(let i=0;i<this.count;i++){
      const a=seed(i+1)*Math.PI*2,b=seed(i+101),c=seed(i+201);
      const travel=(b+state.drawPhase*1.7)%1;
      draw.setXYZ(i,-travel*1.9,Math.cos(a)*travel*.32,Math.sin(a)*travel*.32);
      const distance=(.1+state.impactPhase*3.8)*(.4+b*.6);
      impact.setXYZ(i,sceneConfig.effects.ground[0]+Math.cos(a)*distance,sceneConfig.effects.ground[1]+.04+Math.sin(Math.PI*state.impactPhase)*c*.7,Math.sin(a)*distance*.7);
      const drift=(c+time*.018)%1;
      ambient.setXYZ(i,-5+b*10,-2.3+drift*5.4, -1+Math.sin(a+time*.07)*2);
    }
    draw.needsUpdate=impact.needsUpdate=ambient.needsUpdate=true;
    this.drawDust.material.opacity=state.drawStrength*.27;
    this.impactDust.visible=state.burst>.001;this.impactDust.material.opacity=state.burst*.7;
    this.impactDust.material.color.set('#bcebe7');
    this.ambient.material.color.copy(white);this.ambient.material.opacity=.36;
    this.ground.visible=state.groundOpacity>.001;
    this.stone.material.opacity=state.groundOpacity;
    this.wash.material.opacity=state.groundOpacity*.65;
    this.ground.getObjectByName('contact')!.visible=state.contact;
    this.cracks.geometry.setDrawRange(0,state.contact?Math.ceil(Math.min(1,phase*4)*28)*2:0);
    this.cracks.material.opacity=state.contact?.26+state.burst*.5:0;
    this.ring.scale.setScalar(.1+state.impactPhase*4.5);
    this.ringOuter.scale.setScalar(.15+state.impactPhase*5.8);
    this.ring.material.opacity=state.burst*.6;
    this.ringOuter.material.opacity=state.burst*.25;
    this.ring.visible=this.ringOuter.visible=state.burst>.001;
    this.flare.visible=state.contact&&phase<.4;
    this.flare.scale.setScalar(.3+phase*6);
    this.flare.material.opacity=Math.exp(-phase*16)*.85;
    this.fragments.visible=state.contact&&phase<.95;
    this.fragments.count=innerWidth<sceneConfig.breakpoint?sceneConfig.effects.mobileStoneFragments:sceneConfig.effects.stoneFragments;
    for(let i=0;i<this.fragments.count;i++){
      const angle=seed(i+57)*Math.PI*2,speed=.6+seed(i+27)*1.2;
      const travel=phase*2.5*speed;
      this.fragmentPose.position.set(Math.cos(angle)*travel,Math.max(-.06,Math.sin(Math.PI*phase)*(.3+seed(i+17)*.7)),Math.sin(angle)*travel*.65);
      this.fragmentPose.rotation.set(phase*(i+2),phase*(i+5),phase*3);
      this.fragmentPose.scale.set(.7+seed(i)*.8,.4+seed(i+3)*1.2,.6+seed(i+8));
      this.fragmentPose.updateMatrix();this.fragments.setMatrixAt(i,this.fragmentPose.matrix);
    }
    this.fragments.instanceMatrix.needsUpdate=true;
    this.fragments.material.opacity=Math.min(1,(1-phase)*2.5);
    for(let i=0;i<this.impactRibbons.length;i++){
      const mesh=this.impactRibbons[i],positions=mesh.geometry.getAttribute('position') as BufferAttribute;
      const angle=i*2.399+.25;
      const settle=Math.max(0,(state.impactPhase-.7)/.3)**2;
      const reach=(.4+state.impactPhase*4)*(1-settle)+(1.1+Math.sin(time*.25+i)*.2)*settle;
      for(let j=0;j<=32;j++){
        const t=j/32,arc=angle+t*1.6;
        const radius=.08+t*reach;
        const y=.055+Math.sin(Math.PI*t)*.12+(i%2)*.07;
        const width=Math.sin(Math.PI*t)*(.008+state.burst*.013);
        positions.setXYZ(j*2,Math.cos(arc)*radius,y-width,Math.sin(arc)*radius*.7);
        positions.setXYZ(j*2+1,Math.cos(arc)*radius,y+width,Math.sin(arc)*radius*.7);
      }
      positions.needsUpdate=true;mesh.frustumCulled=false;
      mesh.material.color.set('#b0e2dd');mesh.material.opacity=state.burst*.65+(state.contact?.1*settle:0);
    }
    // Very faint breathing mist remains near the planted blade after the burst.
    this.wash.rotation.z=Math.sin(time*.05)*.025;
  }

  diagnostics(){return {mouth:this.mouth.toArray(),...sampleEffects(this.progress),landingPhase:this.impactPhase};}
  faceCamera(camera:PerspectiveCamera){this.mist.faceCamera(camera);}

  dispose(){
    this.mist.dispose();
    this.fragments.dispose();
    this.root.traverse(object=>{
      if(object instanceof Mesh||object instanceof Points||object instanceof LineSegments){
        object.geometry.dispose();
        for(const material of Array.isArray(object.material)?object.material:[object.material])material.dispose();
      }
    });
    this.texture.dispose();this.root.removeFromParent();
  }
}
