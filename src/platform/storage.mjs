// Storage may be unavailable in privacy modes, embedded browsers, or under quota pressure.
// Keep the story playable, but never claim a failed write succeeded.
export function storageRead(key, store) {
  try {
    return (store ?? globalThis.window.localStorage).getItem(key);
  } catch {
    return null;
  }
}

export function storageWrite(key, value, store) {
  try {
    (store ?? globalThis.window.localStorage).setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function storageClear(key, store) {
  try {
    (store ?? globalThis.window.localStorage).removeItem(key);
    return true;
  } catch {
    return false;
  }
}
