import graph from '../narrative/graph.json' with { type: 'json' };
import manifest from '../narrative/assets.json' with { type: 'json' };
import { createAssetManager } from './assets/asset-manager.mjs';
import { NarrativeEngine } from './narrative/engine.mjs';
import { initYandexSdk, resolveLocale } from './platform/yandex-sdk.mjs';
import { createInputController } from './ui/input-controller.mjs';
import { createRenderer, UI_TEXT } from './ui/renderer.mjs';

const SAVE_KEY = 'season-of-broken-hearts.save.v1';
const SETTINGS_KEY = 'season-of-broken-hearts.reader-settings.v1';
const TEXT_SCALES = [0.92, 1, 1.12, 1.25];
const DEFAULT_SETTINGS = Object.freeze({ scale: 1, contrast: false, reducedMotion: false });

function storageRead(key) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}

function storageWrite(key, value) {
  try { window.localStorage.setItem(key, value); } catch { /* private browsing is still playable */ }
}

function storageClear(key) {
  try { window.localStorage.removeItem(key); } catch { /* no-op */ }
}

function readSettings() {
  try {
    const parsed = JSON.parse(storageRead(SETTINGS_KEY) || '{}');
    return {
      scale: TEXT_SCALES.includes(parsed.scale) ? parsed.scale : DEFAULT_SETTINGS.scale,
      contrast: parsed.contrast === true,
      reducedMotion: parsed.reducedMotion === true
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function applySettings(settings) {
  document.documentElement.style.setProperty('--reader-scale', String(settings.scale));
  document.body.classList.toggle('high-contrast', settings.contrast);
  document.body.classList.toggle('reduced-motion', settings.reducedMotion);
}

function updateOrientationGuard() {
  const isTouchLandscape = navigator.maxTouchPoints > 0
    && window.innerWidth > window.innerHeight
    && window.innerHeight <= 700
    && window.innerWidth <= 1000;
  document.documentElement.classList.toggle('touch-landscape', isTouchLandscape);
}

function showBootError(root, error, locale = 'ru') {
  root.replaceChildren();
  const message = document.createElement('p');
  message.className = 'boot-error';
  message.textContent = UI_TEXT[locale]?.bootError ?? UI_TEXT.ru.bootError;
  message.title = error instanceof Error ? error.message : String(error);
  root.append(message);
}

async function boot() {
  const root = document.querySelector('#app');
  try {
    updateOrientationGuard();
    window.addEventListener('resize', updateOrientationGuard, { passive: true });
    window.addEventListener('orientationchange', updateOrientationGuard, { passive: true });
    const sdk = await initYandexSdk();
    const platformLocale = resolveLocale(sdk);
    const engine = new NarrativeEngine(graph, { locale: platformLocale });
    let notice = '';
    const saved = storageRead(SAVE_KEY);
    if (saved && !engine.load(saved)) notice = UI_TEXT[engine.locale()].corruptSave;

    const settings = readSettings();
    applySettings(settings);
    const renderer = createRenderer(root);
    const assetManager = createAssetManager(manifest);
    const ui = { menuOpen: false, menuView: 'main' };
    let controller;

    const focusLater = node => {
      queueMicrotask(() => node?.focus?.({ preventScroll: true }));
    };

    const render = () => {
      const rendered = renderer.render({
        engine,
        assetManager,
        notice,
        menuOpen: ui.menuOpen,
        menuView: ui.menuView,
        settings
      });
      controller.bindChoiceButtons(rendered.choiceButtons);
      controller.setMenuOpen(ui.menuOpen);
      controller.lock();
      rendered.ready.then(() => controller.unlock());
      storageWrite(SAVE_KEY, engine.save());
      notice = '';

      const scene = engine.currentScene();
      const nextScene = engine.graph().scenes.find(candidate => candidate.id === scene.next);
      if (nextScene) assetManager.preloadSceneAsset(nextScene).catch(() => {});
      for (const choice of engine.choices()) {
        const choiceScene = engine.graph().scenes.find(candidate => candidate.id === choice.to);
        if (choiceScene) assetManager.preloadSceneAsset(choiceScene).catch(() => {});
      }
    };

    const closeMenu = () => {
      ui.menuOpen = false;
      ui.menuView = 'main';
      render();
      focusLater(renderer.elements.stage);
    };

    controller = createInputController(renderer.elements, {
      onAdvance: () => {
        if (ui.menuOpen || engine.choices().length > 0 || engine.isEpisodeComplete()) {
          controller.unlock();
          return;
        }
        engine.advance();
        render();
      },
      onChoose: choiceId => { if (!ui.menuOpen) { engine.choose(choiceId); render(); } },
      onBack: () => {
        if (!ui.menuOpen && engine.back()) render();
        else controller.unlock();
      },
      onMenu: () => {
        ui.menuOpen = true;
        ui.menuView = 'main';
        render();
        focusLater(renderer.elements.menuContinueButton);
      },
      onMenuClose: closeMenu,
      onSettings: () => {
        ui.menuOpen = true;
        ui.menuView = 'settings';
        render();
        focusLater(renderer.elements.settingsTitle);
      },
      onSettingsBack: () => {
        ui.menuView = 'main';
        render();
        focusLater(renderer.elements.menuSettingsButton);
      },
      onNewGameRequest: () => {
        ui.menuView = 'confirm';
        render();
        focusLater(renderer.elements.confirmationTitle);
      },
      onNewGameConfirm: () => {
        engine.newGame();
        storageClear(SAVE_KEY);
        ui.menuOpen = false;
        ui.menuView = 'main';
        render();
        focusLater(renderer.elements.stage);
      },
      onNewGameCancel: () => {
        ui.menuView = 'main';
        render();
        focusLater(renderer.elements.menuNewGameButton);
      },
      onLocale: locale => {
        engine.setLocale(locale);
        render();
      },
      onSetting: setting => {
        if (setting === 'textSize') {
          const currentIndex = TEXT_SCALES.indexOf(settings.scale);
          settings.scale = TEXT_SCALES[(currentIndex + 1) % TEXT_SCALES.length];
        } else if (setting === 'contrast') {
          settings.contrast = !settings.contrast;
        } else if (setting === 'motion') {
          settings.reducedMotion = !settings.reducedMotion;
        }
        applySettings(settings);
        storageWrite(SETTINGS_KEY, JSON.stringify(settings));
        render();
      }
    });

    window.addEventListener('pagehide', () => storageWrite(SAVE_KEY, engine.save()), { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') storageWrite(SAVE_KEY, engine.save());
    }, { passive: true });
    render();
  } catch (error) {
    showBootError(root, error, resolveLocale());
    console.error(error);
  }
}

void boot();
