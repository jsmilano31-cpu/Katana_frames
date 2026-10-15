import {AdditiveBlending,Group,Mesh,PerspectiveCamera,PlaneGeometry,ShaderMaterial,SRGBColorSpace,Texture,TextureLoader,Vector2,Vector3} from 'three';
import {sceneConfig} from './config';
import {clamp01,ease} from './motion';

/** Measured exposed steel, rather than elapsed scroll, awakens the spirit. */
export function sampleDragon(progress:number,exposedFraction:number){
  const c=sceneConfig.dragon;
  const extraction=progress<=sceneConfig.motion.drawStart?0:clamp01((exposedFraction-c.exposureOffset)/(1-c.exposureOffset));
  const dissolve=ease((progress-c.holdEnd)/(c.end-c.holdEnd)),remaining=1-dissolve;
  const contours=ease(extraction/c.firstContours);
  const head=ease((extraction-c.firstContours)/(c.bodyReady-c.firstContours));
  const opening=ease((extraction-c.bodyReady)/(c.eyeReady-c.bodyReady));
  return{extraction,reveal:ease(extraction/c.bodyReady),body:contours*(.18+.82*head)*remaining,
    head:head*remaining,eye:opening*remaining,opening,sun:contours*(.12+.88*head)*remaining,dissolve};
}

const vertexShader='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
const noise=`
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
  float inkNoise(vec2 p){return noise(p)*.57+noise(p*2.1)*.28+noise(p*4.3)*.15;}
`;
const uniforms=`uniform float uOpacity,uDissolve,uOpening,uReveal;uniform vec2 uEye,uEyeSize;varying vec2 vUv;`;
const erosion=`float grain=inkNoise(vUv*12.0);float erosion=1.0-smoothstep(grain*.6,grain*.6+.4,uDissolve);`;

/** Cohesive painted body, distressed sun, and precisely registered eye; depth-tested behind steel. */
export class DragonSpirit {
  readonly root=new Group();
  private layers:Mesh<PlaneGeometry,ShaderMaterial>[]=[];
  private texture:Texture|null=null;
  private state=sampleDragon(0,0);
  private loaded=false;
  private failed=false;
  private disposed=false;
  async load(){
    try{
      const c=sceneConfig.dragon;
      const texture=await new TextureLoader().loadAsync(innerWidth<sceneConfig.breakpoint?c.mobileTexture:c.texture);
      if(this.disposed){texture.dispose();return;}
      texture.colorSpace=SRGBColorSpace;this.texture=texture;
      const fragments=[
        `${uniforms}uniform vec2 uSun;uniform float uRadius;${noise}
          void main(){vec2 p=(vUv-uSun)*vec2(1.0,1.5);float n=inkNoise(vUv*18.0);
            float edge=1.0-smoothstep(uRadius-.045,uRadius+.025,length(p)+(n-.5)*.065);
            float pigment=.58+.42*inkNoise(vUv*8.0);
            float dryBrush=smoothstep(.12,.32,inkNoise(vUv*80.0));${erosion}
            float a=edge*pigment*dryBrush*uOpacity*erosion;if(a<.001)discard;
            gl_FragColor=vec4(mix(vec3(.28,.035,.025),vec3(.72,.105,.065),pigment),a);}`,
        `${uniforms}uniform sampler2D uMap;${noise}
          void main(){vec4 art=texture2D(uMap,vUv);float grain=inkNoise(vUv*12.0);
            float front=.94-uReveal*1.22;
            float inkReveal=smoothstep(front-.13,front+.13,vUv.y+(grain-.5)*.13);
            float erosion=1.0-smoothstep(grain*.6,grain*.6+.4,uDissolve);
            float eyeMask=exp(-dot((vUv-uEye)/uEyeSize,(vUv-uEye)/uEyeSize));
            art.rgb*=1.0-eyeMask*(1.0-uOpening)*.9;
            float tail=smoothstep(.015,.2,vUv.y);
            float a=art.a*uOpacity*inkReveal*erosion*tail;if(a<.001)discard;
            gl_FragColor=vec4(art.rgb*vec3(.87,.95,.96),a);}`,
        `${uniforms}${noise}
          void main(){vec2 d=(vUv-uEye)/uEyeSize;d.y/=max(.035,uOpening);
            float iris=exp(-dot(d,d)*1.8);float pupil=1.0-exp(-d.x*d.x*140.0);
            vec2 halo=(vUv-uEye)/(uEyeSize*vec2(2.8,3.5));
            float glow=exp(-dot(halo,halo)*2.0)*.15;${erosion}
            float a=(iris*(.35+.65*pupil)+glow)*uOpacity*erosion;if(a<.001)discard;
            gl_FragColor=vec4(vec3(.58,.94,.86),a);}`
      ];
      fragments.forEach((fragmentShader,index)=>{
        const material=new ShaderMaterial({vertexShader,fragmentShader,uniforms:{uMap:{value:texture},uOpacity:{value:0},
          uDissolve:{value:0},uOpening:{value:0},uReveal:{value:0},uEye:{value:new Vector2(...c.eyeUV)},
          uEyeSize:{value:new Vector2(...c.eyeSize)},uSun:{value:new Vector2(...c.sunUV)},uRadius:{value:c.sunRadius}},
          transparent:true,depthWrite:false,depthTest:true,toneMapped:false});
        if(index===2)material.blending=AdditiveBlending;
        const mesh=new Mesh(new PlaneGeometry(1,1),material);
        mesh.name=['Dragon vermilion ink sun','Painted dragon spirit','Dragon awakening eye'][index];
        mesh.renderOrder=-30+index;this.layers.push(mesh);this.root.add(mesh);
      });
      this.loaded=true;
    }catch{
      // The dragon is decorative: a missing illustration never blocks the real model.
      this.failed=true;this.root.visible=false;
    }
  }
  setProgress(progress:number,exposedFraction:number){
    this.state=sampleDragon(progress,exposedFraction);
    this.root.visible=this.loaded&&Math.max(this.state.body,this.state.sun)>.001;
  }
  update(camera:PerspectiveCamera,_time:number){
    if(!this.root.visible)return;
    const c=sceneConfig.dragon,mobile=innerWidth<sceneConfig.breakpoint;
    const frame=innerWidth>innerHeight&&innerHeight<500?c.landscape:mobile?(innerHeight<700?c.compact:c.mobile):c.desktop;
    const forward=camera.getWorldDirection(new Vector3()),right=new Vector3(1,0,0).applyQuaternion(camera.quaternion),up=new Vector3(0,1,0).applyQuaternion(camera.quaternion);
    const depth=Math.max(c.depth,camera.position.length()+10);
    const h=2*depth*Math.tan(camera.fov*Math.PI/360),w=h*camera.aspect;
    const height=h*frame.height,width=height*2/3;
    this.layers.forEach((mesh,index)=>{
      mesh.position.copy(camera.position).addScaledVector(forward,depth+(index===0?.12:index===2?-.02:0))
        .addScaledVector(right,w*frame.x).addScaledVector(up,h*frame.y);
      mesh.quaternion.copy(camera.quaternion);mesh.scale.set(width,height,1);
      mesh.material.uniforms.uOpacity.value=[this.state.sun*c.sunOpacity,this.state.body*c.bodyOpacity,this.state.eye*c.eyeIntensity][index];
      mesh.material.uniforms.uDissolve.value=this.state.dissolve;
      mesh.material.uniforms.uOpening.value=this.state.opening;
      mesh.material.uniforms.uReveal.value=this.state.reveal;
    });
  }
  diagnostics(){return{...this.state,visible:this.root.visible,loaded:this.loaded,failed:this.failed};}
  dispose(){this.disposed=true;this.layers.forEach(mesh=>{mesh.geometry.dispose();mesh.material.dispose();});this.texture?.dispose();this.root.removeFromParent();}
}
