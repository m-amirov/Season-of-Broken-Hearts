import assert from 'node:assert/strict';
import test from 'node:test';
import { storageRead, storageWrite, storageClear } from '../../src/platform/storage.mjs';

test('successful storage writes return true and round trip cleanly', () => {
  const data = new Map();
  const store = {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, value); },
    removeItem: key => { data.delete(key); }
  };
  assert.equal(storageRead('save', store), null);
  assert.equal(storageWrite('save', '{"cursor":1}', store), true);
  assert.equal(storageRead('save', store), '{"cursor":1}');
  assert.equal(storageClear('save', store), true);
  assert.equal(storageRead('save', store), null);
});

test('private mode, quota and permission errors never masquerade as saved', () => {
  const inaccessible = {
    getItem: () => { throw new Error('SecurityError'); },
    setItem: () => { throw new Error('QuotaExceededError'); },
    removeItem: () => { throw new Error('SecurityError'); }
  };
  assert.equal(storageRead('save', inaccessible), null);
  assert.equal(storageWrite('save', '{}', inaccessible), false);
  assert.equal(storageClear('save', inaccessible), false);
});

test('absent browser storage fails closed without crashing gameplay', () => {
  const previous = globalThis.window;
  try {
    delete globalThis.window;
    assert.equal(storageRead('save'), null);
    assert.equal(storageWrite('save', '{}'), false);
    assert.equal(storageClear('save'), false);
  } finally {
    if (previous !== undefined) globalThis.window = previous;
  }
});
