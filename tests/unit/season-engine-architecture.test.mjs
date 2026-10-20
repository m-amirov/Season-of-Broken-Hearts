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

function reachEpisode6(engine) {
  for (let episode = 1; episode <= 5; episode += 1) {
    advanceToEpisodeEnd(engine);
    assert.deepEqual(engine.continueEpisode(), { ok: true, type: 'episode', episode: episode + 1 });
  }
  let guard = 0;
  while (engine.snapshot().cursor.sceneId !== 'ep6_route_choice' || !engine.choices().length) {
    const choices = engine.choices();
    if (choices.length) assert.equal(engine.choose(choices[0].id).ok, true);
    else assert.equal(engine.advance().ok, true);
    assert.ok(guard++ < 100, 'EP6 common route-lock path did not terminate');
  }
}

const routeCases = [
  { id: 'matteo', choice: 'ep6_route_matteo', scene: 'ep6_route_matteo', startChoice: 'ep6_shared_ledger', contextText: 'времени и ясных границ', commitmentKey: 'matteoCommitment', commitmentValue: 'public-contract' },
  { id: 'leo', choice: 'ep6_route_leo', scene: 'ep6_route_leo', startChoice: 'ep6_open_timeline', contextText: 'видела приложение к условиям', commitmentKey: 'leoCommitment', commitmentValue: 'reopened' },
  { id: 'elio', choice: 'ep6_route_elio', scene: 'ep6_route_elio', startChoice: 'ep6_clear_future', contextText: 'спрятал серьёзность за шуткой', commitmentKey: 'elioCommitment', commitmentValue: 'curious' },
  { id: 'independent', choice: 'ep6_route_independent', scene: 'ep6_route_independent', startChoice: 'ep6_start_portfolio', contextText: 'вынесла неудобный факт на свет', commitmentKey: 'independentProgress', commitmentValue: 'portfolio' }
];

test('EP6 presents all four explicit routes and preserves prior decisions in route starts', () => {
  for (const routeCase of routeCases) {
    const engine = new NarrativeEngine(graph);
    reachEpisode6(engine);
    const routeChoices = engine.choices();
    assert.deepEqual(routeChoices.map(choice => choice.id), routeCases.map(candidate => candidate.choice));
    assert.equal(engine.snapshot().state.route, 'none');
    assert.equal(engine.snapshot().state.routeLocked, false);
    assert.equal(engine.snapshot().state.routeLockSource, 'none');

    assert.equal(engine.choose(routeCase.choice).ok, true);
    assert.deepEqual(engine.snapshot().state.route, routeCase.id);
    assert.equal(engine.snapshot().state.routeLocked, true);
    assert.equal(engine.snapshot().state.routeLockSource, 'ep6_route_choice');
    assert.equal(engine.snapshot().cursor.sceneId, routeCase.scene);
    while (!engine.choices().length) assert.equal(engine.advance().ok, true);
    assert.ok(engine.choices().some(choice => choice.id === routeCase.startChoice));
    assert.ok(getDialogueLines(engine.currentScene(), 'ru', engine.snapshot().state).some(line => line.text.includes(routeCase.contextText)));
    assert.equal(engine.choose(routeCase.startChoice).ok, true);
    assert.equal(engine.snapshot().state[routeCase.commitmentKey], routeCase.commitmentValue);

    const saved = engine.save();
    const restored = new NarrativeEngine(graph);
    assert.equal(restored.load(saved), true);
    assert.deepEqual(restored.snapshot(), engine.snapshot());
    assert.equal(restored.snapshot().state.route, routeCase.id);
    assert.equal(restored.snapshot().state.routeLocked, true);
  }
});

test('EP6 Back restores the unlocked pre-route state and does not leave multiple routes active', () => {
  const engine = new NarrativeEngine(graph);
  reachEpisode6(engine);
  const routeChoiceState = engine.snapshot();
  assert.equal(engine.choose('ep6_route_matteo').ok, true);
  assert.equal(engine.snapshot().state.route, 'matteo');
  assert.equal(engine.snapshot().state.routeLocked, true);
  assert.equal(engine.back(), true);
  assert.deepEqual(engine.snapshot().cursor, routeChoiceState.cursor);
  assert.deepEqual(engine.snapshot().state, routeChoiceState.state);
  assert.deepEqual(engine.choices().map(choice => choice.id), routeCases.map(candidate => candidate.choice));
  assert.equal(engine.choose('ep6_route_leo').ok, true);
  assert.equal(engine.snapshot().state.route, 'leo');
  assert.equal(engine.snapshot().state.routeLocked, true);
  assert.equal(engine.snapshot().state.routeLockSource, 'ep6_route_choice');
});

test('route-lock rejects inconsistent v4 saves and New Game clears the lock', () => {
  const engine = new NarrativeEngine(graph);
  reachEpisode6(engine);
  engine.choose('ep6_route_elio');
  const valid = JSON.parse(engine.save());
  const inconsistent = [
    { ...valid, state: { ...valid.state, route: 'leo', routeLocked: false } },
    { ...valid, state: { ...valid.state, route: 'none', routeLocked: true } },
    { ...valid, state: { ...valid.state, route: 'elio', routeLocked: true, routeLockSource: 'none' } }
  ];
  for (const payload of inconsistent) {
    const restored = new NarrativeEngine(graph);
    assert.equal(restored.load(JSON.stringify(payload)), false);
  }
  assert.equal(engine.newGame(), true);
  assert.equal(engine.snapshot().cursor.sceneId, 'ep1_arrival');
  assert.equal(engine.snapshot().state.route, 'none');
  assert.equal(engine.snapshot().state.routeLocked, false);
  assert.equal(engine.snapshot().state.routeLockSource, 'none');
});

test('an older v4 save receives EP6 defaults without changing its route state', () => {
  const engine = new NarrativeEngine(graph);
  const payload = JSON.parse(engine.save());
  delete payload.state.routeLockSource;
  delete payload.state.exclusiveTermsSeen;
  delete payload.state.aureaClientKnown;
  delete payload.state.matteoCommitment;
  delete payload.state.leoCommitment;
  delete payload.state.elioCommitment;
  delete payload.state.independentProgress;
  delete payload.state.publicDisclosure;
  for (const item of payload.history) {
    delete item.state.routeLockSource;
    delete item.state.exclusiveTermsSeen;
    delete item.state.aureaClientKnown;
    delete item.state.matteoCommitment;
    delete item.state.leoCommitment;
    delete item.state.elioCommitment;
    delete item.state.independentProgress;
    delete item.state.publicDisclosure;
  }
  const restored = new NarrativeEngine(graph);
  assert.equal(restored.load(JSON.stringify(payload)), true);
  assert.equal(restored.snapshot().state.route, 'none');
  assert.equal(restored.snapshot().state.routeLocked, false);
  assert.equal(restored.snapshot().state.routeLockSource, 'none');
  assert.equal(restored.snapshot().state.independentProgress, 'none');
  assert.equal(restored.snapshot().state.publicDisclosure, 'none');
});

function enterEpisode7(engine, routeCase) {
  reachEpisode6(engine);
  assert.equal(engine.choose(routeCase.routeChoice).ok, true);
  while (!engine.isEpisodeComplete()) {
    const choices = engine.choices();
    if (choices.length) assert.equal(engine.choose(choices[0].id).ok, true);
    else assert.equal(engine.advance().ok, true);
  }
  assert.deepEqual(engine.continueEpisode(), { ok: true, type: 'episode', episode: 7 });
  assert.equal(engine.snapshot().cursor.sceneId, 'ep7_entry');
  while (!engine.choices().length) assert.equal(engine.advance().ok, true);
  assert.equal(engine.choices().length, 1);
  assert.equal(engine.choices()[0].id, routeCase.entryChoice);
  assert.equal(engine.choose(routeCase.entryChoice).ok, true);
  while (!engine.choices().length) assert.equal(engine.advance().ok, true);
}

const ep7RouteCases = [
  {
    route: 'matteo',
    routeChoice: 'ep6_route_matteo',
    entryChoice: 'ep7_enter_matteo',
    startScene: 'ep7_matteo_market',
    commitmentKey: 'matteoCommitment',
    commitmentValue: 'mutual-plan',
    careerKey: 'matteoCareerChoice',
    careerValue: 'delegation'
  },
  {
    route: 'leo',
    routeChoice: 'ep6_route_leo',
    entryChoice: 'ep7_enter_leo',
    startScene: 'ep7_leo_archive',
    commitmentKey: 'leoCommitment',
    commitmentValue: 'heritage-plan',
    careerKey: 'leoCareerChoice',
    careerValue: 'heritage-plan'
  },
  {
    route: 'elio',
    routeChoice: 'ep6_route_elio',
    entryChoice: 'ep7_enter_elio',
    startScene: 'ep7_elio_night_kitchen',
    commitmentKey: 'elioCommitment',
    commitmentValue: 'hybrid-plan',
    careerKey: 'elioCareerChoice',
    careerValue: 'hybrid-plan'
  },
  {
    route: 'independent',
    routeChoice: 'ep6_route_independent',
    entryChoice: 'ep7_enter_independent',
    startScene: 'ep7_independent_portfolio',
    commitmentKey: 'independentProgress',
    commitmentValue: 'self-authored',
    careerKey: 'nikaCareerPlan',
    careerValue: 'portfolio'
  }
];

test('EP7 reaches four distinct route families with localized consequences and a non-final transition', () => {
  for (const routeCase of ep7RouteCases) {
    const engine = new NarrativeEngine(graph);
    enterEpisode7(engine, routeCase);
    const seen = new Set();
    let guard = 0;
    while (!engine.isEpisodeComplete()) {
      seen.add(engine.snapshot().cursor.sceneId);
      const choices = engine.choices();
      if (choices.length) assert.equal(engine.choose(choices[0].id).ok, true);
      else assert.equal(engine.advance().ok, true);
      assert.ok(guard++ < 200, `EP7 ${routeCase.route} did not terminate`);
    }
    seen.add(engine.snapshot().cursor.sceneId);
    const state = engine.snapshot().state;
    assert.equal(engine.snapshot().cursor.sceneId, 'ep7_transition');
    assert.equal(state.route, routeCase.route);
    assert.equal(state.routeLocked, true);
    assert.equal(state.exclusiveTermsSeen, true);
    assert.equal(state.aureaClientKnown, true);
    assert.equal(state.investorTerms, 'control-risk');
    assert.equal(state.alternativeBudget, 'draft');
    assert.equal(state[routeCase.commitmentKey], routeCase.commitmentValue);
    assert.equal(state[routeCase.careerKey], routeCase.careerValue);
    assert.ok(seen.has(routeCase.startScene));
    assert.ok(seen.size >= 5, `EP7 ${routeCase.route} needs its own scene family`);
    assert.equal(engine.currentScene().episodeEnd, true);
    assert.equal(engine.currentScene().ending, undefined);
    assert.equal(engine.currentScene().endingId, undefined);

    const saved = engine.save();
    const restored = new NarrativeEngine(graph);
    assert.equal(restored.load(saved), true);
    assert.deepEqual(restored.snapshot(), engine.snapshot());
    const beforeLocale = restored.snapshot();
    assert.equal(restored.setLocale('en'), true);
    assert.deepEqual(restored.snapshot().state, beforeLocale.state);
    assert.deepEqual(restored.snapshot().cursor, beforeLocale.cursor);
  }
});

test('EP7 alternate choices preserve route-lock while carrying distinct professional costs forward', () => {
  const negativeCases = [
    {
      routeCase: ep7RouteCases[0],
      choices: ['ep7_matteo_ask_plain_terms', 'ep7_matteo_keep_control', 'ep7_matteo_pause_after_boundary'],
      expected: { matteoCommitment: 'deferred', matteoCareerChoice: 'control', relationshipMatteo: 1 }
    },
    {
      routeCase: ep7RouteCases[1],
      choices: ['ep7_leo_keep_map_private', 'ep7_leo_take_aurea_route', 'ep7_leo_keep_present_distance'],
      expected: { leoCommitment: 'avoidance', leoCareerChoice: 'aurea', leoAccountability: 'acknowledged' }
    },
    {
      routeCase: ep7RouteCases[2],
      choices: ['ep7_elio_make_private_menu', 'ep7_elio_take_all_credit', 'ep7_elio_leave_without_plan'],
      expected: { elioCommitment: 'unplanned-departure', elioCareerChoice: 'unplanned-departure', elioClarity: 'discussed' }
    },
    {
      routeCase: ep7RouteCases[3],
      choices: ['ep7_independent_take_any_fee', 'ep7_independent_discount_to_save_villa', 'ep7_independent_do_alone'],
      expected: { independentProgress: 'self-authored', alternativeBudget: 'underfunded', staffProtection: 'requested', staffTrust: 2 }
    }
  ];

  for (const negativeCase of negativeCases) {
    const engine = new NarrativeEngine(graph);
    enterEpisode7(engine, negativeCase.routeCase);
    for (const choiceId of negativeCase.choices) chooseById(engine, choiceId);
    advanceToEpisodeEnd(engine);
    const state = engine.snapshot().state;
    assert.equal(state.route, negativeCase.routeCase.route);
    assert.equal(state.routeLocked, true);
    for (const [key, value] of Object.entries(negativeCase.expected)) assert.equal(state[key], value, `${negativeCase.routeCase.route}:${key}`);
    assert.equal(engine.snapshot().cursor.sceneId, 'ep7_transition');
  }
});

test('EP7 Back rewinds route-local consequences and New Game clears the expanded season state', () => {
  const engine = new NarrativeEngine(graph);
  enterEpisode7(engine, ep7RouteCases[0]);
  const beforeChoice = engine.snapshot();
  assert.equal(engine.choose('ep7_matteo_open_ledger').ok, true);
  assert.notDeepEqual(engine.snapshot().state, beforeChoice.state);
  assert.equal(engine.back(), true);
  assert.deepEqual(engine.snapshot().cursor, beforeChoice.cursor);
  assert.deepEqual(engine.snapshot().state, beforeChoice.state);
  assert.equal(engine.choices().map(choice => choice.id).join(','), 'ep7_matteo_open_ledger,ep7_matteo_ask_plain_terms');

  assert.equal(engine.newGame(), true);
  const reset = engine.snapshot();
  assert.equal(reset.cursor.sceneId, 'ep1_arrival');
  assert.equal(reset.state.route, 'none');
  assert.equal(reset.state.routeLocked, false);
  assert.equal(reset.state.alternativeBudget, 'none');
  assert.equal(reset.state.matteoCareerChoice, 'none');
  assert.equal(reset.state.nikaCareerPlan, 'none');
});

test('EP7 graph is fully reachable without route switching or premature relationship endings', () => {
  for (const routeCase of ep7RouteCases) {
    const ep7Graph = structuredClone(graph);
    ep7Graph.start = 'ep7_entry';
    ep7Graph.scenes = structuredClone(graph.scenes.filter(scene => scene.episode === 7));
    const ep7Transition = ep7Graph.scenes.find(scene => scene.id === 'ep7_transition');
    delete ep7Transition.episodeEnd;
    delete ep7Transition.next;
    ep7Transition.ending = true;
    ep7Graph.initialState.route = routeCase.route;
    ep7Graph.initialState.routeLocked = true;
    ep7Graph.initialState.routeLockSource = 'ep6_route_choice';
    const report = exploreGraph(ep7Graph, { maxStates: 50_000 });
    assert.equal(report.valid, true, `${routeCase.route}: ${report.errors.join('; ')}`);
    assert.deepEqual([...report.routes], [routeCase.route]);
    assert.equal(report.visitedScenes.has('ep7_entry'), true);
    assert.equal(report.visitedScenes.has(routeCase.startScene), true);
    assert.equal(report.terminals.every(terminal => terminal.sceneId === 'ep7_transition'), true);
    assert.equal(report.terminals.every(terminal => terminal.endingId === null), true);
  }
});

function enterEpisode8(engine, routeCase) {
  enterEpisode7(engine, routeCase);
  advanceToEpisodeEnd(engine);
  assert.deepEqual(engine.continueEpisode(), { ok: true, type: 'episode', episode: 8 });
  assert.equal(engine.snapshot().cursor.sceneId, 'ep8_entry');
  while (!engine.choices().length) assert.equal(engine.advance().ok, true);
  assert.equal(engine.choices().length, 1);
  assert.equal(engine.choices()[0].id, routeCase.entryChoice8);
  assert.equal(engine.choose(routeCase.entryChoice8).ok, true);
  while (!engine.choices().length) assert.equal(engine.advance().ok, true);
}

const ep8RouteCases = [
  { ...ep7RouteCases[0], entryChoice8: 'ep8_enter_matteo', startScene8: 'ep8_matteo_delegation' },
  { ...ep7RouteCases[1], entryChoice8: 'ep8_enter_leo', startScene8: 'ep8_leo_aurea_conflict' },
  { ...ep7RouteCases[2], entryChoice8: 'ep8_enter_elio', startScene8: 'ep8_elio_offer' },
  { ...ep7RouteCases[3], entryChoice8: 'ep8_enter_independent', startScene8: 'ep8_independent_budget' }
];

test('EP8 keeps all four locked route families distinct and reaches only a non-final transition', () => {
  for (const routeCase of ep8RouteCases) {
    const engine = new NarrativeEngine(graph);
    enterEpisode8(engine, routeCase);
    assert.equal(engine.snapshot().cursor.sceneId, routeCase.startScene8);
    assert.equal(engine.snapshot().state.route, routeCase.route);
    assert.equal(engine.snapshot().state.routeLocked, true);
    const seen = new Set();
    let guard = 0;
    while (!engine.isEpisodeComplete()) {
      seen.add(engine.snapshot().cursor.sceneId);
      const choices = engine.choices();
      if (choices.length) assert.equal(engine.choose(choices[0].id).ok, true);
      else assert.equal(engine.advance().ok, true);
      assert.ok(guard++ < 200, `EP8 ${routeCase.route} did not terminate`);
    }
    seen.add(engine.snapshot().cursor.sceneId);
    assert.equal(engine.snapshot().cursor.sceneId, 'ep8_transition');
    assert.equal(engine.currentScene().episodeEnd, true);
    assert.equal(engine.currentScene().endingId, undefined);
    assert.equal(engine.snapshot().state.route, routeCase.route);
    assert.equal(engine.snapshot().state.routeLocked, true);
    assert.equal(engine.snapshot().state.budgetGapKnown, true);
    assert.ok(['viable', 'underfunded'].includes(engine.snapshot().state.alternativeBudget));
    assert.ok(seen.has(routeCase.startScene8));
    assert.ok(seen.size >= 5, `EP8 ${routeCase.route} needs its own scene family`);

    const restored = new NarrativeEngine(graph);
    assert.equal(restored.load(engine.save()), true);
    assert.deepEqual(restored.snapshot(), engine.snapshot());
    const beforeLocale = restored.snapshot();
    assert.equal(restored.setLocale('en'), true);
    assert.deepEqual(restored.snapshot().state, beforeLocale.state);
    assert.deepEqual(restored.snapshot().cursor, beforeLocale.cursor);
  }
});

test('EP8 Back and alternate route decisions preserve route-lock, budget consequences, and New Game reset', () => {
  const cases = [
    { routeCase: ep8RouteCases[0], choices: ['ep8_matteo_reclaim_control', 'ep8_matteo_keep_terms_private', 'ep8_matteo_leave_control_unchecked'], expected: { matteoCareerChoice: 'control', alternativeBudget: 'underfunded' } },
    { routeCase: ep8RouteCases[1], choices: ['ep8_leo_take_aurea_promotion', 'ep8_leo_keep_heritage_plan', 'ep8_leo_choose_aurea'], expected: { leoCareerChoice: 'aurea', alternativeBudget: 'underfunded' } },
    { routeCase: ep8RouteCases[2], choices: ['ep8_elio_leave_without_contract', 'ep8_elio_keep_menu_private', 'ep8_elio_leave_without_plan'], expected: { elioCareerChoice: 'unplanned-departure', alternativeBudget: 'underfunded' } },
    { routeCase: ep8RouteCases[3], choices: ['ep8_independent_discount_rate', 'ep8_independent_work_alone', 'ep8_independent_choose_portfolio'], expected: { nikaCareerPlan: 'portfolio', alternativeBudget: 'underfunded' } }
  ];

  for (const testCase of cases) {
    const engine = new NarrativeEngine(graph);
    enterEpisode8(engine, testCase.routeCase);
    const beforeChoice = engine.snapshot();
    assert.equal(engine.choose(testCase.choices[0]).ok, true);
    assert.equal(engine.back(), true);
    assert.deepEqual(engine.snapshot().cursor, beforeChoice.cursor);
    assert.deepEqual(engine.snapshot().state, beforeChoice.state);
    for (const choiceId of testCase.choices) chooseById(engine, choiceId);
    advanceToEpisodeEnd(engine);
    const state = engine.snapshot().state;
    assert.equal(state.route, testCase.routeCase.route);
    assert.equal(state.routeLocked, true);
    assert.equal(state.budgetGapKnown, true);
    for (const [key, value] of Object.entries(testCase.expected)) assert.equal(state[key], value, `${testCase.routeCase.route}:${key}`);
    assert.equal(engine.newGame(), true);
    assert.equal(engine.snapshot().cursor.sceneId, 'ep1_arrival');
    assert.equal(engine.snapshot().state.route, 'none');
    assert.equal(engine.snapshot().state.routeLocked, false);
    assert.equal(engine.snapshot().state.budgetGapKnown, false);
  }
});

const ep9RouteCases = [
  { ...ep8RouteCases[0], entryChoice9: 'ep9_enter_matteo', startScene9: 'ep9_matteo_anniversary', payoffScene9: 'ep9_matteo_payoff' },
  { ...ep8RouteCases[1], entryChoice9: 'ep9_enter_leo', startScene9: 'ep9_leo_anniversary', payoffScene9: 'ep9_leo_payoff' },
  { ...ep8RouteCases[2], entryChoice9: 'ep9_enter_elio', startScene9: 'ep9_elio_anniversary', payoffScene9: 'ep9_elio_payoff' },
  { ...ep8RouteCases[3], entryChoice9: 'ep9_enter_independent', startScene9: 'ep9_independent_anniversary', payoffScene9: 'ep9_independent_payoff' }
];

function enterEpisode9(engine, routeCase) {
  enterEpisode8(engine, routeCase);
  advanceToEpisodeEnd(engine);
  assert.deepEqual(engine.continueEpisode(), { ok: true, type: 'episode', episode: 9 });
  assert.equal(engine.snapshot().cursor.sceneId, 'ep9_entry');
  chooseById(engine, routeCase.entryChoice9);
  assert.equal(engine.snapshot().cursor.sceneId, routeCase.startScene9);
}

test('EP9 stages the anniversary forum across all locked routes without resolving the season', () => {
  for (const routeCase of ep9RouteCases) {
    const engine = new NarrativeEngine(graph);
    enterEpisode9(engine, routeCase);
    while (engine.snapshot().cursor.sceneId !== 'ep9_public_forum') {
      const choices = engine.choices();
      if (choices.length) assert.equal(engine.choose(choices[0].id).ok, true);
      else assert.equal(engine.advance().ok, true);
    }
    while (!engine.choices().length) assert.equal(engine.advance().ok, true);
    assert.equal(engine.snapshot().state.route, routeCase.route);
    assert.equal(engine.snapshot().state.routeLocked, true);
    assert.deepEqual(engine.choices().map(choice => choice.id), [
      `ep9_forum_full_${routeCase.route}`,
      `ep9_forum_verified_${routeCase.route}`,
      `ep9_forum_protect_${routeCase.route}`
    ]);

    assert.equal(engine.choose(`ep9_forum_full_${routeCase.route}`).ok, true);
    assert.equal(engine.snapshot().cursor.sceneId, routeCase.payoffScene9);
    assert.equal(engine.snapshot().state.hotelEvidence, 'public');
    assert.equal(engine.snapshot().state.routeLocked, true);
    advanceToEpisodeEnd(engine);
    assert.equal(engine.snapshot().cursor.sceneId, 'ep9_transition');
    assert.equal(engine.currentScene().ending, true);
    assert.equal(engine.currentScene().endingId, undefined);
    assert.equal(engine.snapshot().state.route, routeCase.route);
  }
});

test('EP9 Back, New Game, save v4, and alternate public disclosures preserve route state', () => {
  const engine = new NarrativeEngine(graph);
  enterEpisode9(engine, ep9RouteCases[0]);
  while (engine.snapshot().cursor.sceneId !== 'ep9_public_forum') {
    if (engine.choices().length) assert.equal(engine.choose(engine.choices()[0].id).ok, true);
    else assert.equal(engine.advance().ok, true);
  }
  while (!engine.choices().length) assert.equal(engine.advance().ok, true);
  const beforeForum = engine.snapshot();
  assert.equal(engine.choose('ep9_forum_verified_matteo').ok, true);
  assert.equal(engine.back(), true);
  assert.deepEqual(engine.snapshot().cursor, beforeForum.cursor);
  assert.deepEqual(engine.snapshot().state, beforeForum.state);
  assert.equal(engine.choose('ep9_forum_protect_matteo').ok, true);
  assert.equal(engine.snapshot().state.hotelEvidence, 'staff');
  assert.equal(engine.snapshot().state.publicDisclosure, 'withheld');
  assert.equal(engine.snapshot().state.staffProtection, 'requested');
  const saved = engine.save();
  const restored = new NarrativeEngine(graph, { locale: 'en' });
  assert.equal(restored.load(saved), true);
  assert.deepEqual(restored.snapshot(), engine.snapshot());
  assert.equal(restored.setLocale('en'), true);
  assert.equal(restored.snapshot().state.route, 'matteo');
  assert.equal(restored.newGame(), true);
  assert.equal(restored.snapshot().cursor.sceneId, 'ep1_arrival');
  assert.equal(restored.snapshot().state.route, 'none');
  assert.equal(restored.snapshot().state.routeLocked, false);
});
