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

test('selects an explicit landscape variant for wide viewports and keeps caches per source', async () => {
  const images = [];
  const manager = createAssetManager({
    assets: {
      scene: {
        variants: {
          portrait: { src: '/portrait.png' },
          landscape: { src: '/landscape.png' }
        }
      }
    }
  }, () => {
    const image = {
      set src(value) {
        this.source = value;
        queueMicrotask(() => this.onload());
      },
      async decode() {}
    };
    images.push(image);
    return image;
  });

  assert.deepEqual(manager.selectionFor({ id: 'scene', assetId: 'scene' }, { width: 1920, height: 1080 }), {
    src: '/landscape.png', format: 'landscape', requestedFormat: 'landscape', fallback: false,
    descriptor: { src: '/landscape.png' }
  });
  assert.equal(manager.sourceFor({ id: 'scene', assetId: 'scene' }, { width: 390, height: 844 }), '/portrait.png');
  await manager.preloadSceneAsset({ id: 'scene', assetId: 'scene' }, { width: 1920, height: 1080 });
  await manager.preloadSceneAsset({ id: 'scene', assetId: 'scene' }, { width: 390, height: 844 });
  assert.equal(images.length, 2);
  assert.equal(manager.cachedAssetCount(), 2);
});

test('falls back to a decoded portrait when a landscape variant is pending', () => {
  const manager = createAssetManager({
    assets: { scene: { variants: { portrait: { src: '/portrait.png' } } } }
  });

  assert.deepEqual(manager.selectionFor({ id: 'scene', assetId: 'scene' }, { width: 1920, height: 1080 }), {
    src: '/portrait.png', format: 'portrait', requestedFormat: 'landscape', fallback: true,
    descriptor: { src: '/portrait.png' }
  });
});
