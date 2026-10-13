const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function isPrimitive(value) {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

function validateStateValue(key, value, definition, scope) {
  if (!definition || !['boolean', 'string', 'number'].includes(definition.type)) {
    return `${scope}:${key}:unknown-definition`;
  }
  if (typeof value !== definition.type || (definition.type === 'number' && !Number.isFinite(value))) {
    return `${scope}:${key}:wrong-type`;
  }
  if (definition.type !== 'boolean' && (!Array.isArray(definition.values) || !definition.values.includes(value))) {
    return `${scope}:${key}:out-of-domain`;
  }
  return null;
}

export function validateGraph(graph) {
  const errors = [];
  if (!graph || graph.schemaVersion !== 1 || typeof graph.start !== 'string' || !Array.isArray(graph.scenes)) {
    return { valid: false, errors: ['root:invalid-schema'] };
  }
  const sceneIds = new Set();
  const choiceIds = new Set();
  const locales = Array.isArray(graph.locales) ? graph.locales : [];
  const characters = new Set(Array.isArray(graph.characters) ? graph.characters : []);
  const stateSchema = graph.stateSchema ?? {};
  const stateKeys = Object.keys(stateSchema).sort();
  const initialKeys = Object.keys(graph.initialState ?? {}).sort();
  if (!locales.length) errors.push('root:missing-locales');
  if (JSON.stringify(stateKeys) !== JSON.stringify(initialKeys)) errors.push('root:initial-state-keys');
  for (const key of stateKeys) {
    const definition = stateSchema[key];
    if (definition.type !== 'boolean' && (!Array.isArray(definition.values) || !definition.values.length)) {
      errors.push(`state:${key}:unbounded-domain`);
    }
    const valueError = validateStateValue(key, graph.initialState?.[key], definition, 'initial');
    if (valueError) errors.push(valueError);
  }

  for (const scene of graph.scenes) {
    if (!scene?.id || sceneIds.has(scene.id)) {
      errors.push(`scene:${scene?.id ?? 'missing-id'}:duplicate-or-missing`);
      continue;
    }
    sceneIds.add(scene.id);
    const exits = [scene.ending === true, typeof scene.next === 'string', Array.isArray(scene.choices)]
      .filter(Boolean).length;
    if (exits !== 1) errors.push(`scene:${scene.id}:exit-count`);
    for (const locale of locales) {
      const lines = scene.dialogue?.[locale];
      if (!Array.isArray(lines) || !lines.length) {
        errors.push(`scene:${scene.id}:missing-dialogue:${locale}`);
        continue;
      }
      for (const [index, line] of lines.entries()) {
        if (!line?.text || (line.speaker !== null && !characters.has(line.speaker))) {
          errors.push(`scene:${scene.id}:dialogue:${locale}:${index}`);
        }
        if (line?.when !== undefined) {
          if (!line.when || typeof line.when !== 'object' || Array.isArray(line.when)) {
            errors.push(`scene:${scene.id}:dialogue:${locale}:${index}:invalid-when`);
          } else {
            for (const [key, value] of Object.entries(line.when)) {
              if (!own(stateSchema, key) || !isPrimitive(value)) {
                errors.push(`scene:${scene.id}:dialogue:${locale}:${index}:invalid-when:${key}`);
              } else {
                const valueError = validateStateValue(key, value, stateSchema[key], `scene:${scene.id}:dialogue:${locale}:${index}:when`);
                if (valueError) errors.push(valueError);
              }
            }
          }
        }
      }
    }
    for (const choice of scene.choices ?? []) {
      if (!choice?.id || typeof choice.id !== 'string' || choiceIds.has(choice.id) || sceneIds.has(choice.id) || typeof choice.to !== 'string') {
        errors.push(`choice:${scene.id}:invalid-id`);
      } else {
        choiceIds.add(choice.id);
      }
      for (const locale of locales) {
        if (!choice.label?.[locale]) errors.push(`choice:${scene.id}:${choice.id}:missing-label:${locale}`);
      }
      for (const [key, value] of Object.entries(choice.requires ?? {})) {
        if (!own(stateSchema, key) || !isPrimitive(value)) errors.push(`choice:${scene.id}:${choice.id}:invalid-guard:${key}`);
        else {
          const valueError = validateStateValue(key, value, stateSchema[key], `choice:${scene.id}:${choice.id}:guard`);
          if (valueError) errors.push(valueError);
        }
      }
      for (const [key, value] of Object.entries(choice.effects ?? {})) {
        if (!own(stateSchema, key) || !isPrimitive(value)) errors.push(`choice:${scene.id}:${choice.id}:invalid-effect:${key}`);
        else {
          const valueError = validateStateValue(key, value, stateSchema[key], `choice:${scene.id}:${choice.id}:effect`);
          if (valueError) errors.push(valueError);
        }
      }
    }
  }

  if (!sceneIds.has(graph.start)) errors.push('root:start-not-found');
  for (const scene of graph.scenes) {
    if (scene.next && !sceneIds.has(scene.next)) errors.push(`scene:${scene.id}:dangling-next:${scene.next}`);
    for (const choice of scene.choices ?? []) {
      if (!sceneIds.has(choice.to)) errors.push(`choice:${scene.id}:${choice.id}:dangling-target:${choice.to}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function createInitialState(graph) {
  const report = validateGraph(graph);
  if (!report.valid) throw new Error(`Cannot create state from invalid graph: ${report.errors.join(', ')}`);
  return structuredClone(graph.initialState);
}

export function canEnter(choice, state) {
  return Object.entries(choice?.requires ?? {}).every(([key, value]) => state?.[key] === value);
}

export function getDialogueLines(scene, locale, state) {
  return (scene?.dialogue?.[locale] ?? []).filter(line => canEnter({ requires: line.when }, state));
}

export function applyEffects(state, effects, stateSchema) {
  const next = structuredClone(state);
  for (const [key, value] of Object.entries(effects ?? {})) {
    const error = validateStateValue(key, value, stateSchema?.[key], 'effect');
    if (error) throw new Error(`Invalid effect ${error}`);
    next[key] = value;
  }
  return next;
}
