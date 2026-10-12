import { BoxGeometry, type BufferAttribute } from 'three';

// Generated in test memory and intercepted by Playwright. Never shipped as the katana.
export function testGlb(): Buffer {
  const geometry = new BoxGeometry(4, 0.15, 0.08);
  const chunks: Buffer[] = [];
  const views: { buffer: number; byteOffset: number; byteLength: number; target: number }[] = [];
  let offset = 0;
  const push = (array: ArrayBufferView, target: number) => {
    const buffer = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
    const index = views.length;
    views.push({ buffer: 0, byteOffset: offset, byteLength: buffer.length, target });
    chunks.push(buffer);
    const padding = (4 - buffer.length % 4) % 4;
    if (padding) chunks.push(Buffer.alloc(padding));
    offset += buffer.length + padding;
    return index;
  };
  const position = geometry.getAttribute('position') as BufferAttribute;
  const normal = geometry.getAttribute('normal') as BufferAttribute;
  const index = geometry.getIndex()!;
  const json = {
    asset: { version: '2.0', generator: 'Test-only WebGL fixture' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0 }] }],
    materials: [{ pbrMetallicRoughness: { baseColorFactor: [0.7, 0.7, 0.65, 1], metallicFactor: 0.8, roughnessFactor: 0.3 } }],
    accessors: [
      { bufferView: push(position.array, 34962), componentType: 5126, count: position.count, type: 'VEC3', min: [-2, -0.075, -0.04], max: [2, 0.075, 0.04] },
      { bufferView: push(normal.array, 34962), componentType: 5126, count: normal.count, type: 'VEC3' },
      { bufferView: push(index.array, 34963), componentType: 5123, count: index.count, type: 'SCALAR' },
    ],
    bufferViews: views, buffers: [{ byteLength: offset }],
  };
  const encoded = Buffer.from(JSON.stringify(json));
  const jsonChunk = Buffer.concat([encoded, Buffer.alloc((4 - encoded.length % 4) % 4, 32)]);
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
  geometry.dispose();
  return Buffer.concat([header, jsonChunk, binHeader, binary]);
}
