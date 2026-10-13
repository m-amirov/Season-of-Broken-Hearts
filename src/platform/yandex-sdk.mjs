let sdkPromise;

function isLocalDevelopment() {
  return location.protocol === 'file:' || ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
}

export function initYandexSdk() {
  if (sdkPromise) return sdkPromise;
  if (!window.YaGames) {
    if (isLocalDevelopment()) return Promise.resolve({ local: true });
    throw new Error('Yandex Games SDK is unavailable in production');
  }
  sdkPromise = window.YaGames.init();
  return sdkPromise;
}
