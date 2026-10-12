import { readFile, access } from 'node:fs/promises';
import { inspectGlb } from './model-tools.mjs';

const root = new URL('../public/assets/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('model/manifest.json', root), 'utf8'));
await access(new URL('katana-preview.jpg', root));
await access(new URL('fonts/cormorant-latin.woff2', root));
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
