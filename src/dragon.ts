import {AdditiveBlending,Group,Mesh,PerspectiveCamera,PlaneGeometry,ShaderMaterial,SRGBColorSpace,Texture,TextureLoader,Vector3} from 'three';
import {sceneConfig} from './config';
import {ease} from './motion';

export function sampleDragon(progress:number){
  const c=sceneConfig.dragon,body=ease((progress-c.start)/(c.bodyReady-c.start));
  const head=ease((progress-.22)/.1),eye=ease((progress-c.bodyReady)/(c.eyeReady-c.bodyReady));
  const dissolve=ease((progress-c.peak)/(c.end-c.peak));
  return{body:body*(1-dissolve),head:head*(1-dissolve),eye:eye*(1-dissolve),opening:eye,dissolve};
}

const body=`<path d="M1058 329 C938 343 863 433 904 518 C952 618 1197 491 1251 614 C1302 730 1105 854 938 798 C794 749 847 624 700 625 C541 627 563 807 398 831 C508 762 445 610 576 548 C766 459 807 714 967 701 C1115 690 1152 627 1058 624 C904 633 777 570 803 441 C824 340 928 290 1058 329Z" fill="url(#skin)" stroke="#76aaa4" stroke-width="3"/>
<path d="M1060 349 C899 390 839 486 940 548 C1049 615 1268 524 1211 666 C1165 778 926 811 876 682 C825 554 658 513 579 624 C537 682 512 773 439 810" fill="none" stroke="#9bcbc1" stroke-opacity=".3" stroke-width="13"/>
<path d="M967 343l-28-40-6 52-39-28 9 47-44-17 22 47-44-2 31 35-45 22 42 17-35 29 47 5-20 38 46-9 4 39 41-20 11 39 32-25 20 35 28-31 24 29 20-32 29 22 14-30 28 23 9-27 32 20-8-34 35 6-27-34 34-5-36-22 16-23" fill="#507f79" opacity=".56"/>
<path d="M873 634l-48-14-31 24 18 17-44 25 17 13 42-12-22 37 19 8 32-40 18-11 13-34M1111 733l39 22 13 29-17 13 33 21-15 13-28-12 9 27-21-2-18-41-28-26" fill="#294f4d" stroke="#82b5a9" stroke-opacity=".45" stroke-width="3"/>`;
const head=`<path d="M1022 338 Q987 306 1003 260 L1041 217 1090 208 1126 229 1171 244 1213 276 1198 298 1155 302 1120 329 1084 343Z" fill="url(#skin)" stroke="#89b5a8" stroke-width="3"/>
<path d="M1032 244 Q990 202 1010 130 Q1022 197 1062 218 L1093 204 Q1096 168 1145 130 Q1113 180 1124 230" fill="#305a54" stroke="#8fb9ac" stroke-width="4"/>
<path d="M1009 275l-55-49 22 54-46-7 43 34-38 18 55 13 20 28 20-31M1098 230l-26-39 45 25 23-30 1 45 28-8-11 26" fill="#5d9285" opacity=".8"/>
<path d="M1063 270 Q1094 258 1120 273 L1111 291 1074 288Z" fill="#071719"/>
<path d="M1151 276 Q1181 265 1202 281 M1128 310 Q1165 322 1193 298" fill="none" stroke="#a2c2b1" stroke-width="4"/>
<path d="M1157 309l-7 18-7-13-17 21-1-17" fill="#9fb6a5"/>
<path d="M1171 290 Q1295 229 1344 305 Q1287 273 1200 305 M1146 312 Q1251 379 1307 324 Q1285 391 1181 354 M1030 305 Q936 272 915 212" fill="none" stroke="#95c6b5" stroke-width="3" stroke-linecap="round"/>
<path d="M1025 250 Q1042 227 1068 229 M1014 291 Q1034 304 1052 301 M1050 326l24-16" fill="none" stroke="#a2c9b8" stroke-opacity=".38" stroke-width="3"/>`;
const eye=`<ellipse cx="1090" cy="278" rx="68" ry="38" fill="url(#glow)"/>
<path d="M1062 273 Q1090 266 1117 276 Q1094 289 1071 281Z" fill="#acf9e2"/>
<path d="M1091 270l-3 13 6-1 2-10Z" fill="#052020"/>
<path d="M1057 267 Q1092 256 1122 270" fill="none" stroke="#77dec5" stroke-width="3"/>`;
const mist=`<path d="M450 733 Q711 811 1004 742 T1362 663 M634 504 Q797 449 963 477 T1315 455 M878 326 Q1080 158 1344 215" fill="none" stroke="#81c8be" stroke-width="26" stroke-opacity=".13" filter="url(#blur)"/>`;
function svg(content:string){return `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="0 0 1400 900"><defs>
<linearGradient id="skin" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#102c30"/><stop offset=".6" stop-color="#254f50"/><stop offset="1" stop-color="#396962"/></linearGradient>
<radialGradient id="glow"><stop stop-color="#75f9d5" stop-opacity=".9"/><stop offset="1" stop-color="#5bf3d1" stop-opacity="0"/></radialGradient>
<filter id="blur"><feGaussianBlur stdDeviation="12"/></filter>
<filter id="ink"><feTurbulence type="fractalNoise" baseFrequency=".032" numOctaves="2" seed="14" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3"/></filter></defs><g filter="url(#ink)">${content}</g></svg>`;}

/** Original ink spirit on depth-tested background layers; all awakening timing is scroll sampled. */
export class DragonSpirit {
  readonly root=new Group();
  private layers:Mesh<PlaneGeometry,ShaderMaterial>[]=[];
  private textures:Texture[]=[];
  private state=sampleDragon(0);
  async load(){
    const loader=new TextureLoader();
    for(const [index,art] of [body,head,eye,mist].entries()){
      const texture=await loader.loadAsync(`data:image/svg+xml,${encodeURIComponent(svg(art))}`);texture.colorSpace=SRGBColorSpace;this.textures.push(texture);
      const material=new ShaderMaterial({uniforms:{uMap:{value:texture},uOpacity:{value:0},uDissolve:{value:0},uOpening:{value:0}},
        vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
        fragmentShader:`uniform sampler2D uMap;uniform float uOpacity;uniform float uDissolve;uniform float uOpening;varying vec2 vUv;
          float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
          void main(){vec2 sampleUv=vUv;${index===2?'sampleUv.y=.6911+(vUv.y-.6911)/max(.08,uOpening);':''}
            vec4 ink=texture2D(uMap,sampleUv);float grain=hash(floor(vUv*vec2(155.0,100.0)));
            float erosion=1.0-smoothstep(grain*.7,grain*.7+.3,uDissolve);
            ${index===2?'ink.a*=smoothstep(0.0,.2,uOpening);':''}
            float a=ink.a*uOpacity*erosion;if(a<.001)discard;gl_FragColor=vec4(ink.rgb,a);}`,
        transparent:true,depthWrite:false,depthTest:true,toneMapped:false});
      if(index===2)material.blending=AdditiveBlending;
      const mesh=new Mesh(new PlaneGeometry(1,1),material);mesh.name=['Dragon coiled body','Dragon horned head','Dragon fierce eye','Dragon ink mist'][index];
      this.layers.push(mesh);this.root.add(mesh);
    }
  }
  setProgress(progress:number){this.state=sampleDragon(progress);this.root.visible=this.state.body>.001;}
  update(camera:PerspectiveCamera,time:number){
    if(!this.root.visible)return;
    const c=sceneConfig.dragon,mobile=innerWidth<sceneConfig.breakpoint,frame=mobile?c.mobile:c.desktop;
    const forward=camera.getWorldDirection(new Vector3()),right=new Vector3(1,0,0).applyQuaternion(camera.quaternion),up=new Vector3(0,1,0).applyQuaternion(camera.quaternion);
    const depth=Math.max(c.depth,camera.position.length()+10);
    const h=2*depth*Math.tan(camera.fov*Math.PI/360),w=h*camera.aspect,width=mobile?w*frame.width:Math.min(w*frame.width,h*1.48);
    this.layers.forEach((mesh,i)=>{
      mesh.position.copy(camera.position).addScaledVector(forward,depth-i*.05).addScaledVector(right,w*frame.x).addScaledVector(up,h*frame.y);
      if(i===3)mesh.position.addScaledVector(right,Math.sin(time*.12)*.07);
      mesh.quaternion.copy(camera.quaternion);mesh.scale.set(width,width*900/1400,1);
      const opacity=[this.state.body*c.bodyOpacity,this.state.head*c.headOpacity,this.state.eye*c.eyeIntensity,this.state.body*.5][i];
      mesh.material.uniforms.uOpacity.value=opacity;
      mesh.material.uniforms.uDissolve.value=this.state.dissolve;
      mesh.material.uniforms.uOpening.value=this.state.opening;
    });
  }
  diagnostics(){return{...this.state,visible:this.root.visible};}
  dispose(){this.layers.forEach(mesh=>{mesh.geometry.dispose();mesh.material.dispose();});this.textures.forEach(t=>t.dispose());this.root.removeFromParent();}
}
