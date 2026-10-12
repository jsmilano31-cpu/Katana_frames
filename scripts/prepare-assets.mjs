import { mkdir, writeFile, readFile, cp } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const assets = path.join(root, 'public', 'assets');
await mkdir(path.join(assets, 'fonts'), { recursive: true });
const response = await fetch('https://api.sketchfab.com/v3/models/36e9ab64846246e8964a66b691e62f37');
if (!response.ok) throw new Error(`Model metadata request failed: ${response.status}`);
const model = await response.json();
const thumbnail = model.thumbnails.images.find(image => image.width === 1920) ?? model.thumbnails.images[0];
const poster = await fetch(thumbnail.url);
if (!poster.ok) throw new Error(`Preview request failed: ${poster.status}`);
await writeFile(path.join(assets, 'katana-preview.jpg'), Buffer.from(await poster.arrayBuffer()));
const css = await (await fetch('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&display=swap', {
  headers: { 'User-Agent': 'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36' },
})).text();
const latin = css.split('/* latin */').at(-1);
const fontUrl = latin?.match(/url\((https:[^)]+)\)/)?.[1];
if (!fontUrl) throw new Error('Could not resolve the display font.');
const font = await fetch(fontUrl);
if (!font.ok) throw new Error(`Font request failed: ${font.status}`);
await writeFile(path.join(assets, 'fonts', 'cormorant-latin.woff2'), Buffer.from(await font.arrayBuffer()));
const fontLicense = await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/OFL.txt');
if (!fontLicense.ok) throw new Error('Could not retrieve the font license.');
await writeFile(path.join(assets, 'fonts', 'OFL.txt'), await fontLicense.text());
for (const library of ['draco/gltf', 'basis']) {
  const destination = library.startsWith('draco') ? 'draco' : 'basis';
  await cp(path.join(root, 'node_modules', 'three', 'examples', 'jsm', 'libs', library), path.join(assets, 'decoders', destination), { recursive: true });
}
const manifest = JSON.parse(await readFile(path.join(assets, 'model', 'manifest.json'), 'utf8'));
manifest.preview = { source: thumbnail.url, credit: 'Preview render from the creator’s Sketchfab model page. Cropped for presentation.' };
await writeFile(path.join(assets, 'model', 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('Creator preview, licensed local font, and local glTF decoders prepared.');
