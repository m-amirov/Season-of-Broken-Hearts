import graph from '../narrative/graph.json' with { type: 'json' };
import manifest from '../narrative/assets.json' with { type: 'json' };
import { createAssetManager } from './assets/asset-manager.mjs';
import { NarrativeEngine } from './narrative/engine.mjs';
import { initYandexSdk } from './platform/yandex-sdk.mjs';
import { createInputController } from './ui/input-controller.mjs';
import { createRenderer, UI_TEXT } from './ui/renderer.mjs';

const SAVE_KEY = 'season-of-broken-hearts.save.v1';

function detectedLocale() {
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'ru';
}

function storageRead() {
  try { return window.localStorage.getItem(SAVE_KEY); } catch { return null; }
}

function storageWrite(value) {
  try { window.localStorage.setItem(SAVE_KEY, value); } catch { /* private browsing is still playable */ }
}

function storageClear() {
  try { window.localStorage.removeItem(SAVE_KEY); } catch { /* no-op */ }
}

function showBootError(root, error, locale = 'ru') {
  root.textContent = '';
  const message = document.createElement('p');
  message.textContent = UI_TEXT[locale]?.bootError ?? 'Unable to open the episode. Reload the page.';
  message.title = error instanceof Error ? error.message : String(error);
  root.append(message);
}

async function boot() {
  const root = document.querySelector('#app');
  try {
    await initYandexSdk();
    const engine = new NarrativeEngine(graph, { locale: detectedLocale() });
    let notice = '';
    const saved = storageRead();
    if (saved && !engine.load(saved)) notice = UI_TEXT[engine.locale()].corruptSave;

    const renderer = createRenderer(root);
    const assetManager = createAssetManager(manifest);
    let controller;

    const render = () => {
      const rendered = renderer.render({ engine, assetManager, notice });
      controller.bindChoiceButtons(rendered.choiceButtons);
      controller.lock();
      rendered.ready.then(() => controller.unlock());
      storageWrite(engine.save());
      notice = '';
      const scene = engine.currentScene();
      const nextScene = engine.graph().scenes.find(candidate => candidate.id === scene.next);
      if (nextScene) assetManager.preloadSceneAsset(nextScene).catch(() => {});
      for (const choice of engine.choices()) {
        const choiceScene = engine.graph().scenes.find(candidate => candidate.id === choice.to);
        if (choiceScene) assetManager.preloadSceneAsset(choiceScene).catch(() => {});
      }
    };

    controller = createInputController(renderer.elements, {
      onAdvance: () => { engine.advance(); render(); },
      onChoose: choiceId => { engine.choose(choiceId); render(); },
      onBack: () => { engine.back(); render(); },
      onNewGame: () => { engine.newGame(); storageClear(); render(); },
      onLocale: locale => { engine.setLocale(locale); render(); }
    });

    window.addEventListener('pagehide', () => storageWrite(engine.save()), { passive: true });
    render();
  } catch (error) {
    showBootError(root, error, detectedLocale());
    console.error(error);
  }
}

boot();
