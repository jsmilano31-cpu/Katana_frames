import {BufferAttribute,BufferGeometry,CanvasTexture,Color,DoubleSide,DynamicDrawUsage,Group,InstancedMesh,
  Mesh,MeshStandardMaterial,Object3D,PlaneGeometry,SRGBColorSpace} from 'three';
import {sceneConfig} from './config';
import {LeafSimulation,type FallenLeaf} from './leaf-state';

const colors=['#496257','#5c7364','#38574b','#6f7b60'];
function geometry(){
  const g=new BufferGeometry();
  g.setAttribute('position',new BufferAttribute(new Float32Array([-.5,0,0,-.16,.105,.015,.18,.08,.024,.5,0,0,.18,-.08,.024,-.16,-.105,.015]),3));
  g.setIndex([0,1,5,1,2,5,2,4,5,2,3,4]);g.computeVertexNormals();return g;
}

/** New leaves stay geometric; old leaves become permanent marks in one bounded texture. */
export class FallingLeaves {
  readonly root=new Group();
  readonly simulation:LeafSimulation;
  private canvas=document.createElement('canvas');
  private context:CanvasRenderingContext2D;
  private texture:CanvasTexture;
  private airborne:InstancedMesh;
  private landed:InstancedMesh;
  private carpet:Mesh<PlaneGeometry,MeshStandardMaterial>;
  private dummy=new Object3D();
  private textureDirty=false;
  private lastUpload=0;
  constructor(){
    const c=sceneConfig.leafFall,mobile=innerWidth<sceneConfig.breakpoint;
    this.canvas.width=this.canvas.height=mobile?c.mobileTexture:c.desktopTexture;
    this.context=this.canvas.getContext('2d')!;
    this.texture=new CanvasTexture(this.canvas);this.texture.colorSpace=SRGBColorSpace;
    const mat=new MeshStandardMaterial({color:'#ffffff',roughness:.94,envMapIntensity:.08,side:DoubleSide,forceSinglePass:true,alphaHash:true});
    const g=geometry();this.airborne=new InstancedMesh(g,mat,c.desktopAirborne);
    this.landed=new InstancedMesh(g,mat,c.desktopLanded);
    this.airborne.name='Falling bamboo leaves';this.landed.name='Settled bamboo leaves';
    for(const mesh of[this.airborne,this.landed]){
      mesh.instanceMatrix.setUsage(DynamicDrawUsage);mesh.frustumCulled=false;mesh.count=0;
      mesh.setColorAt(0,new Color(colors[0]));
    }
    const carpetMat=new MeshStandardMaterial({map:this.texture,roughness:.96,envMapIntensity:.08,alphaTest:.2,depthWrite:true});
    this.carpet=new Mesh(new PlaneGeometry(c.carpetSize,c.carpetSize),carpetMat);
    this.carpet.name='Accumulated bamboo leaf carpet';this.carpet.rotation.x=-Math.PI/2;
    this.carpet.position.set(sceneConfig.effects.ground[0],sceneConfig.grove.groundY+.018,0);
    this.root.add(this.carpet,this.airborne,this.landed);
    this.simulation=new LeafSimulation(leaf=>this.bake(leaf));this.simulation.setMobile(mobile);this.root.visible=false;
  }
  private bake(leaf:FallenLeaf){
    const ctx=this.context,c=sceneConfig.leafFall,pixel=this.canvas.width/c.carpetSize;
    ctx.save();ctx.translate((leaf.x/c.carpetSize+.5)*this.canvas.width,(leaf.z/c.carpetSize+.5)*this.canvas.height);
    // Plane UV's vertical axis maps to -world Z, so canvas Y follows +world Z.
    ctx.rotate(-leaf.angle);ctx.scale(leaf.size*pixel,leaf.size*pixel);
    ctx.fillStyle=colors[Math.min(3,Math.floor(leaf.tint*4))];ctx.beginPath();ctx.moveTo(-.5,0);
    ctx.bezierCurveTo(-.18,-.15,.2,-.1,.5,0);ctx.bezierCurveTo(.18,.1,-.17,.15,-.5,0);ctx.fill();
    ctx.strokeStyle='rgba(27,49,42,.45)';ctx.lineWidth=.025;ctx.beginPath();ctx.moveTo(-.45,0);ctx.lineTo(.44,0);ctx.stroke();ctx.restore();this.textureDirty=true;
  }
  private put(mesh:InstancedMesh,index:number,leaf:FallenLeaf,airborne=false){
    const pose=airborne?this.simulation.pose(leaf as Parameters<LeafSimulation['pose']>[0]):null;
    this.dummy.position.set(sceneConfig.effects.ground[0]+(pose?.x??leaf.x),sceneConfig.grove.groundY+(pose?.y??.026),pose?.z??leaf.z);
    this.dummy.rotation.set(pose?.rx??-Math.PI/2,pose?.ry??0,pose?.rz??leaf.angle);
    this.dummy.scale.setScalar(leaf.size);this.dummy.updateMatrix();mesh.setMatrixAt(index,this.dummy.matrix);
    mesh.setColorAt(index,new Color(colors[Math.min(3,Math.floor(leaf.tint*4))]));
  }
  update(seconds:number,visible:boolean,active:boolean){
    this.root.visible=visible;
    this.simulation.setMobile(innerWidth<sceneConfig.breakpoint);
    if(active)this.simulation.advance(seconds);
    this.airborne.count=this.simulation.airborne.length;this.landed.count=this.simulation.landed.length;
    this.simulation.airborne.forEach((leaf,i)=>this.put(this.airborne,i,leaf,true));
    this.simulation.landed.forEach((leaf,i)=>this.put(this.landed,i,leaf));
    for(const mesh of[this.airborne,this.landed]){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
    if(this.textureDirty&&(!active||this.simulation.time-this.lastUpload>=sceneConfig.leafFall.textureBatchSeconds))this.flush();
  }
  flush(){if(this.textureDirty){this.texture.needsUpdate=true;this.textureDirty=false;this.lastUpload=this.simulation.time;}}
  capture(seconds:number){this.reset();this.simulation.advance(Math.max(0,Math.min(seconds,7200)));this.update(0,true,false);this.flush();}
  reset(){this.simulation.reset();this.context.clearRect(0,0,this.canvas.width,this.canvas.height);this.texture.needsUpdate=true;this.textureDirty=false;this.lastUpload=0;this.airborne.count=this.landed.count=0;}
  diagnostics(){return{...this.simulation.diagnostics(),textureSize:this.canvas.width};}
  dispose(){this.airborne.dispose();this.landed.dispose();this.airborne.geometry.dispose();(this.airborne.material as MeshStandardMaterial).dispose();this.carpet.geometry.dispose();this.carpet.material.dispose();this.texture.dispose();this.root.removeFromParent();}
}
