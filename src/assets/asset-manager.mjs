const LANDSCAPE_ASPECT_RATIO = 1.15;

function viewportSize(viewport) {
  const source = viewport ?? globalThis.window ?? globalThis;
  const width = Number(source?.innerWidth ?? source?.clientWidth ?? source?.width ?? 0);
  const height = Number(source?.innerHeight ?? source?.clientHeight ?? source?.height ?? 0);
  return { width, height };
}

function preferredFormat(viewport) {
  const { width, height } = viewportSize(viewport);
  return width > 0 && height > 0 && width / height >= LANDSCAPE_ASPECT_RATIO ? 'landscape' : 'portrait';
}

function descriptorSource(descriptor) {
  return descriptor?.src ?? descriptor?.path ?? null;
}

function variantDescriptors(asset) {
  const variants = asset?.variants ?? asset ?? {};
  return {
    portrait: variants.portrait ?? null,
    // `desktop` remains a read-compatible alias for older manifests. New
    // runtime manifests use the explicit `landscape` name.
    landscape: variants.landscape ?? variants.desktop ?? null
  };
}

export function createAssetManager(
  manifest,
  imageFactory = () => new Image(),
  viewportProvider = () => viewportSize()
) {
  const cache = new Map();

  function selectionFor(scene, viewport = viewportProvider()) {
    const asset = manifest.assets[scene.assetId];
    if (!asset) throw new Error(`Missing asset for scene ${scene.id}`);
    const requestedFormat = preferredFormat(viewport);
    const variants = variantDescriptors(asset);
    const requested = variants[requestedFormat];
    const fallbackFormat = requestedFormat === 'landscape' ? 'portrait' : 'landscape';
    const fallback = variants[fallbackFormat];
    const descriptor = requested ?? fallback ?? (asset.src ? asset : null);
    const src = descriptorSource(descriptor);
    if (!src) throw new Error(`Missing asset for scene ${scene.id}`);
    return {
      src,
      format: requested ? requestedFormat : fallback ? fallbackFormat : 'legacy',
      requestedFormat,
      fallback: !requested && Boolean(fallback),
      descriptor
    };
  }

  function sourceFor(scene, viewport) {
    return selectionFor(scene, viewport).src;
  }

  function preloadSceneAsset(scene, viewport) {
    const src = sourceFor(scene, viewport);
    if (cache.has(src)) return cache.get(src);
    const promise = new Promise((resolve, reject) => {
      const image = imageFactory();
      image.onload = async () => {
        try {
          if (typeof image.decode === 'function') await image.decode();
          resolve(image);
        } catch (error) {
          reject(new Error(`Unable to decode ${src}`, { cause: error }));
        }
      };
      image.onerror = () => reject(new Error(`Unable to preload ${src}`));
      image.src = src;
    });
    // Keep rejected promises cached. A failed production image must not be
    // silently replaced by a placeholder or cause an unbounded retry loop.
    cache.set(src, promise);
    return promise;
  }

  function preloadSceneAssetOptional(scene, viewport) {
    try {
      return preloadSceneAsset(scene, viewport).catch(() => null);
    } catch {
      return Promise.resolve(null);
    }
  }

  return {
    selectionFor,
    sourceFor,
    preloadSceneAsset,
    preloadSceneAssetOptional,
    cachedAssetCount() {
      return cache.size;
    }
  };
}
