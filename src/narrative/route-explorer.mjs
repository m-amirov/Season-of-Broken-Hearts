import { applyEffects, canEnter, createInitialState, getDialogueLines, validateGraph } from './state.mjs';

function stateKey(state) {
  return JSON.stringify(Object.keys(state).sort().map(key => [key, state[key]]));
}

function cursorKey(node) {
  return `${node.sceneId}:${node.dialogueIndex}:${stateKey(node.state)}`;
}

export function exploreGraph(graph, options = {}) {
  const maxStates = options.maxStates ?? 100_000;
  const validation = validateGraph(graph);
  if (!validation.valid) {
    return { valid: false, errors: validation.errors, terminals: [], routes: new Set(), hotelOutcomes: new Set(), truncated: false, visitedStates: 0, visitedScenes: new Set(), deadEnds: [] };
  }
  const sceneById = new Map(graph.scenes.map(scene => [scene.id, scene]));
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
    const key = cursorKey(node);
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
        queue.push({
          sceneId: choice.to,
          dialogueIndex: 0,
          state: applyEffects(node.state, choice.effects, graph.stateSchema),
          path: [...node.path, choice.id]
        });
      }
      continue;
    }
    if (scene.episodeEnd === true) {
      if (!scene.next || !sceneById.has(scene.next)) errors.push(`dangling-next-episode:${scene.id}:${scene.next ?? ''}`);
      else queue.push({ ...node, sceneId: scene.next, dialogueIndex: 0, path: [...node.path, `episode:${scene.next}`] });
      continue;
    }
    if (scene.ending === true) {
      terminals.push({ sceneId: scene.id, endingId: scene.endingId ?? null, state: structuredClone(node.state), path: node.path });
      continue;
    }
    if (scene.next) {
      queue.push({ ...node, sceneId: scene.next, dialogueIndex: 0 });
    } else {
      deadEnds.push(scene.id);
    }
  }

  const routes = new Set(terminals.map(terminal => terminal.state.route).filter(route => route && route !== 'none'));
  const hotelOutcomes = new Set(terminals.map(terminal => terminal.state.hotelOutcome).filter(outcome => outcome && outcome !== 'none'));
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
