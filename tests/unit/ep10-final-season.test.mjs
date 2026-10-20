import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import graph from '../../narrative/graph.json' with { type: 'json' };
import { NarrativeEngine } from '../../src/narrative/engine.mjs';
import { exploreGraph } from '../../src/narrative/route-explorer.mjs';
import { resolveHotelOutcome, resolveRelationshipEnding } from '../../src/narrative/final-resolvers.mjs';
import { runNarrativeGameProfile } from '../../tools/narrative/narrative-game-check.mjs';

const RELATIONSHIP_ENDINGS = [
  'matteo-hope', 'matteo-goodbye', 'leo-second-chance', 'leo-echo',
  'elio-table-for-two', 'elio-separate-kitchens', 'nika-own-way'
];
const HOTEL_OUTCOMES = ['independence', 'limited-investment', 'sale'];

function finishEpisode(engine) {
  let guard = 0;
  while (!engine.isEpisodeComplete()) {
    assert.ok(guard++ < 2_000, `episode did not finish at ${engine.snapshot().cursor.sceneId}`);
    const choices = engine.choices();
    if (choices.length) assert.equal(engine.choose(choices[0].id).ok, true);
    else assert.equal(engine.advance().ok, true);
  }
}

function playPath(engine, path, stopAt = null) {
  for (const step of path) {
    if (stopAt && engine.snapshot().cursor.sceneId === stopAt) return;
    if (step.startsWith('episode:')) {
      while (!engine.isEpisodeComplete()) assert.equal(engine.advance().ok, true);
      assert.equal(engine.continueEpisode().ok, true);
      continue;
    }
    let guard = 0;
    while (!engine.choices().some(choice => choice.id === step)) {
      assert.ok(guard++ < 2_000, `choice ${step} was not reached at ${engine.snapshot().cursor.sceneId}`);
      if (engine.isEpisodeComplete()) assert.equal(engine.continueEpisode().ok, true);
      else assert.equal(engine.advance().ok, true);
    }
    assert.equal(engine.choose(step).ok, true);
  }
}

test('EP10 executable graph covers every authored scene in RU and EN', () => {
  const report = exploreGraph(graph, { maxStates: 250_000 });
  assert.equal(report.valid, true, report.errors.join('; '));
  assert.equal(report.truncated, false);
  for (const scene of graph.scenes.filter(candidate => candidate.episode === 10)) {
    assert.equal(report.visitedScenes.has(scene.id), true, `unreachable EP10 scene ${scene.id}`);
    assert.ok(scene.dialogue.ru.length > 0);
    assert.ok(scene.dialogue.en.length > 0);
  }
});

test('full-season narrative validator keeps backward liveness projection coverage', () => {
  const profile = JSON.parse(fs.readFileSync('config/narrative-game.local.json', 'utf8'));
  const report = runNarrativeGameProfile(process.cwd(), profile);
  assert.equal(report.status, 'PASS_DECLARED_NARRATIVE_GRAPH', JSON.stringify(report.errors));
  assert.equal(report.coverage.reachedScenes, 144);
  assert.equal(report.coverage.visitedChoices, report.coverage.declaredChoices);
  assert.ok(report.coverage.visitedStates < profile.maxStates);
});

test('EP10 reaches all seven relationship endings, all three hotel outcomes and all 21 legal pairs', () => {
  const report = exploreGraph(graph, { maxStates: 250_000 });
  const pairs = new Set(report.terminals.map(terminal => `${terminal.state.endingId}:${terminal.state.hotelOutcome}`));
  assert.deepEqual([...new Set(report.terminals.map(terminal => terminal.state.endingId))].sort(), [...RELATIONSHIP_ENDINGS].sort());
  assert.deepEqual([...report.hotelOutcomes].sort(), [...HOTEL_OUTCOMES].sort());
  assert.equal(pairs.size, 21);
  for (const endingId of RELATIONSHIP_ENDINGS) {
    for (const hotelOutcome of HOTEL_OUTCOMES) {
      assert.equal(pairs.has(`${endingId}:${hotelOutcome}`), true, `missing pair ${endingId}:${hotelOutcome}`);
    }
  }
});

test('EP10 relationship and hotel resolvers are independent and deterministic', () => {
  const relationshipState = {
    route: 'matteo',
    trustMatteo: 4,
    relationshipMatteo: 4,
    matteoCommitment: 'mutual-plan',
    matteoCareerChoice: 'delegation',
    publicDisclosure: 'full',
    ep10FinalAction: 'matteo-shared-plan',
    endingId: 'unresolved',
    hotelOutcome: 'unresolved'
  };
  assert.equal(resolveRelationshipEnding(relationshipState).endingId, 'matteo-hope');
  assert.equal(resolveRelationshipEnding({ ...relationshipState, hotelOutcome: 'sale' }).endingId, 'matteo-hope');

  const businessState = {
    alternativeBudget: 'viable',
    staffTrust: 5,
    fundingEvidence: 4,
    staffProtection: 'secured',
    publicDisclosure: 'full',
    investorTerms: 'control-risk',
    endingId: 'matteo-goodbye',
    hotelOutcome: 'unresolved'
  };
  assert.equal(resolveHotelOutcome(businessState).hotelOutcome, 'independence');
  assert.equal(resolveHotelOutcome({ ...businessState, endingId: 'matteo-hope' }).hotelOutcome, 'independence');
  assert.equal(resolveHotelOutcome({ ...businessState, alternativeBudget: 'underfunded', investorTerms: 'limited-investment' }).hotelOutcome, 'limited-investment');
  assert.equal(resolveHotelOutcome({ ...businessState, alternativeBudget: 'underfunded', investorTerms: 'sale-imminent' }).hotelOutcome, 'sale');
});

test('every final witness round-trips through save v4 and locale changes preserve state', () => {
  const report = exploreGraph(graph, { maxStates: 250_000 });
  const witnesses = new Map();
  for (const terminal of report.terminals) {
    const key = `${terminal.state.endingId}:${terminal.state.hotelOutcome}`;
    if (!witnesses.has(key)) witnesses.set(key, terminal);
  }
  assert.equal(witnesses.size, 21);

  for (const terminal of witnesses.values()) {
    const engine = new NarrativeEngine(graph);
    playPath(engine, terminal.path);
    finishEpisode(engine);
    const final = engine.snapshot();
    assert.equal(engine.isSeasonComplete(), true);
    assert.equal(final.state.endingId, terminal.state.endingId);
    assert.equal(final.state.hotelOutcome, terminal.state.hotelOutcome);
    const saved = engine.save();
    const restored = new NarrativeEngine(graph, { locale: 'en' });
    assert.equal(restored.load(saved), true);
    assert.deepEqual(restored.snapshot(), final);
    assert.equal(restored.setLocale('en'), true);
    assert.deepEqual(restored.snapshot().state, final.state);
    assert.deepEqual(restored.snapshot().cursor, final.cursor);
  }
});

test('Back restores the pre-final action snapshot and New Game clears EP10 results', () => {
  const report = exploreGraph(graph, { maxStates: 250_000 });
  const terminal = report.terminals.find(item => item.state.endingId === 'matteo-hope');
  assert.ok(terminal);
  const engine = new NarrativeEngine(graph);
  playPath(engine, terminal.path, 'ep10_matteo_final');
  while (!engine.choices().length) assert.equal(engine.advance().ok, true);
  const before = engine.snapshot();
  const action = engine.choices().find(choice => choice.id === 'ep10_matteo_shared_plan');
  assert.ok(action);
  assert.equal(engine.choose(action.id).ok, true);
  assert.notEqual(engine.snapshot().state.ep10FinalAction, before.state.ep10FinalAction);
  assert.equal(engine.back(), true);
  assert.deepEqual(engine.snapshot().cursor, before.cursor);
  assert.deepEqual(engine.snapshot().state, before.state);
  engine.newGame();
  assert.equal(engine.snapshot().cursor.sceneId, 'ep1_arrival');
  assert.equal(engine.snapshot().state.endingId, 'unresolved');
  assert.equal(engine.snapshot().state.hotelOutcome, 'unresolved');
  assert.equal(engine.snapshot().state.route, 'none');
  assert.equal(engine.snapshot().state.routeLocked, false);
});
