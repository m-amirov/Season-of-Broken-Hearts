export function createAssetManager(manifest, imageFactory = () => new Image()) {
  const cache = new Map();

  function sourceFor(scene) {
    const asset = manifest.assets[scene.assetId];
    if (!asset?.src) throw new Error(`Missing asset for scene ${scene.id}`);
    return asset.src;
  }

  function preloadSceneAsset(scene) {
    const src = sourceFor(scene);
    if (cache.has(src)) return cache.get(src);
    const promise = new Promise((resolve, reject) => {
      const image = imageFactory();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Unable to preload ${src}`));
      image.src = src;
    });
    cache.set(src, promise);
    return promise;
  }

  return {
    sourceFor,
    preloadSceneAsset,
    cachedAssetCount() {
      return cache.size;
    }
  };
}
