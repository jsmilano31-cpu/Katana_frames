import { describe, expect, it } from 'vitest';
import { inspectGlb, packGltf, safeResourceName } from '../scripts/model-tools.mjs';
import { testGlb } from './fixture';

describe('official asset packing', () => {
  it('preserves a valid self-contained GLB and rejects truncated downloads', () => {
    const glb = testGlb();
    expect(inspectGlb(glb).meshes.length).toBe(1);
    expect(() => inspectGlb(glb.subarray(0, glb.length - 1))).toThrow(/length/);
  });

  it('packs multiple buffers and an image with aligned offsets and no external URLs', async () => {
    const glb = await packGltf({
      asset: { version: '2.0' }, meshes: [{ primitives: [] }],
      buffers: [{ uri: 'first.bin', byteLength: 3 }, { uri: 'second.bin', byteLength: 4 }],
      bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 3 }, { buffer: 1, byteOffset: 1, byteLength: 3 }],
      images: [{ uri: 'texture.png' }],
    }, async uri => ({ 'first.bin': Buffer.from([1, 2, 3]), 'second.bin': Buffer.from([4, 5, 6, 7]), 'texture.png': Buffer.from([8, 9, 10]) })[uri]);
    const model = inspectGlb(glb);
    expect(model.buffers).toEqual([{ byteLength: 12 }]);
    expect(model.bufferViews[1]).toEqual({ buffer: 0, byteOffset: 5, byteLength: 3 });
    expect(model.images[0]).toEqual({ bufferView: 2, mimeType: 'image/png' });
    expect(model.bufferViews[2].byteOffset % 4).toBe(0);
  });

  it('permits archive-relative textures while rejecting escaping paths and remote resources', () => {
    expect(safeResourceName('model', '../textures/blade.png')).toBe('textures/blade.png');
    expect(() => safeResourceName('.', '../secrets.txt')).toThrow(/escapes/);
    expect(() => safeResourceName('.', 'https://example.com/model.bin')).toThrow(/local/);
    expect(() => safeResourceName('.', '%2e%2e/secrets.txt')).toThrow(/escapes/);
  });
});
