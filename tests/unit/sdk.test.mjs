import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeLocale, resolveLocale } from '../../src/platform/yandex-sdk.mjs';

test('SDK locale takes precedence over browser locale and normalizes supported languages', () => {
  assert.equal(resolveLocale({ environment: { i18n: { lang: 'ru-RU' } } }, 'en-US'), 'ru');
  assert.equal(resolveLocale({ environment: { i18n: { lang: 'en-US' } } }, 'ru-RU'), 'en');
  assert.equal(resolveLocale({ environment: { i18n: { lang: 'de-DE' } } }, 'ru-RU'), 'en');
});

test('local fallback uses browser language when SDK language is unavailable', () => {
  assert.equal(resolveLocale({ local: true }, 'ru-RU'), 'ru');
  assert.equal(resolveLocale({ local: true }, 'en-GB'), 'en');
  assert.equal(normalizeLocale(undefined), 'en');
});
