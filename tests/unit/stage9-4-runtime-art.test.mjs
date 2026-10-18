import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createAssetManager } from '../../src/assets/asset-manager.mjs';

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

test('EP2 Bianca agreement and refusal branches resolve a real dual-format asset family', () => {
  const graph = read('narrative/graph.json');
  const manifest = read('narrative/assets.json');
  const expectedScenes = {
    ep2_refusal_bianca_arrival: 'ep2-refusal-bianca-cg',
    ep2_bianca_arrives: 'ep2-bianca-arrives-cg'
  };

  const assets = [];
  for (const [sceneId, expectedAssetId] of Object.entries(expectedScenes)) {
    const scene = graph.scenes.find(value => value.id === sceneId);
    assert.ok(scene, `missing authored scene ${sceneId}`);
    assert.equal(scene.assetId, expectedAssetId);
    const asset = manifest.assets[expectedAssetId];
    assert.ok(asset, `missing manifest asset ${expectedAssetId}`);
    assert.equal(asset.kind, 'production-cg');
    assert.equal(asset.familyId, 'ep2-bianca-arrival-cg');
    assert.notEqual(asset.variants.portrait.src, asset.variants.landscape.src);
    assets.push(asset);
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
  assert.deepEqual(assets[0].variants, assets[1].variants);
});

test('EP2 Bianca branches select and preload the correct format on desktop and mobile', async () => {
  const graph = read('narrative/graph.json');
  const manifest = read('narrative/assets.json');
  const scenes = [
    graph.scenes.find(value => value.id === 'ep2_refusal_bianca_arrival'),
    graph.scenes.find(value => value.id === 'ep2_bianca_arrives')
  ];
  const loaded = [];
  const manager = createAssetManager(manifest, () => {
    const image = {
      decode: async () => {},
      onload: null,
      onerror: null
    };
    Object.defineProperty(image, 'src', {
      set(value) {
        loaded.push(value);
        queueMicrotask(() => image.onload?.());
      }
    });
    return image;
  });

  for (const scene of scenes) {
    assert.equal(manager.selectionFor(scene, { width: 1920, height: 1080 }).format, 'landscape');
    assert.equal(manager.selectionFor(scene, { width: 390, height: 844 }).format, 'portrait');
    await manager.preloadSceneAsset(scene, { width: 1920, height: 1080 });
    await manager.preloadSceneAsset(scene, { width: 390, height: 844 });
  }

  assert.equal(manager.cachedAssetCount(), 2, 'both Bianca variants should be cached once');
  assert.deepEqual([...new Set(loaded)].sort(), [
    '/assets/production/cg/ep2-bianca-arrival-cg-landscape.png',
    '/assets/production/cg/ep2-bianca-arrival-cg.png'
  ]);
});

test('EP2 Bianca narrative branches keep authored continuation and choice targets intact', () => {
  const graph = read('narrative/graph.json');
  const arrival = graph.scenes.find(value => value.id === 'ep2_bianca_arrives');
  const refusal = graph.scenes.find(value => value.id === 'ep2_refusal_bianca_arrival');
  assert.equal(refusal.next, 'ep2_rehearsal_failure');
  assert.deepEqual(arrival.choices.map(choice => choice.to).sort(), [
    'ep2_bianca_professional_response',
    'ep2_bianca_pushback_response'
  ]);
  for (const choice of arrival.choices) {
    assert.equal(choice.effects.biancaRoleKnown, true);
    assert.ok(graph.scenes.some(scene => scene.id === choice.to));
  }
});

test('EP2 remaining five scenes map to hash-bound dual-format PNGs with recorded provenance', () => {
  const graph = read('narrative/graph.json');
  const manifest = read('narrative/assets.json');
  const rights = read('artifacts/evidence/rights-manifest.json').entries;
  const expected = {
    ep2_public_agreement: 'ep2-public-agreement-cg',
    ep2_public_refusal: 'ep2-public-refusal-cg',
    ep2_rehearsal_failure: 'ep2-rehearsal-failure-cg',
    ep2_rooftop_after: 'ep2-rooftop-after-cg',
    ep2_transition: 'ep2-transition-cg'
  };

  for (const [sceneId, assetId] of Object.entries(expected)) {
    const scene = graph.scenes.find(value => value.id === sceneId);
    assert.ok(scene, `missing authored scene ${sceneId}`);
    assert.equal(scene.assetId, assetId);
    const asset = manifest.assets[assetId];
    assert.ok(asset, `missing runtime mapping ${assetId}`);
    assert.equal(asset.kind, 'production-cg');
    assert.deepEqual(asset.sceneIds, [sceneId]);

    for (const [format, dimensions] of Object.entries({
      portrait: { width: 1024, height: 1536 },
      landscape: { width: 1672, height: 941 }
    })) {
      const descriptor = asset.variants[format];
      const relativePath = descriptor.src.replace(/^\//, '');
      const actual = pngInfo(relativePath);
      assert.deepEqual(actual, {
        sha256: descriptor.sha256,
        width: dimensions.width,
        height: dimensions.height
      });
      assert.deepEqual(descriptor.dimensions, dimensions);

      const rightsEntry = rights.find(entry => entry.path === relativePath);
      assert.ok(rightsEntry, `missing rights entry for ${relativePath}`);
      assert.equal(rightsEntry.sha256, actual.sha256);
      assert.equal(rightsEntry.bytes, fs.statSync(path.join(root, relativePath)).size);
      assert.match(rightsEntry.creationMethod, /image_gen\.imagegen/);
      assert.ok(rightsEntry.originalSource);
      assert.ok(rightsEntry.licenseOrPermission);
      assert.deepEqual(rightsEntry.transformations, []);
    }
    assert.notEqual(asset.variants.portrait.src, asset.variants.landscape.src);
  }
});

test('EP2 remaining five families select and preload the right format across authored branches', async () => {
  const graph = read('narrative/graph.json');
  const manifest = read('narrative/assets.json');
  const sceneIds = [
    'ep2_public_agreement', 'ep2_public_refusal', 'ep2_rehearsal_failure',
    'ep2_rooftop_after', 'ep2_transition'
  ];
  const scenes = sceneIds.map(id => graph.scenes.find(value => value.id === id));
  const loaded = [];
  const manager = createAssetManager(manifest, () => {
    const image = { decode: async () => {}, onload: null, onerror: null };
    Object.defineProperty(image, 'src', {
      set(value) {
        loaded.push(value);
        queueMicrotask(() => image.onload?.());
      }
    });
    return image;
  });

  for (const scene of scenes) {
    assert.equal(manager.selectionFor(scene, { width: 1600, height: 900 }).format, 'landscape');
    assert.equal(manager.selectionFor(scene, { width: 390, height: 844 }).format, 'portrait');
    assert.equal(manager.selectionFor(scene, { width: 360, height: 640 }).format, 'portrait');
    await manager.preloadSceneAsset(scene, { width: 1600, height: 900 });
    await manager.preloadSceneAsset(scene, { width: 390, height: 844 });
  }

  assert.equal(manager.cachedAssetCount(), 10, 'all five portrait/landscape pairs should be decoded');
  assert.equal(new Set(loaded).size, 10);
  assert.equal(graph.scenes.find(value => value.id === 'ep2_public_agreement').choices
    .find(choice => choice.id === 'ep2_public_yes').to, 'ep2_rehearsal_failure');
  assert.equal(graph.scenes.find(value => value.id === 'ep2_public_agreement').choices
    .find(choice => choice.id === 'ep2_public_no').to, 'ep2_public_refusal');
  assert.equal(graph.scenes.find(value => value.id === 'ep2_public_refusal').next, 'ep2_rehearsal_failure');
  assert.equal(graph.scenes.find(value => value.id === 'ep2_rehearsal_failure').next, 'ep2_rooftop_after');
  assert.ok(graph.scenes.find(value => value.id === 'ep2_rooftop_after').choices
    .every(choice => choice.to === 'ep2_transition'));
  assert.equal(graph.scenes.find(value => value.id === 'ep2_transition').next, 'ep3_old_photo');
});

test('Stage 9.4 remaining-seven packet keeps current mappings source-bound without claiming PNGs', () => {
  const graph = read('narrative/graph.json');
  const packet = read('artifacts/production-art/stage9.4/STAGE9_4_EP2_REMAINING7_BRIEF_PACKET_20261017_5A99008.json');
  const entries = packet.mappingInventory;
  assert.equal(entries.length, 7);
  assert.equal(new Set(entries.map(entry => entry.sceneId)).size, 7);
  assert.equal(new Set(entries.map(entry => entry.assetId)).size, 7);
  assert.equal(new Set(entries.map(entry => entry.familyId)).size, 5);
  for (const entry of entries) {
    const scene = graph.scenes.find(value => value.id === entry.sceneId);
    assert.ok(scene, `missing pending scene ${entry.sceneId}`);
    assert.equal(scene.assetId, entry.assetId);
    assert.equal(entry.status, 'BRIEF_READY_GENERATION_PENDING');
  }
  assert.equal(packet.generation, 'NOT_STARTED; no PNGs, output receipts or capability claims are made by this packet');
  assert.deepEqual(packet.protectedAccepted, [
    'S19-S26',
    'ep2_refusal_bianca_arrival',
    'ep2_bianca_arrives'
  ]);
});
