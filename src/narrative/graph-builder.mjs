import { validateGraph } from './state.mjs';

function clone(value) {
  return structuredClone(value);
}

function sameDefinition(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function mergeStateSchema(graph, fragments) {
  const stateSchema = clone(graph.stateSchema ?? {});
  const initialState = clone(graph.initialState ?? {});
  for (const fragment of fragments) {
    for (const [key, definition] of Object.entries(fragment.stateSchema ?? {})) {
      if (stateSchema[key] && !sameDefinition(stateSchema[key], definition)) {
        throw new Error(`Conflicting state definition for ${key}`);
      }
      stateSchema[key] = clone(definition);
    }
    for (const [key, values] of Object.entries(fragment.stateSchemaExtensions ?? {})) {
      if (!stateSchema[key] || !Array.isArray(values) || stateSchema[key].type === 'boolean') {
        throw new Error(`Invalid state domain extension for ${key}`);
      }
      stateSchema[key] = {
        ...clone(stateSchema[key]),
        values: [...new Set([...(stateSchema[key].values ?? []), ...values])]
      };
    }
    for (const [key, value] of Object.entries(fragment.initialState ?? {})) {
      if (key in initialState && !sameDefinition(initialState[key], value)) {
        throw new Error(`Conflicting initial state value for ${key}`);
      }
      initialState[key] = clone(value);
    }
  }
  return { stateSchema, initialState };
}

export function buildGraph(baseGraph, fragments = []) {
  if (!baseGraph || !Array.isArray(baseGraph.scenes)) throw new Error('Base graph is invalid');
  const ordered = [...fragments].sort((left, right) => left.episode - right.episode);
  const seenEpisodes = new Set();
  const seenScenes = new Set();
  for (const scene of baseGraph.scenes.filter(candidate => (candidate.episode ?? 1) < 2)) {
    if (seenScenes.has(scene.id)) throw new Error(`Duplicate base scene ${scene.id}`);
    seenScenes.add(scene.id);
  }
  for (const fragment of ordered) {
    if (!Number.isSafeInteger(fragment.episode) || fragment.episode < 2) {
      throw new Error('Episode fragments must have an episode number >= 2');
    }
    if (seenEpisodes.has(fragment.episode)) throw new Error(`Duplicate episode fragment ${fragment.episode}`);
    seenEpisodes.add(fragment.episode);
    if (!Array.isArray(fragment.scenes) || !fragment.scenes.length) throw new Error(`Episode ${fragment.episode} has no scenes`);
    for (const scene of fragment.scenes) {
      if (!scene?.id || seenScenes.has(scene.id)) throw new Error(`Duplicate or missing scene ${scene?.id ?? ''}`);
      if (scene.episode !== fragment.episode) throw new Error(`Scene ${scene.id} has the wrong episode number`);
      seenScenes.add(scene.id);
    }
  }

  const { stateSchema, initialState } = mergeStateSchema(baseGraph, ordered);
  const preservedBaseScenes = baseGraph.scenes
    .filter(scene => (scene.episode ?? 1) < 2)
    .map(clone);
  const scenes = [...preservedBaseScenes, ...ordered.flatMap(fragment => fragment.scenes.map(clone))];
  for (const fragment of ordered) {
    if (!fragment.start) continue;
    const previousScenes = scenes.filter(scene => (scene.episode ?? 1) === fragment.episode - 1);
    const previousEnd = previousScenes.at(-1);
    if (!previousEnd) throw new Error(`Cannot connect episode ${fragment.episode} without a previous episode`);
    if (previousEnd.ending === true) {
      delete previousEnd.ending;
      previousEnd.episodeEnd = true;
    }
    delete previousEnd.nextEpisodeStart;
    previousEnd.next = fragment.start;
  }
  const graph = {
    ...clone(baseGraph),
    stateSchema,
    initialState,
    scenes,
    episodeManifest: ordered.map(fragment => ({ episode: fragment.episode, start: fragment.start }))
  };
  const report = validateGraph(graph);
  if (!report.valid) throw new Error(`Built graph is invalid: ${report.errors.join(', ')}`);
  return graph;
}
