import path from 'node:path';

export function inspectGlb(data) {
  const buffer = Buffer.from(data);
  if (buffer.length < 20 || buffer.readUInt32LE(0) !== 0x46546c67 || buffer.readUInt32LE(4) !== 2) throw new Error('Expected a valid glTF 2.0 GLB.');
  if (buffer.readUInt32LE(8) !== buffer.length) throw new Error('GLB length does not match its header.');
  const length = buffer.readUInt32LE(12);
  if (buffer.readUInt32LE(16) !== 0x4e4f534a || 20 + length > buffer.length) throw new Error('GLB JSON chunk is missing or truncated.');
  const json = JSON.parse(buffer.subarray(20, 20 + length).toString('utf8').trim());
  if (!json.meshes?.length) throw new Error('The model contains no meshes.');
  for (const entry of [...(json.buffers ?? []), ...(json.images ?? [])]) {
    if (entry.uri && !entry.uri.startsWith('data:')) throw new Error('GLB still references an external file. Import a glTF archive to pack its resources.');
  }
  return json;
}

export function safeResourceName(base, uri) {
  if (/^[a-z][a-z\d+.-]*:/i.test(uri) || uri.startsWith('/') || uri.includes('\\')) throw new Error(`Only local glTF resources are supported: ${uri}`);
  const name = path.posix.normalize(path.posix.join(base, decodeURIComponent(uri)));
  if (name === '..' || name.startsWith('../')) throw new Error('A model resource escapes the asset directory.');
  return name;
}

export async function packGltf(json, readResource) {
  const model = structuredClone(json);
  const chunks = [];
  let size = 0;
  const append = data => {
    const buffer = Buffer.from(data);
    const offset = size;
    chunks.push(buffer);
    const padding = (4 - buffer.length % 4) % 4;
    if (padding) chunks.push(Buffer.alloc(padding));
    size += buffer.length + padding;
    return { offset, length: buffer.length };
  };
  const read = async uri => {
    if (uri.startsWith('data:')) {
      const match = uri.match(/^data:([^;,]*)(;base64)?,([\s\S]*)$/);
      if (!match) throw new Error('Malformed resource data URI.');
      return Buffer.from(match[2] ? match[3] : decodeURIComponent(match[3]), match[2] ? 'base64' : 'utf8');
    }
    return readResource(uri);
  };
  const offsets = [];
  for (const buffer of model.buffers ?? []) {
    if (!buffer.uri) throw new Error('A .gltf buffer must have a local resource URI.');
    const data = await read(buffer.uri);
    if (data.length < buffer.byteLength) throw new Error(`Truncated glTF buffer: ${buffer.uri}`);
    offsets.push(append(data).offset);
  }
  for (const view of model.bufferViews ?? []) {
    view.byteOffset = (view.byteOffset ?? 0) + offsets[view.buffer];
    view.buffer = 0;
    for (const key of ['EXT_meshopt_compression', 'KHR_meshopt_compression']) {
      const extension = view.extensions?.[key];
      if (extension) {
        extension.byteOffset = (extension.byteOffset ?? 0) + offsets[extension.buffer];
        extension.buffer = 0;
      }
    }
  }
  model.bufferViews ??= [];
  const mimeTypes = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ktx2': 'image/ktx2', '.avif': 'image/avif' };
  for (const image of model.images ?? []) {
    if (!image.uri) continue;
    const data = await read(image.uri);
    const chunk = append(data);
    image.bufferView = model.bufferViews.length;
    image.mimeType ??= image.uri.startsWith('data:') ? image.uri.match(/^data:([^;,]+)/)?.[1] : mimeTypes[path.extname(image.uri).toLowerCase()];
    if (!image.mimeType) throw new Error(`Unknown image format: ${image.uri}`);
    model.bufferViews.push({ buffer: 0, byteOffset: chunk.offset, byteLength: chunk.length });
    delete image.uri;
  }
  model.buffers = [{ byteLength: size }];
  const rawJson = Buffer.from(JSON.stringify(model));
  const jsonChunk = Buffer.concat([rawJson, Buffer.alloc((4 - rawJson.length % 4) % 4, 0x20)]);
  const binary = Buffer.concat(chunks);
  const header = Buffer.alloc(20);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + jsonChunk.length + binary.length, 8);
  header.writeUInt32LE(jsonChunk.length, 12);
  header.writeUInt32LE(0x4e4f534a, 16);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binary.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  const glb = Buffer.concat([header, jsonChunk, binHeader, binary]);
  inspectGlb(glb);
  return glb;
}
