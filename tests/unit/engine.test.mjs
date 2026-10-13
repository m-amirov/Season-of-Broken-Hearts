import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { NarrativeEngine } from '../../src/narrative/engine.mjs';

const graph = JSON.parse(fs.readFileSync(new URL('../../narrative/graph.json', import.meta.url), 'utf8'));

function reachGate(engine) {
  engine.advance();
  engine.advance();
  engine.advance();
  engine.advance();
  engine.advance();
  assert.equal(engine.snapshot().cursor.sceneId, 'ep1_gate');
}

test('engine advances dialogue and exposes choices only after the scene text', () => {
  const engine = new NarrativeEngine(graph);
  assert.equal(engine.snapshot().cursor.dialogueIndex, 0);
  assert.equal(engine.choices().length, 0);
  reachGate(engine);
  assert.equal(engine.snapshot().cursor.dialogueIndex, 2);
  assert.equal(engine.choices().length, 2);
});

test('Back restores the pre-choice cursor and state, then an alternate choice replaces effects', () => {
  const engine = new NarrativeEngine(graph);
  reachGate(engine);
  const beforeChoice = engine.snapshot();

  engine.choose('matteo_formal');
  assert.equal(engine.snapshot().state.trustMatteo, 1);
  assert.equal(engine.snapshot().cursor.sceneId, 'ep1_matteo_welcome');

  assert.equal(engine.back(), true);
  assert.deepEqual(engine.snapshot().cursor, beforeChoice.cursor);
  assert.deepEqual(engine.snapshot().state, beforeChoice.state);

  engine.choose('matteo_direct');
  assert.equal(engine.snapshot().state.trustMatteo, 0);
  assert.equal(engine.snapshot().state.lastChoice, 'matteo_direct');
});

test('Back is a no-op at a fresh New Game and New Game clears history and state', () => {
  const engine = new NarrativeEngine(graph);
  assert.equal(engine.back(), false);
  reachGate(engine);
  engine.choose('matteo_formal');
  assert.equal(engine.back(), true);
  engine.newGame();
  assert.equal(engine.back(), false);
  assert.equal(engine.snapshot().cursor.sceneId, 'ep1_arrival');
  assert.equal(engine.snapshot().state.trustMatteo, 0);
  assert.equal(engine.snapshot().history.length, 0);
});

test('locale changes preserve the cursor, state, and history', () => {
  const engine = new NarrativeEngine(graph);
  reachGate(engine);
  engine.choose('matteo_formal');
  const before = engine.snapshot();
  engine.setLocale('en');
  assert.equal(engine.locale(), 'en');
  assert.deepEqual(engine.snapshot().cursor, before.cursor);
  assert.deepEqual(engine.snapshot().state, before.state);
  assert.equal(engine.snapshot().history.length, before.history.length);
  assert.equal(engine.currentLine().text, graph.scenes.find(scene => scene.id === 'ep1_matteo_welcome').dialogue.en[0].text);
});

test('engine save and load restore the complete snapshot', () => {
  const engine = new NarrativeEngine(graph);
  reachGate(engine);
  engine.choose('matteo_formal');
  const saved = engine.save();
  const restored = new NarrativeEngine(graph);
  assert.equal(restored.load(saved), true);
  assert.deepEqual(restored.snapshot(), engine.snapshot());
});
