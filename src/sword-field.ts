import {BoxGeometry,BufferAttribute,BufferGeometry,CanvasTexture,CylinderGeometry,DoubleSide,DynamicDrawUsage,Group,
  InstancedBufferAttribute,InstancedMesh,MeshStandardMaterial,MeshBasicMaterial,PlaneGeometry,Object3D,Vector3,type PerspectiveCamera} from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {sceneConfig} from './config';
import {ease,clamp01} from './motion';

const seed=(n:number)=>{const v=Math.sin(n*127.1+93.2)*43758.5453;return v-Math.floor(v);};
function outline(guide:Vector3[]){
  const vertices:number[]=[],indices:number[]=[];
  for(let i=0;i<=12;i++){
    const t=i/12,at=t*(guide.length-1),index=Math.min(guide.length-2,Math.floor(at));
    const p=guide[index].clone().lerp(guide[index+1],at-index),width=i===12?.002:.059*(1-t*.48),thickness=.009*(1-t*.6);
    for(const [y,z] of [[-width,-thickness],[width,-thickness],[width,thickness],[-width,thickness]])vertices.push(p.x,p.y+y,p.z+z);
    if(i<12)for(let edge=0;edge<4;edge++){const a=i*4+edge,b=i*4+(edge+1)%4;indices.push(a,b,a+4,b,b+4,a+4);}
  }
  indices.push(0,2,1,0,3,2,48,49,50,48,50,51);
  const blade=new BufferGeometry();blade.setAttribute('position',new BufferAttribute(new Float32Array(vertices),3));blade.setIndex(indices);blade.computeVertexNormals();
  const base=guide[0],parts:BufferGeometry[]=[blade];
  const cylinder=(radius:number,length:number,x:number,y:number,segments=8)=>{
    const geometry=new CylinderGeometry(radius,radius*.94,length,segments).rotateZ(-Math.PI/2).translate(x,y,0);parts.push(geometry);
  };
  cylinder(.13,.035,base.x-.05,base.y,12);
  cylinder(.045,.87,base.x-.5,base.y-.045);
  cylinder(.049,.045,base.x-.95,base.y-.045);
  for(let i=0;i<6;i++)cylinder(.048,.008,base.x-.17-i*.12,base.y-.045,6);
  parts.push(new BoxGeometry(.09,.105,.037).translate(base.x+.035,base.y,0));
  // Merge without UVs; the field uses one restrained silhouette material.
  parts.forEach(p=>p.deleteAttribute('uv'));const geometry=mergeGeometries(parts)!;parts.forEach(p=>p.dispose());return geometry;
}

function closest(point:Vector3,a:Vector3,b:Vector3){
  const direction=b.clone().sub(a),t=clamp01(point.clone().sub(a).dot(direction)/direction.lengthSq());return a.clone().addScaledVector(direction,t);
}

/** Lightweight original silhouettes, with camera-driven visibility independent of ambient motion. */
export class SwordField {
  readonly root=new Group();
  private mesh:InstancedMesh;
  private shadows:InstancedMesh;
  private shadowTexture:CanvasTexture;
  private visibility:InstancedBufferAttribute;
  private bases:Vector3[]=[];
  private tops:Vector3[]=[];
  private reveal=0;
  private faded=0;
  constructor(guide:Vector3[],tip:Vector3){
    const c=sceneConfig.swordField,geometry=outline(guide),material=new MeshStandardMaterial({color:c.color,
      roughness:.92,metalness:.04,envMapIntensity:.025,transparent:true,depthWrite:false,side:DoubleSide,forceSinglePass:true});
    this.visibility=new InstancedBufferAttribute(new Float32Array(c.desktopCount).fill(1),1).setUsage(DynamicDrawUsage);
    geometry.setAttribute('aFieldVisibility',this.visibility);
    material.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float aFieldVisibility;varying float vFieldVisibility;')
        .replace('#include <begin_vertex>','#include <begin_vertex>\nvFieldVisibility=aFieldVisibility;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vFieldVisibility;')
        .replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vFieldVisibility;');
    };
    this.mesh=new InstancedMesh(geometry,material,c.desktopCount);this.mesh.name='Field of silhouette katanas';
    // A soft local contact patch grounds each silhouette without extra shadow-map passes.
    const canvas=document.createElement('canvas');canvas.width=canvas.height=32;
    const ctx=canvas.getContext('2d')!,g=ctx.createRadialGradient(16,16,0,16,16,16);
    g.addColorStop(0,'rgba(0,0,0,.65)');g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(0,0,32,32);
    const shadowGeometry=new PlaneGeometry(.45,.45);shadowGeometry.setAttribute('aFieldVisibility',this.visibility);
    this.shadowTexture=new CanvasTexture(canvas);
    const shadowMaterial=new MeshBasicMaterial({color:'#020609',map:this.shadowTexture,transparent:true,opacity:0,depthWrite:false});
    shadowMaterial.onBeforeCompile=material.onBeforeCompile;
    this.shadows=new InstancedMesh(shadowGeometry,shadowMaterial,c.desktopCount);
    const pose=new Object3D(),grip=new Vector3(guide[0].x-.97,guide[0].y-.045,0);
    for(let i=0;i<c.desktopCount;i++){
      let angle=i*2.399963+seed(i+1)*.27,radius=c.innerRadius+seed(i+2)**.65*(c.outerRadius-c.innerRadius);
      // Keep the initial desktop/portrait approach to the centerpiece clear.
      if(Math.sin(angle)>.5&&Math.abs(Math.cos(angle)*radius)<2.3&&radius<13)angle+=.5;
      const scale=c.minimumScale+seed(i+3)*(c.maximumScale-c.minimumScale);
      pose.rotation.set((seed(i+4)-.5)*c.maximumLean,seed(i+5)*Math.PI*2,-Math.PI/2+(seed(i+6)-.5)*c.maximumLean);
      pose.scale.setScalar(scale);
      const ground=new Vector3(sceneConfig.effects.ground[0]+Math.cos(angle)*radius,sceneConfig.grove.groundY-.03,Math.sin(angle)*radius);
      pose.position.copy(ground).sub(tip.clone().multiplyScalar(scale).applyQuaternion(pose.quaternion));pose.updateMatrix();
      this.mesh.setMatrixAt(i,pose.matrix);this.bases.push(ground);this.tops.push(grip.clone().applyMatrix4(pose.matrix));
      const contact=new Object3D();contact.position.set(ground.x,sceneConfig.grove.groundY+.007,ground.z);contact.rotation.x=-Math.PI/2;contact.scale.setScalar(scale);contact.updateMatrix();this.shadows.setMatrixAt(i,contact.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate=true;this.mesh.computeBoundingSphere();this.shadows.instanceMatrix.needsUpdate=true;this.shadows.computeBoundingSphere();this.root.add(this.mesh,this.shadows);this.setProgress(0);
  }

  setProgress(progress:number){
    const c=sceneConfig.grove;this.reveal=ease((progress-c.revealStart)/(c.revealEnd-c.revealStart));
    this.root.visible=this.reveal>.001;(this.mesh.material as MeshStandardMaterial).opacity=this.reveal;
    this.mesh.count=innerWidth<sceneConfig.breakpoint?sceneConfig.swordField.mobileCount:sceneConfig.swordField.desktopCount;
    this.shadows.count=this.mesh.count;(this.shadows.material as MeshBasicMaterial).opacity=this.reveal*.45;
  }

  update(camera:PerspectiveCamera,heroTip:Vector3,heroGrip:Vector3){
    if(!this.root.visible)return;const c=sceneConfig.swordField;this.faded=0;
    const heroPoints=[heroTip,heroGrip,heroTip.clone().lerp(heroGrip,.5)];
    for(let i=0;i<this.mesh.count;i++){
      const base=this.bases[i],top=this.tops[i],near=closest(camera.position,base,top).distanceTo(camera.position);
      let opacity=ease((near-c.nearFadeEnd)/(c.nearFadeStart-c.nearFadeEnd));
      for(const hero of heroPoints){
        const point=closest(hero.clone().lerp(camera.position,.5),base,top);
        const onRay=closest(point,camera.position,hero);
        // Two alternating projections find the closest approach of the blade and viewing ray.
        const bladePoint=closest(onRay,base,top),rayPoint=closest(bladePoint,camera.position,hero);
        const along=rayPoint.distanceTo(camera.position)/hero.distanceTo(camera.position);
        if(along<.96&&along>.01){
          const clear=ease(bladePoint.distanceTo(rayPoint)/c.occlusionRadius);
          opacity=Math.min(opacity,c.minimumOcclusionOpacity+(1-c.minimumOcclusionOpacity)*clear);
        }
      }
      this.visibility.setX(i,opacity);if(opacity<.99)this.faded++;
    }
    this.visibility.needsUpdate=true;
  }

  diagnostics(){return{count:this.mesh.count,reveal:this.reveal,faded:this.faded,trianglesPerSword:this.mesh.geometry.index!.count/3};}
  dispose(){for(const mesh of[this.mesh,this.shadows]){mesh.dispose();mesh.geometry.dispose();(mesh.material as MeshStandardMaterial).dispose();}this.shadowTexture.dispose();this.root.removeFromParent();}
}
