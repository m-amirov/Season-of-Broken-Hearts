import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  applyEffects,
  canEnter,
  createInitialState,
  validateGraph
} from '../../src/narrative/state.mjs';
import { getLocalizedText } from '../../src/narrative/localization.mjs';
import {
  CURRENT_SAVE_VERSION,
  deserializeSave,
  migrateSave,
  serializeSave
} from '../../src/narrative/save.mjs';

const graph = JSON.parse(fs.readFileSync(new URL('../../narrative/graph.json', import.meta.url), 'utf8'));

test('EP1 graph has stable scenes, localized dialogue, and finite exits', () => {
  const report = validateGraph(graph);
  assert.deepEqual(report, { valid: true, errors: [] });
});

test('graph validation rejects duplicate choice IDs and non-string targets', () => {
  const duplicate = structuredClone(graph);
  duplicate.scenes[1].choices[1].id = duplicate.scenes[1].choices[0].id;
  duplicate.scenes[1].choices[1].to = 42;

  const report = validateGraph(duplicate);
  assert.equal(report.valid, false);
  assert.ok(report.errors.includes('choice:ep1_gate:invalid-id'));
});

test('graph validation rejects dialogue conditions outside the bounded state schema', () => {
  const invalid = structuredClone(graph);
  invalid.scenes.find(scene => scene.id === 'ep1_hook').dialogue.ru[0].when = { unknownFlag: true };

  const report = validateGraph(invalid);
  assert.equal(report.valid, false);
  assert.ok(report.errors.includes('scene:ep1_hook:dialogue:ru:0:invalid-when:unknownFlag'));
});

test('effects create a new bounded state without mutating the previous state', () => {
  const initial = createInitialState(graph);
  const next = applyEffects(initial, { trustMatteo: 1, metMatteo: true, lastChoice: 'matteo_formal' }, graph.stateSchema);

  assert.equal(initial.trustMatteo, 0);
  assert.equal(initial.metMatteo, false);
  assert.equal(next.trustMatteo, 1);
  assert.equal(next.metMatteo, true);
  assert.equal(next.lastChoice, 'matteo_formal');
});

test('guards only allow exact reachable state values', () => {
  const initial = createInitialState(graph);
  assert.equal(canEnter({ requires: { metLeo: false } }, initial), true);
  assert.equal(canEnter({ requires: { metLeo: true } }, initial), false);
});

test('localized text falls back to the default locale only when requested locale is absent', () => {
  assert.equal(getLocalizedText({ ru: 'Привет', en: 'Hello' }, 'en'), 'Hello');
  assert.equal(getLocalizedText({ ru: 'Привет' }, 'en'), 'Привет');
});

test('save round-trip preserves cursor, state, locale, and history', () => {
  const snapshot = {
    schemaVersion: CURRENT_SAVE_VERSION,
    locale: 'en',
    cursor: { sceneId: 'ep1_leo_choice', dialogueIndex: 1 },
    state: createInitialState(graph),
    history: [{ sceneId: 'ep1_arrival', dialogueIndex: 2, state: createInitialState(graph) }]
  };
  const restored = deserializeSave(serializeSave(snapshot), graph);
  assert.deepEqual(restored, snapshot);
});

test('known save version migrates and future or corrupt saves fail closed', () => {
  const initial = createInitialState(graph);
  const legacy = {
    schemaVersion: 0,
    locale: 'ru',
    cursor: { sceneId: 'ep1_arrival', dialogueIndex: 0 },
    state: initial,
    history: []
  };
  assert.equal(migrateSave(legacy).schemaVersion, CURRENT_SAVE_VERSION);
  const oldState = Object.fromEntries(Object.entries(initial).filter(([key]) => !['hotelEvidence', 'matteoApproach', 'elioApproach', 'leoConversation'].includes(key)));
  const upgraded = deserializeSave(JSON.stringify({
    schemaVersion: 1,
    locale: 'ru',
    cursor: { sceneId: 'ep1_arrival', dialogueIndex: 0 },
    state: oldState,
    history: [{ sceneId: 'ep1_arrival', dialogueIndex: 0, state: oldState }]
  }), graph);
  assert.ok(upgraded);
  assert.equal(upgraded.schemaVersion, CURRENT_SAVE_VERSION);
  assert.equal(upgraded.state.hotelEvidence, 'none');
  assert.equal(upgraded.state.leoConversation, 'none');
  assert.equal(upgraded.history.length, 1);
  assert.throws(() => migrateSave({ schemaVersion: CURRENT_SAVE_VERSION + 1 }), /future save version/i);
  assert.equal(deserializeSave('{not json', graph), null);
});
