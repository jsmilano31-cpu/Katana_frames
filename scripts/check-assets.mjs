import { readFile, access } from 'node:fs/promises';
import { inspectGlb } from './model-tools.mjs';

const root = new URL('../public/assets/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('model/manifest.json', root), 'utf8'));
await access(new URL('katana-preview.jpg', root));
await access(new URL('fonts/cormorant-latin.woff2', root));
for(const [name,width,height] of [['ink-dragon.png',1024,1536],['ink-dragon-mobile.png',512,768]]){
  const image=await readFile(new URL(`dragon/${name}`,root));
  if(image.readUInt32BE(16)!==width||image.readUInt32BE(20)!==height||image[25]!==6)throw new Error(`Dragon artwork must preserve RGBA dimensions: ${name}`);
}
console.log('Local desktop and mobile dragon artwork verified with transparency.');
if (manifest.status !== 'ready') {
  console.error('INCOMPLETE: the selected official katana model has not been imported.');
  process.exitCode = 1;
} else {
  const gltf = inspectGlb(await readFile(new URL('model/katana.glb', root)));
  console.log(`Model verified: ${gltf.meshes.length} mesh(es), ${gltf.materials?.length ?? 0} material(s).`);
  if (!manifest.postersReady) {
    console.error('INCOMPLETE: render chapter fallback posters with npm run assets:posters.');
    process.exitCode = 1;
  } else {
    for (let chapter = 0; chapter < 6; chapter++) {
      await access(new URL(`posters/chapter-${chapter}.png`, root));
      await access(new URL(`posters/chapter-${chapter}-mobile.png`, root));
    }
    console.log('All desktop and portrait chapter posters are present.');
  }
}
