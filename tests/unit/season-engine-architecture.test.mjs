import assert from 'node:assert/strict';
import test from 'node:test';

import { NarrativeEngine } from '../../src/narrative/engine.mjs';
import { buildGraph } from '../../src/narrative/graph-builder.mjs';
import { exploreGraph } from '../../src/narrative/route-explorer.mjs';
import { deserializeSave } from '../../src/narrative/save.mjs';
import { createInitialState, getDialogueLines } from '../../src/narrative/state.mjs';
import graph from '../../narrative/graph.json' with { type: 'json' };

function minimalGraph() {
  return {
    schemaVersion: 1,
    profile: 'narrative-game',
    start: 'start',
    locales: ['ru', 'en'],
    characters: ['nika'],
    characterNames: { nika: { ru: 'Ника', en: 'Nika' } },
    stateSchema: {
      route: { type: 'string', values: ['none', 'matteo', 'leo', 'elio', 'independent'] },
      hotelOutcome: { type: 'string', values: ['none', 'independence', 'limited-investment', 'sale'] }
    },
    initialState: { route: 'none', hotelOutcome: 'none' },
    scenes: [
      {
        id: 'start', episode: 1, title: { ru: 'Старт', en: 'Start' },
        dialogue: { ru: [{ speaker: 'nika', text: 'Старт' }], en: [{ speaker: 'nika', text: 'Start' }] },
        choices: [
          { id: 'choose_matteo', label: { ru: 'Маттео', en: 'Matteo' }, to: 'matteo', effects: { route: 'matteo', hotelOutcome: 'independence' } },
          { id: 'choose_leo', label: { ru: 'Лео', en: 'Leo' }, to: 'leo', effects: { route: 'leo', hotelOutcome: 'limited-investment' } },
          { id: 'choose_elio', label: { ru: 'Элио', en: 'Elio' }, to: 'elio', effects: { route: 'elio', hotelOutcome: 'sale' } },
          { id: 'choose_independent', label: { ru: 'Сама', en: 'Myself' }, to: 'independent', effects: { route: 'independent', hotelOutcome: 'independence' } }
        ]
      },
      ...['matteo', 'leo', 'elio', 'independent'].map(id => ({
        id, episode: 1, title: { ru: id, en: id }, ending: true,
        dialogue: { ru: [{ speaker: null, text: id }], en: [{ speaker: null, text: id }] },
        endingId: `${id}-ending`
      }))
    ]
  };
}

test('v3 saves migrate into the expanded bounded state schema', () => {
  const seasonGraph = structuredClone(graph);
  seasonGraph.stateSchema.routeLocked = { type: 'boolean' };
  seasonGraph.initialState.routeLocked = false;
  const oldState = createInitialState(graph);
  const payload = {
    schemaVersion: 3,
    locale: 'ru',
    cursor: { sceneId: 'ep1_arrival', dialogueIndex: 0 },
    state: oldState,
    history: [{ sceneId: 'ep1_arrival', dialogueIndex: 0, state: oldState }],
    readerProgress: { seenEpisodes: [], tutorialAdvances: 0 }
  };

  const migrated = deserializeSave(JSON.stringify(payload), seasonGraph);
  assert.ok(migrated);
  assert.equal(migrated.state.routeLocked, false);
  assert.equal(migrated.history[0].state.routeLocked, false);
  assert.equal(migrated.schemaVersion, 4);
});

test('engine continues from an episode ending without making it an implicit choice', () => {
  const seasonGraph = minimalGraph();
  seasonGraph.scenes[0] = {
    ...seasonGraph.scenes[0],
    choices: [{ id: 'continue', label: { ru: 'Дальше', en: 'Continue' }, to: 'episode-end', effects: {} }]
  };
  seasonGraph.scenes.unshift({
    id: 'episode-end', episode: 1, title: { ru: 'Конец', en: 'End' },
    dialogue: { ru: [{ speaker: null, text: 'Конец' }], en: [{ speaker: null, text: 'End' }] },
    ending: true, nextEpisodeStart: 'episode-two'
  });
  seasonGraph.scenes.push({
    id: 'episode-two', episode: 2, title: { ru: 'Вторая глава', en: 'Second Chapter' }, ending: true,
    dialogue: { ru: [{ speaker: null, text: 'Вторая глава' }], en: [{ speaker: null, text: 'Second Chapter' }] }
  });
  const engine = new NarrativeEngine(seasonGraph);
  assert.equal(engine.choose('continue').ok, true);
  assert.equal(engine.isEpisodeComplete(), true);
  assert.deepEqual(engine.continueEpisode(), { ok: true, type: 'episode', episode: 2 });
  assert.equal(engine.snapshot().cursor.sceneId, 'episode-two');
  assert.equal(engine.isSeasonComplete(), true);
});

test('graph builder keeps EP1 stable and deterministically replaces authored later episodes', () => {
  const base = minimalGraph();
  const { choices: _choices, ...startWithoutChoices } = base.scenes[0];
  base.scenes = [{ ...startWithoutChoices, next: 'ep1-end' }, {
    id: 'ep1-end', episode: 1, title: { ru: 'Конец', en: 'End' }, ending: true,
    dialogue: { ru: [{ speaker: null, text: 'Конец' }], en: [{ speaker: null, text: 'End' }] }
  }];
  const fragments = [
    { episode: 2, start: 'ep2-start', stateSchema: { routeLocked: { type: 'boolean' } }, initialState: { routeLocked: false }, scenes: [{
      id: 'ep2-start', episode: 2, title: { ru: 'Два', en: 'Two' }, ending: true,
      dialogue: { ru: [{ speaker: null, text: 'Два' }], en: [{ speaker: null, text: 'Two' }] }
    }] },
    { episode: 3, start: 'ep3-start', stateSchema: {}, initialState: {}, scenes: [{
      id: 'ep3-start', episode: 3, title: { ru: 'Три', en: 'Three' }, ending: true,
      dialogue: { ru: [{ speaker: null, text: 'Три' }], en: [{ speaker: null, text: 'Three' }] }
    }] }
  ];
  const first = buildGraph(base, fragments);
  const second = buildGraph(first, fragments);
  assert.deepEqual(first, second);
  const firstEpisode = first.scenes.filter(scene => scene.episode === 1);
  const expectedFirstEpisode = structuredClone(base.scenes);
  delete expectedFirstEpisode.at(-1).ending;
  expectedFirstEpisode.at(-1).episodeEnd = true;
  expectedFirstEpisode.at(-1).next = 'ep2-start';
  assert.deepEqual(firstEpisode, expectedFirstEpisode);
  assert.equal(first.scenes.at(-1).id, 'ep3-start');
  assert.equal(first.initialState.routeLocked, false);
});

test('route explorer enumerates every bounded route in the supplied graph', () => {
  const report = exploreGraph(minimalGraph());
  assert.equal(report.valid, true, report.errors.join('; '));
  assert.deepEqual([...report.routes].sort(), ['elio', 'independent', 'leo', 'matteo']);
  assert.equal(report.terminals.length, 4);
  assert.equal(report.truncated, false);
});

function advanceToEpisodeEnd(engine) {
  let guard = 0;
  while (!engine.isEpisodeComplete()) {
    assert.ok(guard++ < 500, 'episode did not terminate');
    const choices = engine.choices();
    if (choices.length) assert.equal(engine.choose(choices[0].id).ok, true);
    else assert.equal(engine.advance().ok, true);
  }
}

test('Batch A graph reaches every authored EP2-EP3 scene and keeps route open', () => {
  const preEp4Graph = structuredClone(graph);
  preEp4Graph.scenes = preEp4Graph.scenes.filter(scene => scene.episode <= 3);
  const ep3Transition = preEp4Graph.scenes.find(scene => scene.id === 'ep3_transition');
  delete ep3Transition.episodeEnd;
  delete ep3Transition.next;
  ep3Transition.ending = true;
  ep3Transition.endingId = 'ep3-aurea-link';
  const report = exploreGraph(preEp4Graph, { maxStates: 1_000_000 });
  assert.equal(report.valid, true, report.errors.join('; '));
  const reached = report.visitedScenes;
  for (const scene of preEp4Graph.scenes.filter(scene => scene.episode >= 2)) {
    assert.ok(reached.has(scene.id), `unreachable authored scene: ${scene.id}`);
  }
  assert.ok(preEp4Graph.scenes.filter(scene => scene.episode === 2).every(scene => scene.dialogue.ru.length > 0 && scene.dialogue.en.length > 0));
  assert.ok(preEp4Graph.scenes.filter(scene => scene.episode === 3).every(scene => scene.dialogue.ru.length > 0 && scene.dialogue.en.length > 0));
  assert.equal(report.terminals.some(terminal => terminal.path.includes('ep2_budget_open')), true);
  assert.equal(report.routes.size, 0);
  assert.equal(report.hotelOutcomes.size, 0);
});

function chooseById(engine, choiceId) {
  let guard = 0;
  while (!engine.choices().some(choice => choice.id === choiceId)) {
    assert.ok(!engine.isEpisodeComplete(), `choice ${choiceId} was not reached`);
    assert.equal(engine.advance().ok, true);
    assert.ok(guard++ < 1_000, `choice ${choiceId} search exceeded guard`);
  }
  assert.equal(engine.choose(choiceId).ok, true);
}

test('EP2 consent and refusal are separate, close before EP3, and preserve the open route', () => {
  const accepted = new NarrativeEngine(graph);
  advanceToEpisodeEnd(accepted);
  assert.deepEqual(accepted.continueEpisode(), { ok: true, type: 'episode', episode: 2 });
  chooseById(accepted, 'ep2_budget_open');
  chooseById(accepted, 'ep2_giulia_personal_plan');
  chooseById(accepted, 'ep2_terms_public');
  chooseById(accepted, 'ep2_bianca_professional');
  chooseById(accepted, 'ep2_public_no');
  chooseById(accepted, 'ep2_boundary_clear');
  advanceToEpisodeEnd(accepted);
  assert.equal(accepted.snapshot().state.publicAgreement, 'consented');
  assert.equal(accepted.snapshot().state.matteoPublicGesture, 'declined');
  assert.equal(accepted.snapshot().state.fakeDatingStatus, 'ended');
  assert.equal(accepted.snapshot().state.route, 'none');
  assert.deepEqual(accepted.continueEpisode(), { ok: true, type: 'episode', episode: 3 });

  chooseById(accepted, 'ep3_survey_join');
  chooseById(accepted, 'ep3_report_conflict');
  chooseById(accepted, 'ep3_staff_route_record');
  chooseById(accepted, 'ep3_accountability_action');
  chooseById(accepted, 'ep3_mark_aurea_link');
  chooseById(accepted, 'ep3_keep_as_lead');
  chooseById(accepted, 'ep3_share_lead');
  advanceToEpisodeEnd(accepted);
  assert.equal(accepted.snapshot().state.leoEvidence, 'drawing');
  assert.equal(accepted.snapshot().state.leoAccountability, 'acknowledged');
  assert.equal(accepted.snapshot().state.route, 'none');
  assert.equal(getDialogueLines(accepted.currentScene(), 'ru', accepted.snapshot().state).some(line => line.text.includes('приложение')), false);
  assert.ok(accepted.currentScene().dialogue.ru.some(line => line.text.includes('рабочую связь')));

  const refused = new NarrativeEngine(graph);
  advanceToEpisodeEnd(refused);
  refused.continueEpisode();
  chooseById(refused, 'ep2_budget_improvise');
  chooseById(refused, 'ep2_giulia_family_plan');
  chooseById(refused, 'ep2_terms_decline');
  chooseById(refused, 'ep2_refusal_help_giulia');
  chooseById(refused, 'ep2_decline_keep_work');
  advanceToEpisodeEnd(refused);
  assert.equal(refused.snapshot().state.publicAgreement, 'declined');
  assert.equal(refused.snapshot().state.fakeDatingStatus, 'none');
  assert.equal(refused.snapshot().state.relationshipMatteo, 0);
  assert.equal(refused.snapshot().state.route, 'none');
  assert.deepEqual(refused.continueEpisode(), { ok: true, type: 'episode', episode: 3 });
});

test('runtime continues EP1 to EP2 to EP3 and round-trips the expanded save', () => {
  const engine = new NarrativeEngine(graph);
  advanceToEpisodeEnd(engine);
  assert.deepEqual(engine.continueEpisode(), { ok: true, type: 'episode', episode: 2 });
  advanceToEpisodeEnd(engine);
  assert.deepEqual(engine.continueEpisode(), { ok: true, type: 'episode', episode: 3 });
  advanceToEpisodeEnd(engine);
  assert.equal(engine.isEpisodeComplete(), true);
  assert.equal(engine.snapshot().state.route, 'none');
  assert.equal(engine.snapshot().state.routeLocked, false);
  assert.equal(engine.snapshot().state.leoAureaLinkKnown, true);
  assert.deepEqual(engine.continueEpisode(), { ok: true, type: 'episode', episode: 4 });
  assert.equal(engine.snapshot().cursor.sceneId, 'ep4_wedding_evening');
  const restored = new NarrativeEngine(graph);
  assert.equal(restored.load(engine.save()), true);
  assert.deepEqual(restored.snapshot(), engine.snapshot());
});

test('runtime continues EP4 to EP5, preserves provenance, and keeps route-lock open', () => {
  const engine = new NarrativeEngine(graph);
  advanceToEpisodeEnd(engine);
  assert.deepEqual(engine.continueEpisode(), { ok: true, type: 'episode', episode: 2 });
  advanceToEpisodeEnd(engine);
  assert.deepEqual(engine.continueEpisode(), { ok: true, type: 'episode', episode: 3 });
  advanceToEpisodeEnd(engine);
  assert.deepEqual(engine.continueEpisode(), { ok: true, type: 'episode', episode: 4 });

  chooseById(engine, 'ep4_wedding_stop');
  assert.equal(engine.snapshot().state.lastChoice, 'ep4_wedding_stop');
  chooseById(engine, 'ep4_ask_direct_disclosure');
  chooseById(engine, 'ep4_protect_team');
  chooseById(engine, 'ep4_keep_professional');
  advanceToEpisodeEnd(engine);
  assert.equal(engine.snapshot().state.lastChoice, 'ep4_keep_professional');
  assert.equal(engine.snapshot().state.staffCutsKnown, true);
  assert.equal(engine.snapshot().state.route, 'none');
  assert.equal(engine.snapshot().state.routeLocked, false);
  assert.deepEqual(engine.continueEpisode(), { ok: true, type: 'episode', episode: 5 });

  chooseById(engine, 'ep5_help_team');
  chooseById(engine, 'ep5_save_staff');
  chooseById(engine, 'ep5_ask_offer_details');
  chooseById(engine, 'ep5_choose_friendship');
  advanceToEpisodeEnd(engine);
  assert.equal(engine.snapshot().state.elioOfferKnown, true);
  assert.equal(engine.snapshot().state.lastChoice, 'ep5_choose_friendship');
  assert.equal(engine.snapshot().state.route, 'none');
  assert.equal(engine.snapshot().state.routeLocked, false);
  const restored = new NarrativeEngine(graph);
  assert.equal(restored.load(engine.save()), true);
  assert.deepEqual(restored.snapshot(), engine.snapshot());
});
