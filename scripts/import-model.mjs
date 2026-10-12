import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { unzipSync } from 'fflate';
import { inspectGlb, packGltf, safeResourceName } from './model-tools.mjs';

const input = process.argv[2];
if (!input) throw new Error('Usage: npm run assets:import -- "path/to/official-model.glb-or-zip"');
const filename = path.resolve(input);
const bytes = await readFile(filename);
let glb;
if (path.extname(filename).toLowerCase() === '.glb') {
  inspectGlb(bytes);
  glb = bytes;
} else if (path.extname(filename).toLowerCase() === '.zip') {
  const entries = unzipSync(bytes);
  const candidates = Object.keys(entries).filter(name => /\.(glb|gltf)$/i.test(name) && !name.startsWith('__MACOSX/'));
  const selected = candidates.find(name => /(^|\/)scene\.gltf$/i.test(name)) ?? candidates.find(name => /\.glb$/i.test(name)) ?? candidates[0];
  if (!selected) throw new Error('This archive contains no GLB/glTF. Choose the glTF download format on Sketchfab.');
  if (/\.glb$/i.test(selected)) {
    glb = Buffer.from(entries[selected]);
    inspectGlb(glb);
  } else {
    const model = JSON.parse(Buffer.from(entries[selected]).toString('utf8'));
    glb = await packGltf(model, async uri => {
      const name = safeResourceName(path.posix.dirname(selected), uri);
      if (!entries[name]) throw new Error(`Archive resource not found: ${name}`);
      return Buffer.from(entries[name]);
    });
  }
} else if (path.extname(filename).toLowerCase() === '.gltf') {
  glb = await packGltf(JSON.parse(bytes.toString('utf8')), uri => readFile(path.join(path.dirname(filename), safeResourceName('.', uri))));
} else {
  throw new Error('Use an official GLB, glTF, or glTF ZIP download.');
}
const destination = path.join(process.cwd(), 'public', 'assets', 'model');
await mkdir(destination, { recursive: true });
const manifest = JSON.parse(await readFile(path.join(destination, 'manifest.json'), 'utf8'));
await writeFile(path.join(destination, 'katana.glb'), glb);
manifest.status = 'ready';
manifest.importedAt = new Date().toISOString();
manifest.bytes = glb.length;
manifest.postersReady = false;
manifest.modifications = 'glTF resources embedded into GLB when needed; original geometry and PBR textures preserved. Runtime normalization and studio lighting applied.';
await writeFile(path.join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Imported ${manifest.name} by ${manifest.author}: ${(glb.length / 1024 / 1024).toFixed(2)} MB. Inspect every chapter before capturing posters.`);
