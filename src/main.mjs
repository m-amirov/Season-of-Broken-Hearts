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
    const hasValidSave = Boolean(saved && engine.load(saved));
    if (saved && !hasValidSave) notice = UI_TEXT[engine.locale()].corruptSave;

    const settings = readSettings();
    applySettings(settings);
    const renderer = createRenderer(root);
    const assetManager = createAssetManager(manifest);
    const ui = { menuOpen: false, menuView: 'main', introEpisode: null, homeOpen: true, hasResume: hasValidSave };
    let introTimeout = null;
    let renderSequence = 0;
    let controller;

    const focusLater = node => {
      queueMicrotask(() => node?.focus?.({ preventScroll: true }));
    };

    const dismissIntro = () => {
      if (ui.introEpisode === null) return;
      clearTimeout(introTimeout);
      introTimeout = null;
      ui.introEpisode = null;
      engine.markEpisodeIntroSeen();
      render();
      focusLater(renderer.elements.stage);
    };

    const render = () => {
      if (!ui.homeOpen && engine.needsEpisodeIntro()) {
        const episode = engine.episodeIntro().episode;
        if (ui.introEpisode !== episode) {
          clearTimeout(introTimeout);
          ui.introEpisode = episode;
          introTimeout = setTimeout(dismissIntro, 2300);
        }
      } else if (ui.introEpisode !== null) {
        clearTimeout(introTimeout);
        introTimeout = null;
        ui.introEpisode = null;
      }

      const sequence = ++renderSequence;
      const rendered = renderer.render({
        engine,
        assetManager,
        notice,
        menuOpen: ui.menuOpen,
        menuView: ui.menuView,
        settings,
        showIntro: ui.introEpisode !== null,
        homeOpen: ui.homeOpen,
        hasResume: ui.hasResume
      });
      controller.bindChoiceButtons(rendered.choiceButtons);
      controller.setMenuOpen(ui.menuOpen || ui.homeOpen || ui.introEpisode !== null);
      controller.lock();
      rendered.ready.then(() => {
        if (sequence === renderSequence && ui.introEpisode === null && !ui.menuOpen && !ui.homeOpen) controller.unlock();
      });
      if (!ui.homeOpen) {
        storageWrite(SAVE_KEY, engine.save());
        ui.hasResume = true;
      }
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
      focusLater(ui.homeOpen ? (ui.hasResume ? renderer.elements.homeResumeButton : renderer.elements.homeStartButton) : renderer.elements.stage);
    };

    const startReading = () => {
      if (!ui.homeOpen) return;
      ui.homeOpen = false;
      ui.menuOpen = false;
      ui.menuView = 'main';
      ui.hasResume = true;
      render();
      if (ui.introEpisode === null) focusLater(renderer.elements.stage);
    };

    const showLanding = () => {
      ui.homeOpen = true;
      ui.hasResume = true;
      ui.menuOpen = false;
      ui.menuView = 'main';
      render();
      focusLater(renderer.elements.homeResumeButton);
    };

    controller = createInputController(renderer.elements, {
      onAdvance: () => {
        if (ui.homeOpen || ui.introEpisode !== null || ui.menuOpen || engine.choices().length > 0 || engine.isEpisodeComplete()) {
          controller.unlock();
          return;
        }
        engine.advance();
        render();
      },
      onChoose: choiceId => { if (!ui.homeOpen && !ui.menuOpen && ui.introEpisode === null) { engine.choose(choiceId); render(); } },
      onBack: () => {
        if (!ui.homeOpen && !ui.menuOpen && ui.introEpisode === null && engine.back()) render();
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
        if (ui.homeOpen) {
          closeMenu();
        } else {
          ui.menuView = 'main';
          render();
          focusLater(renderer.elements.menuSettingsButton);
        }
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
        ui.homeOpen = false;
        ui.hasResume = true;
        render();
      },
      onNewGameCancel: () => {
        if (ui.homeOpen) closeMenu();
        else {
          ui.menuView = 'main';
          render();
          focusLater(renderer.elements.menuNewGameButton);
        }
      },
      onHome: showLanding,
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

    renderer.elements.homeStartButton.addEventListener('click', startReading);
    renderer.elements.homeResumeButton.addEventListener('click', startReading);
    renderer.elements.homeNewGameButton.addEventListener('click', () => {
      ui.menuOpen = true;
      ui.menuView = 'confirm';
      render();
      focusLater(renderer.elements.confirmationTitle);
    });
    renderer.elements.homeSettingsButton.addEventListener('click', () => {
      ui.menuOpen = true;
      ui.menuView = 'settings';
      render();
      focusLater(renderer.elements.settingsTitle);
    });

    renderer.elements.episodeIntro.addEventListener('click', event => {
      event.stopPropagation();
      dismissIntro();
    });
    window.addEventListener('pagehide', () => {
      clearTimeout(introTimeout);
      storageWrite(SAVE_KEY, engine.save());
    }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') storageWrite(SAVE_KEY, engine.save());
    }, { passive: true });
    render();
    focusLater(hasValidSave ? renderer.elements.homeResumeButton : renderer.elements.homeStartButton);
  } catch (error) {
    showBootError(root, error, resolveLocale());
    console.error(error);
  }
}

void boot();
