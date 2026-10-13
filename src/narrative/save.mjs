import { getDialogueLines, validateGraph } from './state.mjs';

export const CURRENT_SAVE_VERSION = 3;

function episodeNumber(scene) {
  return Number.isSafeInteger(scene?.episode) && scene.episode > 0 ? scene.episode : 1;
}

export function validReaderProgress(progress, graph) {
  if (!progress || typeof progress !== 'object' || Array.isArray(progress)) return false;
  const available = new Set(graph.scenes.map(episodeNumber));
  return Number.isSafeInteger(progress.tutorialAdvances) &&
    progress.tutorialAdvances >= 0 && progress.tutorialAdvances <= 2 &&
    Array.isArray(progress.seenEpisodes) &&
    progress.seenEpisodes.length <= available.size &&
    progress.seenEpisodes.every(episode => available.has(episode)) &&
    new Set(progress.seenEpisodes).size === progress.seenEpisodes.length;
}

export function legacyReaderProgress(payload, graph) {
  const visited = new Set();
  // Existing v2 saves may be mid-story: never replay a new opening slide over an old reader.
  if (graph && (payload.history?.length || payload.cursor?.sceneId !== graph.start ||
    payload.cursor?.dialogueIndex > 0)) {
    for (const saved of [...(payload.history ?? []), payload.cursor]) {
      const scene = graph.scenes.find(item => item.id === saved?.sceneId);
      if (scene) visited.add(episodeNumber(scene));
    }
  }
  return {
    seenEpisodes: [...visited].sort((a, b) => a - b),
    tutorialAdvances: visited.size ? 2 : 0
  };
}


function validStateValue(value, definition) {
  return typeof value === definition?.type &&
    (definition.type === 'boolean' || definition.values.includes(value));
}

function migrateState(state, graph) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) throw new Error('Invalid save state');
  const migrated = structuredClone(graph.initialState);
  for (const [key, value] of Object.entries(state)) {
    if (!graph.stateSchema[key] || !validStateValue(value, graph.stateSchema[key])) {
      throw new Error(`Invalid save state field ${key}`);
    }
    migrated[key] = value;
  }
  return migrated;
}

function validCursor(cursor, graph, locale, state) {
  const scene = graph.scenes.find(candidate => candidate.id === cursor?.sceneId);
  const lines = scene ? getDialogueLines(scene, locale, state) : [];
  return Boolean(
    scene &&
    graph.locales.includes(locale) &&
    Number.isSafeInteger(cursor.dialogueIndex) &&
    cursor.dialogueIndex >= 0 &&
    cursor.dialogueIndex < lines.length
  );
}

function isValidState(state, graph) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return false;
  const keys = Object.keys(graph.stateSchema).sort();
  return JSON.stringify(Object.keys(state).sort()) === JSON.stringify(keys) &&
    keys.every(key => {
      const definition = graph.stateSchema[key];
      return typeof state[key] === definition.type &&
        (definition.type === 'boolean' || definition.values.includes(state[key]));
    });
}

export function migrateSave(payload, graph = null) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Invalid save payload');
  const version = payload.schemaVersion ?? 0;
  if (version > CURRENT_SAVE_VERSION) throw new Error(`Future save version ${version} is not supported`);
  if (version < CURRENT_SAVE_VERSION) {
    // v2 has an already-validated state schema; only v0/v1 need field migration.
    const needsStateMigration = version < 2;
    const state = graph && needsStateMigration ? migrateState(payload.state, graph) : payload.state;
    const history = Array.isArray(payload.history)
      ? payload.history.map(item => ({
          ...item,
          state: graph && needsStateMigration ? migrateState(item.state, graph) : item.state
        }))
      : [];
    return {
      schemaVersion: CURRENT_SAVE_VERSION,
      locale: payload.locale ?? 'ru',
      cursor: payload.cursor,
      state,
      history,
      readerProgress: legacyReaderProgress(payload, graph)
    };
  }
  return structuredClone(payload);
}

export function serializeSave(snapshot) {
  return JSON.stringify({
    schemaVersion: CURRENT_SAVE_VERSION,
    locale: snapshot.locale,
    cursor: snapshot.cursor,
    state: snapshot.state,
    history: snapshot.history ?? [],
    readerProgress: snapshot.readerProgress
  });
}

export function deserializeSave(raw, graph) {
  try {
    const payload = migrateSave(typeof raw === 'string' ? JSON.parse(raw) : raw, graph);
    if (validateGraph(graph).valid !== true || !isValidState(payload.state, graph) || !validCursor(payload.cursor, graph, payload.locale, payload.state) ||
      !validReaderProgress(payload.readerProgress, graph)) return null;
    const history = (payload.history ?? []).filter(item => isValidState(item.state, graph) && validCursor(item, graph, payload.locale, item.state));
    return {
      schemaVersion: CURRENT_SAVE_VERSION,
      locale: payload.locale,
      cursor: structuredClone(payload.cursor),
      state: structuredClone(payload.state),
      history: structuredClone(history),
      readerProgress: structuredClone(payload.readerProgress)
    };
  } catch {
    return null;
  }
}
