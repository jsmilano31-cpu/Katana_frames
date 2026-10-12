import { Group, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace, TextureLoader } from 'three';
import { sceneConfig } from './config';

// Original layered brush silhouettes, rasterized by the browser into transparent textures.
// Three depth planes create real perspective changes during the camera sweep.
const shapes = [
  'M-80 420Q40 290 160 350Q130 225 275 240Q310 125 420 205Q495 120 575 230Q690 145 740 300Q880 240 990 360L1050 570H-80Z',
  'M-80 450Q95 290 175 330Q225 200 350 310Q370 180 485 245Q535 170 600 300Q720 255 800 335Q870 260 1050 400L1050 570H-80Z',
  'M-80 480Q80 340 205 420Q250 310 340 390Q475 290 540 400Q670 355 765 415Q890 350 1050 480L1050 570H-80Z',
];
export async function createInk(): Promise<Group> {
  const group = new Group(); group.name = 'Original ink clouds';
  const loader = new TextureLoader();
  for (let i = 0; i < shapes.length; i++) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="550" viewBox="0 0 1000 550"><defs><filter id="edge"><feTurbulence type="fractalNoise" baseFrequency=".018 .065" numOctaves="3" seed="${i+7}" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="32"/></filter><linearGradient id="wash" x1="0%" y1="0%" x2="0%" y2="100%"><stop stop-color="#ad6549" stop-opacity=".72"/><stop offset=".45" stop-color="#6c685a" stop-opacity=".55"/><stop offset="1" stop-color="#252b25" stop-opacity="0"/></linearGradient><linearGradient id="fade" x2="0%" y2="100%"><stop stop-color="white"/><stop offset=".6" stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient><linearGradient id="sides"><stop stop-color="black"/><stop offset=".12" stop-color="white"/><stop offset=".88" stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient><mask id="bottom"><rect width="1000" height="550" fill="url(#fade)"/></mask><mask id="edges"><rect width="1000" height="550" fill="url(#sides)"/></mask></defs><g mask="url(#edges)"><g mask="url(#bottom)"><path d="${shapes[i]}" fill="url(#wash)" filter="url(#edge)"/><path d="${shapes[(i+1)%3]}" fill="#8c8f7a" opacity=".18" transform="translate(70 45) scale(.9)" filter="url(#edge)"/></g></g></svg>`;
    const texture = await loader.loadAsync(`data:image/svg+xml,${encodeURIComponent(svg)}`);
    texture.colorSpace = SRGBColorSpace;
    const material = new MeshBasicMaterial({map:texture,transparent:true,opacity:0,depthWrite:false,toneMapped:false});
    const plane = new Mesh(new PlaneGeometry(1,1),material);
    const layer=sceneConfig.artwork.layers[i];
    plane.position.set(layer.x,layer.y,layer.z);
    plane.scale.set(layer.width,layer.height,1);
    plane.rotation.z=layer.angle;
    plane.userData.layer=i; group.add(plane);
  }
  return group;
}
