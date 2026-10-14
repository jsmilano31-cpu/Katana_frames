import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {Box3,Matrix4,Quaternion,Vector3} from 'three';
import {inspectGlb} from './model-tools.mjs';
const configCode=stripTypeScriptTypes(readFileSync('src/config.ts','utf8'));
const {sceneConfig}=await import(`data:text/javascript;base64,${Buffer.from(configCode).toString('base64')}`);
const data=readFileSync('public/assets/model/katana.glb'),json=inspectGlb(data),binary=28+data.readUInt32LE(12),worlds=[];
function walk(id,parent){const node=json.nodes[id];worlds[id]=parent.clone().multiply(id===0?new Matrix4():new Matrix4().fromArray(node.matrix??[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]));for(const child of node.children??[])walk(child,worlds[id]);}
walk(0,new Matrix4().makeRotationX(-Math.PI/2));
function attribute(id,index){const a=json.accessors[id],v=json.bufferViews[a.bufferView],size=a.componentType===5123?2:4,count=a.type==='VEC3'?3:1,offset=binary+(v.byteOffset??0)+(a.byteOffset??0)+index*(v.byteStride??size*count);return Array.from({length:count},(_,k)=>a.componentType===5126?data.readFloatLE(offset+k*size):size===4?data.readUInt32LE(offset+k*size):data.readUInt16LE(offset+k*size));}
function mesh(pattern){const id=json.nodes.findIndex(n=>n.mesh!==undefined&&pattern.test(n.name)),p=json.meshes[json.nodes[id].mesh].primitives[0];return{positions:Array.from({length:json.accessors[p.attributes.POSITION].count},(_,i)=>new Vector3(...attribute(p.attributes.POSITION,i)).applyMatrix4(worlds[id])),indices:Array.from({length:json.accessors[p.indices].count},(_,i)=>attribute(p.indices,i)[0])};}
function section(mesh,x){const points=[];for(let i=0;i<mesh.indices.length;i+=3){const triangle=mesh.indices.slice(i,i+3).map(n=>mesh.positions[n]);for(let e=0;e<3;e++){const a=triangle[e],b=triangle[(e+1)%3];if((a.x-x)*(b.x-x)<=0&&Math.abs(a.x-b.x)>1e-10)points.push(a.clone().lerp(b,(x-a.x)/(b.x-a.x)));}}return new Box3().setFromPoints(points);}
const saya=mesh(/Saya/),blade=mesh(/Nagasa/),collar=mesh(/Habaki/),source=sceneConfig.model.sheathFrame,target=sceneConfig.model.collarFrame;
const rotation=new Quaternion().setFromUnitVectors(new Vector3(...source.axis).normalize(),new Vector3(...target.axis).normalize());
const alignment=new Matrix4().makeTranslation(...target.center).multiply(new Matrix4().makeRotationFromQuaternion(rotation)).multiply(new Matrix4().makeTranslation(...source.center.map(n=>-n)));
const initial=section(saya,-1.23);saya.positions.forEach(p=>p.applyMatrix4(alignment));
const sections=[-1.2,-1,-.8,-.4,0,.5,1,1.5,2].map(x=>{const s=section(saya,x),b=section(blade,x);return{x,sheathCenter:s.getCenter(new Vector3()).toArray(),bladeCenter:b.getCenter(new Vector3()).toArray(),outerEnvelopeClearance:{lower:b.min.y-s.min.y,upper:s.max.y-b.max.y,left:b.min.z-s.min.z,right:s.max.z-b.max.z}};});
const result={sourceSpace:'Meters before runtime normalization; official GLB presentation rotation reset',sourceOpeningSection:initial.getCenter(new Vector3()).toArray(),collarSection:section(collar,-1.23).getCenter(new Vector3()).toArray(),calibratedFrames:{source,target},rotationRadians:rotation.angleTo(new Quaternion()),sections,minimumOuterEnvelopeClearance:Math.min(...sections.flatMap(s=>Object.values(s.outerEnvelopeClearance))),note:'Measures compatibility with the outer sheath envelope. Rendering clips hidden steel; this is not a physical hollow-cavity simulation.'};
console.log(JSON.stringify(result,null,2));
