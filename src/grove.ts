import {
  BackSide, BufferAttribute, BufferGeometry, CanvasTexture, DirectionalLight,
  DoubleSide, Group, IcosahedronGeometry, InstancedMesh, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, Object3D, PerspectiveCamera, PlaneGeometry, Points, PointsMaterial,
  RepeatWrapping, ShaderMaterial, SphereGeometry, Sprite, SpriteMaterial, Vector3,
  CylinderGeometry, CircleGeometry, SRGBColorSpace, type Material, type Texture,
} from 'three';
import { sceneConfig } from './config';
import { ease, clamp01 } from './motion';

const random=(n:number)=>{const x=Math.sin(n*127.1+31.7)*43758.5453;return x-Math.floor(x);};
type SwayMaterial=MeshStandardMaterial & {userData:{[key:string]:unknown}};

function texture(kind:'bamboo'|'ground'|'cloud') {
  const canvas=document.createElement('canvas');canvas.width=kind==='cloud'?256:128;canvas.height=256;
  const ctx=canvas.getContext('2d')!;
  if(kind==='cloud'){
    for(let i=0;i<22;i++){
      const x=30+random(i)*196,y=100+random(i+23)*56,r=24+random(i+45)*40;
      const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(225,250,246,.11)');g.addColorStop(1,'transparent');
      ctx.fillStyle=g;ctx.fillRect(0,0,256,256);
    }
  }else{
    ctx.fillStyle=kind==='bamboo'?'#718481':'#45565b';ctx.fillRect(0,0,128,256);
    for(let i=0;i<2800;i++){
      ctx.fillStyle=`rgba(${kind==='bamboo'?'15,35,30':'8,18,25'},${.04+random(i)*.16})`;
      ctx.fillRect(random(i+1)*128,random(i+2)*256,kind==='bamboo'?1:1+random(i+3)*4,kind==='bamboo'?12+random(i+4)*30:2);
    }
    if(kind==='bamboo'){
      for(let y=0;y<256;y+=32){ctx.fillStyle='#304b48';ctx.fillRect(0,y,128,2);ctx.fillStyle='#b1b9a0';ctx.fillRect(0,y+2,128,1);}
    }else{
      for(let i=0;i<90;i++){
        ctx.strokeStyle='rgba(130,151,153,.16)';ctx.beginPath();const x=random(i+400)*128,y=random(i+500)*256;
        ctx.moveTo(x,y);ctx.lineTo(x+random(i+600)*8,y+random(i+700)*14);ctx.stroke();
      }
    }
  }
  const result=new CanvasTexture(canvas);
  if(kind!=='cloud'){result.colorSpace=SRGBColorSpace;result.wrapS=result.wrapT=RepeatWrapping;if(kind==='ground')result.repeat.set(18,18);}
  return result;
}

function leafGeometry(){
  const geometry=new BufferGeometry();
  geometry.setAttribute('position',new BufferAttribute(new Float32Array([0,0,0,.4,.11,.03,.65,.09,.04,1,0,0,.65,-.09,.04,.4,-.11,.03]),3));
  geometry.setIndex([0,1,5,1,2,5,2,4,5,2,3,4]);geometry.computeVertexNormals();return geometry;
}

/** A bounded, seeded 360-degree grove; all geometry and texture assets are original. */
export class MoonlitGrove {
  readonly root=new Group();
  readonly moonlight=new DirectionalLight(sceneConfig.grove.moonColor,0);
  private materials:Material[]=[];
  private textures:Texture[]=[];
  private swayUniform={value:0};
  private reveal=0;
  private stalks:InstancedMesh;
  private branches:InstancedMesh;
  private leaves:InstancedMesh;
  private rocks:InstancedMesh;
  private litter:InstancedMesh;
  private shadows:InstancedMesh;
  private fog:Mesh<PlaneGeometry,MeshBasicMaterial>[]=[];
  private motes:Points<BufferGeometry,PointsMaterial>;
  private sky:Mesh<SphereGeometry,ShaderMaterial>;
  private counts={stalks:0,branches:0,leaves:0};
  private clock=0;
  private mobileDensity:boolean|null=null;

  constructor(){
    const config=sceneConfig.grove;
    const bamboo=texture('bamboo'),ground=texture('ground'),cloud=texture('cloud');this.textures.push(bamboo,ground,cloud);
    const sway=(material:SwayMaterial)=>{
      material.onBeforeCompile=shader=>{
        shader.uniforms.uGroveTime=this.swayUniform;
        shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float uGroveTime;');
        shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`vec4 grovePosition=vec4(transformed,1.0);
          #ifdef USE_INSTANCING
          grovePosition=instanceMatrix*grovePosition;
          #endif
          float height=max(0.0,grovePosition.y-(${config.groundY}));
          grovePosition.x+=sin(uGroveTime*${config.swaySpeed}+grovePosition.z*.23)*height*height*${config.sway/140};
          grovePosition.z+=cos(uGroveTime*${config.swaySpeed}*.8+grovePosition.x*.17)*height*height*${config.sway/220};
          vec4 mvPosition=modelViewMatrix*grovePosition;gl_Position=projectionMatrix*mvPosition;`);
      };
      this.materials.push(material);return material;
    };
    const stemMat=sway(new MeshStandardMaterial({color:config.bambooColor,map:bamboo,roughness:.65,metalness:.06,envMapIntensity:.18,transparent:true}));
    const branchMat=sway(new MeshStandardMaterial({color:'#31494a',roughness:.84,envMapIntensity:.1,transparent:true}));
    const leafMat=sway(new MeshStandardMaterial({color:'#375557',roughness:.74,envMapIntensity:.12,side:DoubleSide,forceSinglePass:true,transparent:true}));
    this.stalks=new InstancedMesh(new CylinderGeometry(.7,1,1,7,1),stemMat,config.desktopStalks);
    this.branches=new InstancedMesh(new CylinderGeometry(.35,1,1,5,1),branchMat,config.desktopStalks*5);
    this.leaves=new InstancedMesh(leafGeometry(),leafMat,config.desktopStalks*5*7);
    const dummy=new Object3D();const up=new Vector3(0,1,0);
    let branchIndex=0,leafIndex=0;
    for(let i=0;i<config.desktopStalks;i++){
      const angle=i*2.399963,radius=config.innerRadius+random(i+10)*(config.outerRadius-config.innerRadius);
      const x=sceneConfig.effects.ground[0]+Math.cos(angle)*radius,z=Math.sin(angle)*radius;
      const height=11+random(i+20)*10,width=.18+random(i+30)*.17;
      dummy.position.set(x,config.groundY+height/2,z);dummy.rotation.set((random(i+40)-.5)*.04,0,(random(i+50)-.5)*.04);dummy.scale.set(width,height,width);dummy.updateMatrix();this.stalks.setMatrixAt(i,dummy.matrix);
      for(let b=0;b<5;b++){
        const n=i*5+b,heading=angle+random(n+100)*Math.PI*2;
        const base=new Vector3(x,config.groundY+height*(.43+b*.105),z);
        const length=1.2+random(n+200)*1.8,direction=new Vector3(Math.cos(heading),.3,Math.sin(heading)).normalize();
        dummy.position.copy(base).addScaledVector(direction,length/2);dummy.quaternion.setFromUnitVectors(up,direction);dummy.scale.set(.025,length,.025);dummy.updateMatrix();this.branches.setMatrixAt(branchIndex++,dummy.matrix);
        for(let l=0;l<7;l++){
          const along=.2+l*.12;
          dummy.position.copy(base).addScaledVector(direction,length*along);
          dummy.rotation.set((random(n*7+l+300)-.5)*1.2,heading+(l%2?-.8:.8),-.15+(l%2?.4:-.4));
          const size=.55+random(n*7+l+400)*.6;dummy.scale.set(size,size,1);dummy.updateMatrix();this.leaves.setMatrixAt(leafIndex++,dummy.matrix);
        }
      }
    }
    this.counts={stalks:config.desktopStalks,branches:branchIndex,leaves:leafIndex};
    const rockGeometry=new IcosahedronGeometry(1,1),rockPositions=rockGeometry.getAttribute('position');
    for(let i=0;i<rockPositions.count;i++){const r=.88+random(i+900)*.25;rockPositions.setXYZ(i,rockPositions.getX(i)*r,rockPositions.getY(i)*r,rockPositions.getZ(i)*r);}
    rockGeometry.computeVertexNormals();
    const rockMat=new MeshStandardMaterial({color:'#3c5059',map:ground,roughness:.42,metalness:.13,envMapIntensity:.18,flatShading:true,transparent:true});this.materials.push(rockMat);
    this.rocks=new InstancedMesh(rockGeometry,rockMat,config.desktopRocks);
    for(let i=0;i<config.desktopRocks;i++){
      const a=i*2.399963,r=config.innerRadius-1+random(i+1000)*15,scale=.5+random(i+1100)*1.7;
      dummy.position.set(sceneConfig.effects.ground[0]+Math.cos(a)*r,config.groundY+scale*.15,Math.sin(a)*r);dummy.rotation.set(random(i)*.3,a,random(i+1)*.3);dummy.scale.set(scale,scale*.55,scale*.8);dummy.updateMatrix();this.rocks.setMatrixAt(i,dummy.matrix);
    }
    const floorMat=new MeshStandardMaterial({color:config.groundColor,map:ground,bumpMap:ground,bumpScale:.045,roughness:.78,metalness:.04,envMapIntensity:.025,transparent:true});this.materials.push(floorMat);
    const floor=new Mesh(new PlaneGeometry(160,160,1,1),floorMat);floor.rotation.x=-Math.PI/2;floor.position.set(sceneConfig.effects.ground[0],config.groundY,0);
    const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;
    const shadowContext=shadowCanvas.getContext('2d')!,gradient=shadowContext.createRadialGradient(32,32,0,32,32,32);
    gradient.addColorStop(0,'rgba(0,0,0,.75)');gradient.addColorStop(.35,'rgba(0,0,0,.45)');gradient.addColorStop(1,'transparent');
    shadowContext.fillStyle=gradient;shadowContext.fillRect(0,0,64,64);
    const shadowTexture=new CanvasTexture(shadowCanvas);this.textures.push(shadowTexture);
    const shadowMat=new MeshBasicMaterial({color:'#02090d',map:shadowTexture,transparent:true,depthWrite:false});this.materials.push(shadowMat);
    this.shadows=new InstancedMesh(new CircleGeometry(1,16),shadowMat,config.desktopStalks+config.desktopRocks);
    for(let i=0;i<this.shadows.count;i++){
      const rock=i>=config.desktopStalks,index=rock?i-config.desktopStalks:i;
      (rock?this.rocks:this.stalks).getMatrixAt(index,dummy.matrix);dummy.matrix.decompose(dummy.position,dummy.quaternion,dummy.scale);
      const size=rock?dummy.scale.x*1.4:.8;
      dummy.position.y=config.groundY+.006;dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.set(size,size*(rock?.8:1),1);dummy.updateMatrix();this.shadows.setMatrixAt(i,dummy.matrix);
    }
    const litterMat=new MeshStandardMaterial({color:'#3a4840',roughness:.95,envMapIntensity:.08,side:DoubleSide,forceSinglePass:true,transparent:true});this.materials.push(litterMat);
    this.litter=new InstancedMesh(leafGeometry(),litterMat,550);
    for(let i=0;i<this.litter.count;i++){
      const a=i*2.399,r=1.8+random(i+1700)*27;
      dummy.position.set(sceneConfig.effects.ground[0]+Math.cos(a)*r,config.groundY+.014,Math.sin(a)*r);
      dummy.rotation.set(-Math.PI/2,0,a);dummy.scale.set(.12+random(i+1800)*.24,.5,1);dummy.updateMatrix();this.litter.setMatrixAt(i,dummy.matrix);
    }
    const skyMat=new ShaderMaterial({side:BackSide,transparent:true,depthWrite:false,uniforms:{uReveal:{value:0}},vertexShader:'varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 vDirection;uniform float uReveal;void main(){float h=normalize(vDirection).y;vec3 c=mix(vec3(.055,.105,.13),vec3(.008,.017,.029),smoothstep(-.15,.8,h));gl_FragColor=vec4(c,uReveal);}' });
    this.sky=new Mesh(new SphereGeometry(85,24,12),skyMat);this.materials.push(skyMat);
    const moonMat=new SpriteMaterial({color:'#cde4ed',map:cloud,transparent:true,opacity:0,depthWrite:false,fog:false});this.materials.push(moonMat);
    const moon=new Sprite(moonMat);moon.position.set(-26,24,-48);moon.scale.set(12,12,1);
    const discMat=new MeshBasicMaterial({color:'#99bfcf',transparent:true,fog:false});this.materials.push(discMat);
    const disc=new Mesh(new SphereGeometry(1.25,16,12),discMat);disc.position.copy(moon.position);
    this.moonlight.position.set(-12,18,-18);this.moonlight.target.position.set(...sceneConfig.effects.ground);
    for(let i=0;i<6;i++){
      const mat=new MeshBasicMaterial({map:cloud,color:'#92c6cc',transparent:true,opacity:0,depthWrite:false,side:DoubleSide,forceSinglePass:true});this.materials.push(mat);
      const fog=new Mesh(new PlaneGeometry(1,1),mat);this.fog.push(fog);
    }
    const positions=new Float32Array(config.motes*3);const moteMat=new PointsMaterial({color:'#a9e7dd',size:.038,transparent:true,opacity:0,depthWrite:false});this.materials.push(moteMat);
    const moteGeometry=new BufferGeometry();moteGeometry.setAttribute('position',new BufferAttribute(positions,3));this.motes=new Points(moteGeometry,moteMat);
    this.root.add(floor,this.sky,moon,disc,this.stalks,this.branches,this.leaves,this.rocks,this.litter,this.shadows,...this.fog,this.motes,this.moonlight,this.moonlight.target);
    for(const mesh of [this.stalks,this.branches,this.leaves,this.rocks,this.litter,this.shadows]){mesh.computeBoundingSphere();mesh.instanceMatrix.needsUpdate=true;}
    this.setProgress(0);
  }

  setProgress(progress:number){
    const c=sceneConfig.grove;this.reveal=ease(clamp01((progress-c.revealStart)/(c.revealEnd-c.revealStart)));
    this.root.visible=this.reveal>.001;
    for(const material of this.materials)material.opacity=this.reveal;
    this.sky.material.uniforms.uReveal.value=this.reveal;
    this.moonlight.intensity=this.reveal*2.3;
    const mobile=innerWidth<sceneConfig.breakpoint;
    this.stalks.count=mobile?c.mobileStalks:this.counts.stalks;this.branches.count=this.stalks.count*5;this.leaves.count=this.stalks.count*35;
    this.rocks.count=mobile?c.mobileRocks:c.desktopRocks;this.motes.geometry.setDrawRange(0,mobile?c.mobileMotes:c.motes);
    this.litter.count=mobile?260:550;
    if(this.mobileDensity!==mobile){
      this.mobileDensity=mobile;this.shadows.count=this.stalks.count+this.rocks.count;
      const dummy=new Object3D();
      for(let i=0;i<this.shadows.count;i++){
        const rock=i>=this.stalks.count,index=rock?i-this.stalks.count:i;
        (rock?this.rocks:this.stalks).getMatrixAt(index,dummy.matrix);dummy.matrix.decompose(dummy.position,dummy.quaternion,dummy.scale);
        const size=rock?dummy.scale.x*1.4:.8;
        dummy.position.y=c.groundY+.006;dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.set(size,size*(rock?.8:1),1);dummy.updateMatrix();this.shadows.setMatrixAt(i,dummy.matrix);
      }
      this.shadows.instanceMatrix.needsUpdate=true;
    }
  }

  update(time:number,camera:PerspectiveCamera){
    if(!this.root.visible)return;
    this.clock=time;this.swayUniform.value=time;
    const c=sceneConfig.grove;
    for(let i=0;i<this.fog.length;i++){
      const a=i*2.399,near=i<3,r=near?6:18;
      const plane=this.fog[i];plane.visible=innerWidth>=sceneConfig.breakpoint||i<4;
      plane.position.set(sceneConfig.effects.ground[0]+Math.cos(a)*r+Math.sin(time*.045+i)*.7,c.groundY+.42+i*.09,Math.sin(a)*r);
      plane.quaternion.copy(camera.quaternion);plane.scale.set(near?10:19,near?1.5:2.6,1);plane.material.opacity=this.reveal*(near?.13:.18);
    }
    const positions=this.motes.geometry.getAttribute('position') as BufferAttribute;
    for(let i=0;i<c.motes;i++){
      const a=i*2.399+time*.018,r=2+random(i+1400)*16;
      positions.setXYZ(i,sceneConfig.effects.ground[0]+Math.cos(a)*r,c.groundY+.3+random(i+1500)*5+Math.sin(time*.15+i)*.15,Math.sin(a)*r);
    }
    positions.needsUpdate=true;this.motes.material.opacity=this.reveal*.55;
  }

  diagnostics(){return{reveal:this.reveal,stalks:this.stalks.count,leaves:this.leaves.count,ambientTime:this.clock,innerRadius:sceneConfig.grove.innerRadius};}
  dispose(){
    const geometries=new Set<BufferGeometry>();this.root.traverse(object=>{if(object instanceof Mesh||object instanceof Points)geometries.add(object.geometry);if(object instanceof InstancedMesh)object.dispose();});
    geometries.forEach(g=>g.dispose());this.materials.forEach(m=>m.dispose());this.textures.forEach(t=>t.dispose());this.root.removeFromParent();
  }
}
