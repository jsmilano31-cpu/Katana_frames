import { sceneConfig } from './config';
import { clamp01 } from './motion';

export type ImpactMode='armed'|'playing'|'settled';

/** A landing completes independently of scroll; only a new forward crossing can trigger it. */
export class LandingImpact {
  mode:ImpactMode='armed';
  phase=0;
  count=0;
  private armed=true;
  private previous=0;
  private skipNext=false;

  prepareEntry(settled:boolean){this.skipNext=settled;}

  restore(progress:number){
    this.previous=clamp01(progress);this.skipNext=false;
    this.armed=progress<sceneConfig.effects.impact;
    this.mode=this.armed?'armed':'settled';this.phase=this.armed?0:1;
  }

  observe(progress:number,paused=false){
    const p=clamp01(progress),config=sceneConfig.effects;
    if(p<config.alignEnd){this.armed=true;this.mode='armed';this.phase=0;}
    else if(p<config.impact){this.mode='armed';this.phase=0;}
    else if(this.previous<config.impact&&this.armed){
      this.armed=false;
      if(paused||this.skipNext){this.mode='settled';this.phase=1;}
      else{this.mode='playing';this.phase=0;this.count++;}
      this.skipNext=false;
    }else if(this.mode==='armed'){this.mode='settled';this.phase=1;}
    this.previous=p;
  }

  advance(seconds:number){
    if(this.mode!=='playing')return;
    this.phase=clamp01(this.phase+Math.max(0,seconds)/sceneConfig.effects.impactSeconds);
    if(this.phase>=1-1e-9){this.phase=1;this.mode='settled';}
  }

  settle(){if(this.mode==='playing'){this.mode='settled';this.phase=1;}}
  snapshot(){return {mode:this.mode,phase:this.phase,count:this.count,armed:this.armed};}
}
