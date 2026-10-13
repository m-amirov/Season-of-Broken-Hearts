import { validateGraph } from './state.mjs';

export const CURRENT_SAVE_VERSION = 2;

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

function validCursor(cursor, graph, locale) {
  const scene = graph.scenes.find(candidate => candidate.id === cursor?.sceneId);
  return Boolean(
    scene &&
    graph.locales.includes(locale) &&
    Number.isSafeInteger(cursor.dialogueIndex) &&
    cursor.dialogueIndex >= 0 &&
    cursor.dialogueIndex < scene.dialogue[locale].length
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
    const state = graph ? migrateState(payload.state, graph) : payload.state;
    const history = Array.isArray(payload.history)
      ? payload.history.map(item => ({ ...item, state: graph ? migrateState(item.state, graph) : item.state }))
      : [];
    return {
      schemaVersion: CURRENT_SAVE_VERSION,
      locale: payload.locale ?? 'ru',
      cursor: payload.cursor,
      state,
      history
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
    history: snapshot.history ?? []
  });
}

export function deserializeSave(raw, graph) {
  try {
    const payload = migrateSave(typeof raw === 'string' ? JSON.parse(raw) : raw, graph);
    if (validateGraph(graph).valid !== true || !validCursor(payload.cursor, graph, payload.locale) || !isValidState(payload.state, graph)) return null;
    const history = (payload.history ?? []).filter(item => validCursor(item, graph, payload.locale) && isValidState(item.state, graph));
    return {
      schemaVersion: CURRENT_SAVE_VERSION,
      locale: payload.locale,
      cursor: structuredClone(payload.cursor),
      state: structuredClone(payload.state),
      history: structuredClone(history)
    };
  } catch {
    return null;
  }
}
