import {sceneConfig} from './config';
import {clamp01,ease} from './motion';

export const leafSeed=(n:number)=>{const x=Math.sin(n*127.1+83.7)*43758.5453;return x-Math.floor(x);};
export interface FallenLeaf {id:number;x:number;z:number;angle:number;size:number;tint:number}
export interface AirborneLeaf extends FallenLeaf {birth:number;duration:number;height:number}
export interface LeafPose {x:number;y:number;z:number;rx:number;ry:number;rz:number;size:number}

/** Seeded event clock; retained geometry is bounded and older marks are handed to the carpet. */
export class LeafSimulation {
  time=0;
  airborne:AirborneLeaf[]=[];
  landed:FallenLeaf[]=[];
  baked=0;
  spawned=0;
  mobile=false;
  private nextSpawn=0;
  constructor(private bake:(leaf:FallenLeaf)=>void=()=>{}){}
  setMobile(mobile:boolean){
    if(this.mobile===mobile)return;
    this.mobile=mobile;this.nextSpawn=this.time+1/this.rate;
    this.trim();
  }
  get rate(){return this.mobile?sceneConfig.leafFall.mobileRate:sceneConfig.leafFall.desktopRate;}
  get airborneLimit(){return this.mobile?sceneConfig.leafFall.mobileAirborne:sceneConfig.leafFall.desktopAirborne;}
  get landedLimit(){return this.mobile?sceneConfig.leafFall.mobileLanded:sceneConfig.leafFall.desktopLanded;}
  private trim(){while(this.landed.length>this.landedLimit){this.bake(this.landed.shift()!);this.baked++;}}
  reset(){this.time=0;this.airborne=[];this.landed=[];this.baked=0;this.spawned=0;this.nextSpawn=0;}
  advance(seconds:number){
    if(!Number.isFinite(seconds)||seconds<=0)return;
    const c=sceneConfig.leafFall,end=this.time+seconds;
    while(this.time<end-1e-8){
      this.time=Math.min(end,this.time+.125);
      for(let i=this.airborne.length-1;i>=0;i--){
        const leaf=this.airborne[i];
        if(this.time-leaf.birth>=leaf.duration+c.settlingSeconds){
          this.landed.push(leaf);this.airborne.splice(i,1);
        }
      }
      this.trim();
      while(this.nextSpawn<=this.time+1e-9){
        if(this.airborne.length<this.airborneLimit){
          const id=++this.spawned,a=leafSeed(id)*Math.PI*2;
          const r=c.innerRadius+.8+leafSeed(id+100)**.6*(c.outerRadius-c.innerRadius-1.6);
          this.airborne.push({id,birth:this.nextSpawn,duration:c.minimumDuration+leafSeed(id+200)*c.durationRange,
            height:c.height+leafSeed(id+300)*3,x:Math.cos(a)*r,z:Math.sin(a)*r,
            angle:leafSeed(id+400)*Math.PI*2,size:.27+leafSeed(id+500)*.27,tint:leafSeed(id+600)});
        }
        this.nextSpawn+=1/this.rate;
      }
    }
  }
  pose(leaf:AirborneLeaf):LeafPose {
    const age=Math.max(0,this.time-leaf.birth),t=clamp01(age/leaf.duration),c=sceneConfig.leafFall;
    const settling=ease((age-leaf.duration)/c.settlingSeconds),moving=1-ease((t-.82)/.18);
    const flutter=Math.sin(age*2.3+leaf.id)*.48;
    let x=leaf.x+moving*(Math.sin(age*.72+leaf.id)-Math.sin(leaf.id))*c.drift;
    let z=leaf.z+moving*Math.sin(age*.57+leaf.id*.4)*c.drift*.65;
    const radius=Math.hypot(x,z),bounded=Math.max(c.innerRadius+.1,Math.min(c.outerRadius-.1,radius));
    x*=bounded/radius;z*=bounded/radius;
    return{x,
      y:Math.max(0,leaf.height*(1-t))+.026+(1-settling)*.015,
      z,
      rx:-Math.PI/2+(1-settling)*(flutter+.75),ry:(1-settling)*age*.42,
      rz:leaf.angle+(1-settling)*Math.sin(age*.8)*.55,size:leaf.size};
  }
  diagnostics(){return{time:this.time,airborne:this.airborne.length,landed:this.landed.length,baked:this.baked,spawned:this.spawned,airborneLimit:this.airborneLimit,landedLimit:this.landedLimit};}
}
