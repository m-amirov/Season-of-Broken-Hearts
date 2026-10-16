import { getLocalizedText } from './localization.mjs';
import { deserializeSave, serializeSave } from './save.mjs';
import { applyEffects, canEnter, createInitialState, getDialogueLines, validateGraph } from './state.mjs';

const ENGINE_SCHEMA_VERSION = 4;

export class NarrativeEngine {
  #graph;
  #locale;
  #cursor;
  #state;
  #history;
  #readerProgress;
  #locked = false;

  constructor(graph, options = {}) {
    const report = validateGraph(graph);
    if (!report.valid) throw new Error(`Cannot create engine from invalid graph: ${report.errors.join(', ')}`);
    this.#graph = graph;
    this.#locale = graph.locales.includes(options.locale) ? options.locale : graph.locales[0];
    this.#cursor = { sceneId: graph.start, dialogueIndex: 0 };
    this.#state = createInitialState(graph);
    this.#history = [];
    this.#readerProgress = { seenEpisodes: [], tutorialAdvances: 0 };
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
    return this.#dialogueLines()[this.#cursor.dialogueIndex];
  }

  sceneTitle() {
    return getLocalizedText(this.currentScene().title, this.#locale);
  }

  episodeIntro() {
    const episode = this.currentScene().episode ?? 1;
    const opening = this.#graph.scenes.find(scene => (scene.episode ?? 1) === episode);
    return { episode, title: getLocalizedText(opening?.title ?? this.currentScene().title, this.#locale) };
  }

  needsEpisodeIntro() {
    return !this.#readerProgress.seenEpisodes.includes(this.episodeIntro().episode);
  }

  markEpisodeIntroSeen() {
    const episode = this.episodeIntro().episode;
    if (!this.#readerProgress.seenEpisodes.includes(episode)) {
      this.#readerProgress.seenEpisodes.push(episode);
      this.#readerProgress.seenEpisodes.sort((a, b) => a - b);
    }
  }

  showTutorialHint() {
    return this.#readerProgress.tutorialAdvances < 2;
  }

  #recordForwardProgress() {
    this.#readerProgress.tutorialAdvances = Math.min(2, this.#readerProgress.tutorialAdvances + 1);
  }

  #dialogueLines(scene = this.currentScene(), locale = this.#locale) {
    return getDialogueLines(scene, locale, this.#state);
  }

  choices() {
    const scene = this.currentScene();
    const lines = this.#dialogueLines(scene);
    if (this.#cursor.dialogueIndex !== lines.length - 1) return [];
    return (scene.choices ?? []).filter(choice => canEnter(choice, this.#state));
  }

  isEnding() {
    return this.currentScene().ending === true || this.currentScene().episodeEnd === true;
  }

  isEpisodeComplete() {
    if (!this.isEnding()) return false;
    const lines = this.#dialogueLines();
    return this.#cursor.dialogueIndex === lines.length - 1;
  }

  isSeasonComplete() {
    if (!this.isEpisodeComplete()) return false;
    const scene = this.currentScene();
    return scene.episodeEnd ? !scene.next : !scene.nextEpisodeStart;
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
      const lastLine = this.#dialogueLines(scene).length - 1;
      if (this.#cursor.dialogueIndex < lastLine) {
        this.#recordSnapshot();
        this.#cursor.dialogueIndex += 1;
        this.#recordForwardProgress();
        return { ok: true, type: 'dialogue' };
      }
      if (scene.choices) return { ok: false, reason: 'choice-required' };
      if (scene.ending || scene.episodeEnd) return { ok: false, reason: 'episode-complete' };
      this.#recordSnapshot();
      this.#cursor = { sceneId: scene.next, dialogueIndex: 0 };
      this.#recordForwardProgress();
      return { ok: true, type: 'scene' };
    });
  }

  continueEpisode() {
    return this.#withLock(() => {
      if (!this.isEpisodeComplete()) return { ok: false, reason: 'episode-not-complete' };
      const current = this.currentScene();
      const nextEpisodeStart = current.nextEpisodeStart ?? (current.episodeEnd ? current.next : null);
      if (!nextEpisodeStart) return { ok: false, reason: 'season-complete' };
      const nextScene = this.#graph.scenes.find(scene => scene.id === nextEpisodeStart);
      if (!nextScene) return { ok: false, reason: 'missing-episode-start' };
      this.#recordSnapshot();
      this.#cursor = { sceneId: nextEpisodeStart, dialogueIndex: 0 };
      this.#recordForwardProgress();
      return { ok: true, type: 'episode', episode: nextScene.episode ?? 1 };
    });
  }

  choose(choiceId) {
    return this.#withLock(() => {
      const choice = this.choices().find(candidate => candidate.id === choiceId);
      if (!choice) return { ok: false, reason: 'choice-unavailable' };
      this.#recordSnapshot();
      this.#state = applyEffects(this.#state, choice.effects, this.#graph.stateSchema);
      this.#cursor = { sceneId: choice.to, dialogueIndex: 0 };
      this.#recordForwardProgress();
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
    const maxIndex = this.#dialogueLines(scene, locale).length - 1;
    this.#cursor.dialogueIndex = Math.min(this.#cursor.dialogueIndex, maxIndex);
    return true;
  }

  newGame() {
    return this.#withLock(() => {
      this.#cursor = { sceneId: this.#graph.start, dialogueIndex: 0 };
      this.#state = createInitialState(this.#graph);
      this.#history = [];
      this.#readerProgress = { seenEpisodes: [], tutorialAdvances: 0 };
      return true;
    });
  }

  snapshot() {
    return {
      schemaVersion: ENGINE_SCHEMA_VERSION,
      locale: this.#locale,
      cursor: structuredClone(this.#cursor),
      state: structuredClone(this.#state),
      history: structuredClone(this.#history),
      readerProgress: structuredClone(this.#readerProgress)
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
    this.#readerProgress = restored.readerProgress;
    return true;
  }
}
