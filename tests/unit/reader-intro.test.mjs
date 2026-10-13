import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { NarrativeEngine } from '../../src/narrative/engine.mjs';
import { CURRENT_SAVE_VERSION, deserializeSave, migrateSave } from '../../src/narrative/save.mjs';

const graph = JSON.parse(fs.readFileSync(new URL('../../narrative/graph.json', import.meta.url), 'utf8'));

test('chapter intro is a standalone one-time event and title comes from episode opening', () => {
  const engine = new NarrativeEngine(graph, { locale: 'ru' });
  assert.equal(engine.needsEpisodeIntro(), true);
  assert.deepEqual(engine.episodeIntro(), { episode: 1, title: 'Никогда не возвращайся' });
  engine.markEpisodeIntroSeen();
  engine.markEpisodeIntroSeen();
  assert.equal(engine.needsEpisodeIntro(), false);
  assert.deepEqual(engine.snapshot().readerProgress.seenEpisodes, [1]);
  engine.setLocale('en');
  assert.equal(engine.episodeIntro().title, 'Never Come Back');
  engine.setLocale('ru');
  const saved = engine.save();
  const restored = new NarrativeEngine(graph);
  assert.equal(restored.load(saved), true);
  assert.equal(restored.needsEpisodeIntro(), false);
});

test('tutorial appears only during first two dialogue lines of New Game, never repeats through Back or reload', () => {
  const engine = new NarrativeEngine(graph);
  engine.markEpisodeIntroSeen();
  assert.equal(engine.showTutorialHint(), true);
  assert.deepEqual(engine.advance(), { ok: true, type: 'dialogue' });
  assert.equal(engine.showTutorialHint(), true);
  assert.deepEqual(engine.advance(), { ok: true, type: 'dialogue' });
  assert.equal(engine.showTutorialHint(), false);
  assert.equal(engine.back(), true);
  assert.equal(engine.back(), true);
  assert.equal(engine.showTutorialHint(), false);
  const restored = new NarrativeEngine(graph);
  assert.equal(restored.load(engine.save()), true);
  assert.equal(restored.needsEpisodeIntro(), false);
  assert.equal(restored.showTutorialHint(), false);
  assert.equal(restored.newGame(), true);
  assert.equal(restored.needsEpisodeIntro(), true);
  assert.equal(restored.showTutorialHint(), true);
});

test('first entry into a later episode generates a fresh localized title once', () => {
  const extended = structuredClone(graph);
  extended.scenes.push({
    id: 'ep2_preview',
    episode: 2,
    title: { ru: 'Тестовая глава', en: 'Test chapter' },
    assetId: extended.scenes[0].assetId,
    dialogue: { ru: [{ speaker: null, text: 'Тест' }], en: [{ speaker: null, text: 'Test' }] },
    ending: true
  });
  // Changing the EP1 ending to an ordinary transition makes the fixture reachable.
  const hook = extended.scenes.find(scene => scene.id === 'ep1_hook');
  delete hook.ending;
  hook.next = 'ep2_preview';
  const engine = new NarrativeEngine(extended);
  engine.markEpisodeIntroSeen();
  const visited = new Set();
  while (engine.currentScene().id !== 'ep2_preview') {
    const scene = engine.currentScene();
    const state = JSON.stringify(engine.snapshot().cursor);
    assert.ok(!visited.has(state), 'progress stalled: ' + state);
    visited.add(state);
    const choices = engine.choices();
    if (choices.length) {
      assert.equal(engine.choose(choices[0].id).ok, true);
    } else {
      assert.equal(engine.advance().ok, true);
    }
    assert.ok(visited.size < 350, 'fixture should terminate');
  }
  assert.equal(engine.needsEpisodeIntro(), true);
  assert.equal(engine.episodeIntro().title, 'Тестовая глава');
  engine.markEpisodeIntroSeen();
  assert.equal(engine.needsEpisodeIntro(), false);
  const another = new NarrativeEngine(extended);
  assert.equal(another.load(engine.save()), true);
  assert.equal(another.needsEpisodeIntro(), false);
});

test('v2 saves migrate without replaying an episode title or tutorial over an existing reader', () => {
  const engine = new NarrativeEngine(graph);
  engine.advance();
  engine.advance();
  const v3 = engine.snapshot();
  const old = {
    schemaVersion: 2, locale: v3.locale, cursor: v3.cursor,
    state: v3.state, history: v3.history
  };
  const migrated = migrateSave(old, graph);
  assert.equal(migrated.schemaVersion, CURRENT_SAVE_VERSION);
  assert.deepEqual(migrated.readerProgress, { seenEpisodes: [1], tutorialAdvances: 2 });
  const restored = new NarrativeEngine(graph);
  assert.equal(restored.load(JSON.stringify(old)), true);
  assert.equal(restored.needsEpisodeIntro(), false);
  assert.equal(restored.showTutorialHint(), false);
  assert.deepEqual(restored.snapshot().state, engine.snapshot().state);
});

test('new save progress is validated fail-closed for malformed, future or unknown episode data', () => {
  const engine = new NarrativeEngine(graph);
  const good = engine.snapshot();
  const invalid = [
    { ...good, readerProgress: { seenEpisodes: [1, 1], tutorialAdvances: 0 } },
    { ...good, readerProgress: { seenEpisodes: [99], tutorialAdvances: 0 } },
    { ...good, readerProgress: { seenEpisodes: [], tutorialAdvances: 3 } },
    { ...good, readerProgress: { seenEpisodes: '1', tutorialAdvances: 0 } }
  ];
  for (const save of invalid) {
    assert.equal(deserializeSave(JSON.stringify(save), graph), null);
  }
});
