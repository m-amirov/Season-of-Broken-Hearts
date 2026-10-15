import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

function pngInfo(relativePath) {
  const file = path.join(root, relativePath);
  const bytes = fs.readFileSync(file);
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(bytes.toString('ascii', 12, 16), 'IHDR');
  return {
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20)
  };
}

test('Stage 9.4 EP2 scene IDs map to admitted dual-format runtime paths', () => {
  const graph = read('narrative/graph.json');
  const manifest = read('narrative/assets.json');
  const expected = {
    ep2_morning_brief: 'ep2-morning-brief-cg',
    ep2_wedding_budget: 'ep2-wedding-budget-cg',
    ep2_workday_inventory: 'ep2-workday-inventory-cg'
  };

  for (const [sceneId, assetId] of Object.entries(expected)) {
    const scene = graph.scenes.find(value => value.id === sceneId);
    assert.ok(scene, `missing authored scene ${sceneId}`);
    assert.equal(scene.assetId, assetId);
    const asset = manifest.assets[assetId];
    assert.equal(asset.kind, 'production-cg');
    assert.notEqual(asset.variants.portrait.src, asset.variants.landscape.src);
    for (const format of ['portrait', 'landscape']) {
      const descriptor = asset.variants[format];
      const relativePath = descriptor.src.replace(/^\//, '');
      const actual = pngInfo(relativePath);
      assert.deepEqual(actual, {
        sha256: descriptor.sha256,
        width: descriptor.dimensions.width,
        height: descriptor.dimensions.height
      });
    }
  }
});
