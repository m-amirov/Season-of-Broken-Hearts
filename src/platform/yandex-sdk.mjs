let sdkPromise;

function isLocalDevelopment() {
  const location = globalThis.location;
  return location?.protocol === 'file:' || ['localhost', '127.0.0.1', '[::1]'].includes(location?.hostname);
}

export function normalizeLocale(value) {
  return String(value ?? '').toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

export function resolveLocale(sdk, browserLanguage = globalThis.navigator?.language) {
  const sdkLanguage = sdk?.environment?.i18n?.lang;
  return normalizeLocale(sdkLanguage || browserLanguage);
}

export function initYandexSdk() {
  if (sdkPromise) return sdkPromise;
  if (!globalThis.window?.YaGames) {
    if (isLocalDevelopment()) {
      sdkPromise = Promise.resolve({ local: true });
      return sdkPromise;
    }
    throw new Error('Yandex Games SDK is unavailable in production');
  }
  sdkPromise = Promise.resolve(globalThis.window.YaGames.init());
  return sdkPromise;
}
