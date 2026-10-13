import { getLocalizedText } from './localization.mjs';
import { deserializeSave, serializeSave } from './save.mjs';
import { applyEffects, canEnter, createInitialState, validateGraph } from './state.mjs';

const ENGINE_SCHEMA_VERSION = 1;

export class NarrativeEngine {
  #graph;
  #locale;
  #cursor;
  #state;
  #history;
  #locked = false;

  constructor(graph, options = {}) {
    const report = validateGraph(graph);
    if (!report.valid) throw new Error(`Cannot create engine from invalid graph: ${report.errors.join(', ')}`);
    this.#graph = graph;
    this.#locale = graph.locales.includes(options.locale) ? options.locale : graph.locales[0];
    this.#cursor = { sceneId: graph.start, dialogueIndex: 0 };
    this.#state = createInitialState(graph);
    this.#history = [];
  }

  graph() {
    return this.#graph;
  }

  locale() {
    return this.#locale;
  }

  currentScene() {
    return this.#graph.scenes.find(scene => scene.id === this.#cursor.sceneId);
  }

  currentLine() {
    return this.currentScene().dialogue[this.#locale][this.#cursor.dialogueIndex];
  }

  sceneTitle() {
    return getLocalizedText(this.currentScene().title, this.#locale);
  }

  choices() {
    const scene = this.currentScene();
    const lines = scene.dialogue[this.#locale];
    if (this.#cursor.dialogueIndex !== lines.length - 1) return [];
    return (scene.choices ?? []).filter(choice => canEnter(choice, this.#state));
  }

  isEnding() {
    return this.currentScene().ending === true;
  }

  canBack() {
    return this.#history.length > 0;
  }

  isTransitionLocked() {
    return this.#locked;
  }

  #withLock(action) {
    if (this.#locked) return { ok: false, reason: 'transition-locked' };
    this.#locked = true;
    try {
      return action();
    } finally {
      this.#locked = false;
    }
  }

  #recordSnapshot() {
    this.#history.push({
      sceneId: this.#cursor.sceneId,
      dialogueIndex: this.#cursor.dialogueIndex,
      state: structuredClone(this.#state)
    });
  }

  advance() {
    return this.#withLock(() => {
      const scene = this.currentScene();
      const lastLine = scene.dialogue[this.#locale].length - 1;
      if (this.#cursor.dialogueIndex < lastLine) {
        this.#recordSnapshot();
        this.#cursor.dialogueIndex += 1;
        return { ok: true, type: 'dialogue' };
      }
      if (scene.choices) return { ok: false, reason: 'choice-required' };
      if (scene.ending) return { ok: false, reason: 'episode-complete' };
      this.#recordSnapshot();
      this.#cursor = { sceneId: scene.next, dialogueIndex: 0 };
      return { ok: true, type: 'scene' };
    });
  }

  choose(choiceId) {
    return this.#withLock(() => {
      const choice = this.choices().find(candidate => candidate.id === choiceId);
      if (!choice) return { ok: false, reason: 'choice-unavailable' };
      this.#recordSnapshot();
      this.#state = applyEffects(this.#state, choice.effects, this.#graph.stateSchema);
      this.#cursor = { sceneId: choice.to, dialogueIndex: 0 };
      return { ok: true, type: 'choice', choiceId };
    });
  }

  back() {
    return this.#withLock(() => {
      const snapshot = this.#history.pop();
      if (!snapshot) return false;
      this.#cursor = { sceneId: snapshot.sceneId, dialogueIndex: snapshot.dialogueIndex };
      this.#state = structuredClone(snapshot.state);
      return true;
    });
  }

  setLocale(locale) {
    if (!this.#graph.locales.includes(locale)) return false;
    this.#locale = locale;
    const scene = this.currentScene();
    const maxIndex = scene.dialogue[locale].length - 1;
    this.#cursor.dialogueIndex = Math.min(this.#cursor.dialogueIndex, maxIndex);
    return true;
  }

  newGame() {
    return this.#withLock(() => {
      this.#cursor = { sceneId: this.#graph.start, dialogueIndex: 0 };
      this.#state = createInitialState(this.#graph);
      this.#history = [];
      return true;
    });
  }

  snapshot() {
    return {
      schemaVersion: ENGINE_SCHEMA_VERSION,
      locale: this.#locale,
      cursor: structuredClone(this.#cursor),
      state: structuredClone(this.#state),
      history: structuredClone(this.#history)
    };
  }

  save() {
    return serializeSave(this.snapshot());
  }

  load(raw) {
    const restored = deserializeSave(raw, this.#graph);
    if (!restored) return false;
    this.#locale = restored.locale;
    this.#cursor = restored.cursor;
    this.#state = restored.state;
    this.#history = restored.history;
    return true;
  }
}
