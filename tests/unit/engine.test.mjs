import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { NarrativeEngine } from '../../src/narrative/engine.mjs';

const graph = JSON.parse(fs.readFileSync(new URL('../../narrative/graph.json', import.meta.url), 'utf8'));

function reachGate(engine) {
  while (engine.snapshot().cursor.sceneId !== 'ep1_gate') {
    assert.equal(engine.advance().ok, true);
  }
  while (engine.choices().length === 0) {
    assert.equal(engine.advance().ok, true);
  }
  assert.equal(engine.snapshot().cursor.sceneId, 'ep1_gate');
}

test('engine advances dialogue and exposes choices only after the scene text', () => {
  const engine = new NarrativeEngine(graph);
  assert.equal(engine.snapshot().cursor.dialogueIndex, 0);
  assert.equal(engine.choices().length, 0);
  reachGate(engine);
  assert.equal(engine.snapshot().cursor.dialogueIndex, graph.scenes.find(scene => scene.id === 'ep1_gate').dialogue.ru.length - 1);
  assert.equal(engine.choices().length, 2);
});

test('Back restores the pre-choice cursor and state, then an alternate choice replaces effects', () => {
  const engine = new NarrativeEngine(graph);
  reachGate(engine);
  const beforeChoice = engine.snapshot();

  engine.choose('matteo_formal');
  assert.equal(engine.snapshot().state.trustMatteo, 1);
  assert.equal(engine.snapshot().cursor.sceneId, 'ep1_matteo_formal_response');

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
  assert.equal(engine.currentLine().text, graph.scenes.find(scene => scene.id === 'ep1_matteo_formal_response').dialogue.en[0].text);
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

test('terminal scene remains readable until its final line and completion survives reload', () => {
  const engine = new NarrativeEngine(graph);
  const selected = ['matteo_formal', 'elio_humor', 'hotel_numbers', 'leo_hear'];
  let selectionIndex = 0;
  while (engine.snapshot().cursor.sceneId !== 'ep1_hook') {
    const choices = engine.choices();
    if (choices.length) {
      assert.equal(engine.choose(selected[selectionIndex++]).ok, true);
    } else {
      assert.equal(engine.advance().ok, true);
    }
  }

  assert.equal(engine.isEnding(), true);
  assert.equal(engine.isEpisodeComplete(), false);
  const terminalLines = graph.scenes.find(scene => scene.id === 'ep1_hook').dialogue.ru;
  for (let index = 0; index < terminalLines.length - 1; index += 1) {
    assert.equal(engine.snapshot().cursor.dialogueIndex, index);
    assert.equal(engine.isEpisodeComplete(), false);
    assert.equal(engine.advance().type, 'dialogue');
  }

  assert.equal(engine.snapshot().cursor.dialogueIndex, terminalLines.length - 1);
  assert.equal(engine.isEpisodeComplete(), true);
  assert.deepEqual(engine.advance(), { ok: false, reason: 'episode-complete' });

  const restored = new NarrativeEngine(graph);
  assert.equal(restored.load(engine.save()), true);
  assert.equal(restored.isEpisodeComplete(), true);
  assert.equal(restored.currentLine().text, terminalLines.at(-1).text);
  assert.equal(restored.back(), true);
  assert.equal(restored.isEpisodeComplete(), false);
  assert.equal(restored.snapshot().cursor.dialogueIndex, terminalLines.length - 2);
});

test('all sixteen EP1 choice combinations keep route open and record observed consequences', () => {
  const options = [
    ['matteo_formal', 'matteo_direct'],
    ['elio_humor', 'elio_boundary'],
    ['hotel_numbers', 'hotel_staff'],
    ['leo_hear', 'leo_distance']
  ];
  const combinations = options.reduce((all, values) => all.flatMap(prefix => values.map(value => [...prefix, value])), [[]]);

  for (const selected of combinations) {
    const engine = new NarrativeEngine(graph);
    const reactionScenes = [];
    let choiceIndex = 0;
    let guard = 0;
    while (!engine.isEpisodeComplete()) {
      assert.ok(guard++ < 200, `path did not terminate for ${selected.join(',')}`);
      const choices = engine.choices();
      if (choices.length) {
        const choiceId = selected[choiceIndex++];
        assert.equal(engine.choose(choiceId).ok, true);
        reactionScenes.push(engine.snapshot().cursor.sceneId);
      } else {
        assert.equal(engine.advance().ok, true);
      }
    }

    const state = engine.snapshot().state;
    assert.equal(state.route, 'none');
    assert.equal(state.leoTruthHeard, false);
    assert.equal(state.hotelEvidence, selected[2] === 'hotel_numbers' ? 'numbers' : 'staff');
    assert.equal(state.investorTerms, selected[2] === 'hotel_numbers' ? 'known-risk' : 'unknown');
    assert.equal(state.fundingEvidence, selected[2] === 'hotel_numbers' ? 1 : 0);
    assert.equal(state.staffTrust, selected[2] === 'hotel_staff' ? 2 : 0);
    assert.deepEqual(reactionScenes, [
      `ep1_${selected[0]}_response`,
      `ep1_${selected[1]}_response`,
      `ep1_${selected[2]}_response`,
      `ep1_${selected[3]}_response`
    ]);
  }
});
