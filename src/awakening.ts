import { DoubleSide, ShaderMaterial, type Plane } from 'three';

/** A separate surface layer: the licensed PBR material is never repainted. */
export function awakeningMaterial(clippingPlane:Plane,minX:number,maxX:number){
  return new ShaderMaterial({
    uniforms:{uPulse:{value:0},uStrength:{value:0},uAura:{value:0},uMin:{value:minX},uRange:{value:maxX-minX}},
    vertexShader:`
      #include <common>
      #include <clipping_planes_pars_vertex>
      varying float vBlade;
      varying vec3 vNormal;
      varying vec3 vView;
      uniform float uMin;
      uniform float uRange;
      void main(){
        vBlade=(position.x-uMin)/uRange;
        vNormal=normalize(normalMatrix*normal);
        vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
        vView=-mvPosition.xyz;
        gl_Position=projectionMatrix*mvPosition;
        #include <clipping_planes_vertex>
      }`,
    fragmentShader:`
      #include <common>
      #include <clipping_planes_pars_fragment>
      varying float vBlade;
      varying vec3 vNormal;
      varying vec3 vView;
      uniform float uPulse;
      uniform float uStrength;
      uniform float uAura;
      void main(){
        #include <clipping_planes_fragment>
        float band=exp(-pow((vBlade-uPulse)/.038,2.0))*uStrength;
        float edge=pow(1.0-abs(dot(normalize(vNormal),normalize(vView))),2.0);
        float alpha=band*.5+edge*uAura;
        gl_FragColor=vec4(mix(vec3(.13,.68,.6),vec3(.65,.98,.91),band),alpha);
      }`,
    clipping:true,clippingPlanes:[clippingPlane],transparent:true,depthWrite:false,
    side:DoubleSide,forceSinglePass:true,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,
    toneMapped:false,
  });
}
