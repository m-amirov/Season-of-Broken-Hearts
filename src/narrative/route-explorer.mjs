import { applyEffects, canEnter, createInitialState, getDialogueLines, validateGraph } from './state.mjs';
import { resolveSceneState } from './final-resolvers.mjs';

function relevantStateKeys(graph) {
  const keys = new Set(Object.keys(graph.stateSchema ?? {}));
  const relevantByScene = new Map(graph.scenes.map(scene => [scene.id, new Set()]));
  const mark = (sceneId, names) => {
    const target = relevantByScene.get(sceneId);
    if (!target) return;
    for (const name of names) if (keys.has(name)) target.add(name);
  };

  for (const scene of graph.scenes) {
    for (const choice of scene.choices ?? []) mark(scene.id, Object.keys(choice.requires ?? {}));
    for (const lines of Object.values(scene.dialogue ?? {})) {
      for (const line of lines ?? []) mark(scene.id, Object.keys(line.when ?? {}));
    }
    if (scene.resolver === 'relationship-ending') {
      mark(scene.id, [
        'route', 'trustMatteo', 'relationshipMatteo', 'matteoCommitment', 'matteoCareerChoice',
        'trustLeo', 'relationshipLeo', 'leoAccountability', 'leoCareerChoice',
        'trustElio', 'relationshipElio', 'elioClarity', 'elioCareerChoice',
        'independentProgress', 'nikaCareerPlan', 'ep10FinalAction', 'publicDisclosure', 'endingId'
      ]);
    }
    if (scene.resolver === 'hotel-outcome') {
      mark(scene.id, [
        'alternativeBudget', 'staffTrust', 'fundingEvidence', 'staffProtection',
        'publicDisclosure', 'investorTerms', 'hotelOutcome'
      ]);
    }
    if (scene.ending === true) mark(scene.id, ['endingId', 'hotelOutcome']);
  }

  const edges = new Map();
  for (const scene of graph.scenes) {
    const outgoing = scene.choices?.length
      ? scene.choices.map(choice => ({ to: choice.to, effects: choice.effects ?? {} }))
      : scene.next ? [{ to: scene.next, effects: {} }] : [];
    edges.set(scene.id, outgoing);
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const scene of graph.scenes) {
      const current = relevantByScene.get(scene.id);
      for (const edge of edges.get(scene.id) ?? []) {
        for (const key of relevantByScene.get(edge.to) ?? []) {
          if (!Object.prototype.hasOwnProperty.call(edge.effects, key) && !current.has(key)) {
            current.add(key);
            changed = true;
          }
        }
      }
    }
  }
  return relevantByScene;
}

function stateKey(state, relevantKeys) {
  return JSON.stringify([...relevantKeys].sort().map(key => [key, state[key]]));
}

function cursorKey(node, relevantByScene) {
  return `${node.sceneId}:${node.dialogueIndex}:${stateKey(node.state, relevantByScene.get(node.sceneId) ?? [])}`;
}

export function exploreGraph(graph, options = {}) {
  const maxStates = options.maxStates ?? 100_000;
  const validation = validateGraph(graph);
  if (!validation.valid) {
    return { valid: false, errors: validation.errors, terminals: [], routes: new Set(), hotelOutcomes: new Set(), truncated: false, visitedStates: 0, visitedScenes: new Set(), deadEnds: [] };
  }
  const sceneById = new Map(graph.scenes.map(scene => [scene.id, scene]));
  const relevantByScene = relevantStateKeys(graph);
  const queue = [{ sceneId: graph.start, dialogueIndex: 0, state: createInitialState(graph), path: [] }];
  const visited = new Set();
  const terminals = [];
  const deadEnds = [];
  const visitedScenes = new Set();
  const errors = [];
  let truncated = false;

  while (queue.length) {
    if (visited.size >= maxStates) {
      truncated = true;
      break;
    }
    const node = queue.shift();
    const key = cursorKey(node, relevantByScene);
    if (visited.has(key)) continue;
    visited.add(key);
    const scene = sceneById.get(node.sceneId);
    if (!scene) {
      errors.push(`missing-scene:${node.sceneId}`);
      continue;
    }
    visitedScenes.add(scene.id);
    const lines = getDialogueLines(scene, 'ru', node.state);
    if (!lines.length) {
      errors.push(`empty-dialogue:${scene.id}`);
      continue;
    }
    if (node.dialogueIndex < lines.length - 1) {
      queue.push({ ...node, dialogueIndex: node.dialogueIndex + 1 });
      continue;
    }

    const choices = (scene.choices ?? []).filter(choice => canEnter(choice, node.state));
    if (choices.length) {
      for (const choice of choices) {
        const targetScene = sceneById.get(choice.to);
        queue.push({
          sceneId: choice.to,
          dialogueIndex: 0,
          state: resolveSceneState(applyEffects(node.state, choice.effects, graph.stateSchema), targetScene),
          path: [...node.path, choice.id]
        });
      }
      continue;
    }
    if (scene.episodeEnd === true) {
      if (!scene.next || !sceneById.has(scene.next)) errors.push(`dangling-next-episode:${scene.id}:${scene.next ?? ''}`);
      else queue.push({
        ...node,
        sceneId: scene.next,
        dialogueIndex: 0,
        state: resolveSceneState(node.state, sceneById.get(scene.next)),
        path: [...node.path, `episode:${scene.next}`]
      });
      continue;
    }
    if (scene.ending === true) {
      const resolvedEnding = node.state.endingId && node.state.endingId !== 'unresolved'
        ? node.state.endingId
        : scene.endingId ?? null;
      terminals.push({ sceneId: scene.id, endingId: resolvedEnding, state: structuredClone(node.state), path: node.path });
      continue;
    }
    if (scene.next) {
      queue.push({
        ...node,
        sceneId: scene.next,
        dialogueIndex: 0,
        state: resolveSceneState(node.state, sceneById.get(scene.next))
      });
    } else {
      deadEnds.push(scene.id);
    }
  }

  const routes = new Set(terminals.map(terminal => terminal.state.route).filter(route => route && route !== 'none'));
  const hotelOutcomes = new Set(terminals.map(terminal => terminal.state.hotelOutcome).filter(outcome => outcome && !['none', 'unresolved'].includes(outcome)));
  return { valid: !errors.length && !deadEnds.length && !truncated, errors, terminals, routes, hotelOutcomes, truncated, visitedStates: visited.size, visitedScenes, deadEnds };
}

export function validateReachability(graph, expectations = {}) {
  const report = exploreGraph(graph, expectations);
  const errors = [...report.errors];
  for (const route of expectations.routes ?? []) if (!report.routes.has(route)) errors.push(`unreachable-route:${route}`);
  for (const endingId of expectations.relationshipEndings ?? []) {
    if (!report.terminals.some(terminal => terminal.endingId === endingId)) errors.push(`unreachable-ending:${endingId}`);
  }
  for (const outcome of expectations.hotelOutcomes ?? []) if (!report.hotelOutcomes.has(outcome)) errors.push(`unreachable-hotel-outcome:${outcome}`);
  return { ...report, valid: !errors.length && !report.deadEnds.length && !report.truncated, errors };
}
