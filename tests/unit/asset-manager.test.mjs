import assert from 'node:assert/strict';
import test from 'node:test';

import { createAssetManager } from '../../src/assets/asset-manager.mjs';

test('preload resolves only after the image has decoded', async () => {
  const calls = [];
  const image = {
    set src(value) {
      this.source = value;
      queueMicrotask(() => this.onload());
    },
    async decode() {
      calls.push('decode');
    }
  };
  const manager = createAssetManager({ assets: { accepted: { src: '/accepted.png' } } }, () => image);

  const result = await manager.preloadSceneAsset({ id: 'scene', assetId: 'accepted' });

  assert.equal(result, image);
  assert.deepEqual(calls, ['decode']);
  assert.equal(manager.cachedAssetCount(), 1);
});

test('preload rejects decode failures and keeps the failure cached', async () => {
  const image = {
    set src(value) {
      this.source = value;
      queueMicrotask(() => this.onload());
    },
    async decode() {
      throw new Error('decode failed');
    }
  };
  const manager = createAssetManager({ assets: { broken: { src: '/broken.png' } } }, () => image);

  await assert.rejects(manager.preloadSceneAsset({ id: 'scene', assetId: 'broken' }), /Unable to decode/);
  await assert.rejects(manager.preloadSceneAsset({ id: 'scene', assetId: 'broken' }), /Unable to decode/);
  assert.equal(manager.cachedAssetCount(), 1);
});
