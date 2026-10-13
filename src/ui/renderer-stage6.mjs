import { getLocalizedText } from '../narrative/localization.mjs';

export const UI_TEXT = {
  ru: {
    appLabel: 'Сезон разбитых сердец', back: 'Назад', menu: 'Меню', close: 'Закрыть',
    resume: 'Продолжить', newGame: 'Новая игра', settings: 'Настройки', settingsTitle: 'Настройки чтения',
    language: 'Язык', russian: 'Русский', english: 'English', textSize: 'Размер текста',
    smaller: 'Меньше', normal: 'Обычный', larger: 'Больше', contrast: 'Контраст', contrastOn: 'Повышенный',
    contrastOff: 'Обычный', motion: 'Анимация', motionOn: 'Системная', motionOff: 'Выключена',
    backToMenu: 'К меню', confirmNewGameTitle: 'Начать новую игру?',
    confirmNewGameText: 'Текущее сохранение будет удалено. Это действие нельзя отменить.',
    confirmNewGame: 'Начать заново', cancel: 'Отмена', episode: 'Эпизод 1', episodeBase: 'Эпизод', skipIntro: 'Пропустить заставку',
    tapToContinue: 'Нажмите, чтобы продолжить', chooseResponse: 'Выберите ответ',
    complete: 'Эпизод завершён', saved: 'Сохранено', cliffhanger: 'Продолжение следует',
    corruptSave: 'Сохранение повреждено или устарело — начата новая игра.',
    bootError: 'Не удалось открыть эпизод. Перезагрузите страницу.', placeholder: 'сценический фон',
    rotateTitle: 'Поверните устройство', rotateText: 'Эта история открывается в портретной ориентации.'
  },
  en: {
    appLabel: 'Season of Broken Hearts', back: 'Back', menu: 'Menu', close: 'Close',
    resume: 'Resume', newGame: 'New Game', settings: 'Settings', settingsTitle: 'Reading settings',
    language: 'Language', russian: 'Русский', english: 'English', textSize: 'Text size',
    smaller: 'Smaller', normal: 'Normal', larger: 'Larger', contrast: 'Contrast', contrastOn: 'High',
    contrastOff: 'Standard', motion: 'Animation', motionOn: 'System', motionOff: 'Off',
    backToMenu: 'Back to menu', confirmNewGameTitle: 'Start a new game?',
    confirmNewGameText: 'Your current save will be deleted. This cannot be undone.',
    confirmNewGame: 'Start over', cancel: 'Cancel', episode: 'Episode 1', episodeBase: 'Episode', skipIntro: 'Skip episode title',
    tapToContinue: 'Tap to continue', chooseResponse: 'Choose a response',
    complete: 'Episode complete', saved: 'Saved', cliffhanger: 'To be continued',
    corruptSave: 'The save is damaged or outdated — a new game has started.',
    bootError: 'Unable to open the episode. Reload the page.', placeholder: 'scene background',
    rotateTitle: 'Rotate your device', rotateText: 'This story is designed for portrait orientation.'
  }
};

function element(tag, className, text = '') {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

function button(className, text = '') {
  const node = element('button', className, text);
  node.type = 'button';
  return node;
}

export function createRenderer(root) {
  root.replaceChildren();

  const shell = element('section', 'novel-shell');
  shell.setAttribute('aria-label', UI_TEXT.ru.appLabel);
  const stage = element('section', 'reader-stage');
  stage.tabIndex = 0;
  stage.setAttribute('aria-label', UI_TEXT.ru.tapToContinue);

  const art = element('div', 'scene-art');
  const image = document.createElement('img');
  image.alt = '';
  image.loading = 'eager';
  image.decoding = 'async';
  art.append(image);
  const atmosphere = element('div', 'scene-atmosphere');

  const topbar = element('header', 'reader-topbar');
  const backButton = button('reader-nav-button reader-back');
  const backIcon = element('span', 'reader-nav-icon', '←');
  backIcon.setAttribute('aria-hidden', 'true');
  const backLabel = element('span', 'reader-nav-label');
  backButton.append(backIcon, backLabel);
  const menuButton = button('reader-nav-button reader-menu-button');
  const menuIcon = element('span', 'reader-menu-icon', '☰');
  menuIcon.setAttribute('aria-hidden', 'true');
  const menuLabel = element('span', 'reader-nav-label');
  menuButton.append(menuIcon, menuLabel);
  topbar.append(backButton, menuButton);

  const dialogue = element('article', 'reader-sheet');
  dialogue.setAttribute('aria-live', 'polite');
  const speaker = element('div', 'speaker-name');
  const sceneTitle = element('p', 'scene-title');
  const text = element('p', 'dialogue-text');
  const choices = element('div', 'choices');
  choices.setAttribute('role', 'group');
  const advanceHint = element('p', 'advance-hint');
  advanceHint.setAttribute('aria-hidden', 'true');
  const status = element('p', 'runtime-status');
  status.setAttribute('role', 'status');
  dialogue.append(speaker, sceneTitle, text, choices, advanceHint, status);
  stage.append(art, atmosphere, topbar, dialogue);

  const menu = element('section', 'reader-menu');
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-modal', 'true');
  const menuShade = element('div', 'reader-menu-shade');
  menuShade.setAttribute('aria-hidden', 'true');
  const menuCard = element('div', 'reader-menu-card');
  const menuHeader = element('header', 'reader-menu-header');
  const menuKicker = element('p', 'reader-menu-kicker');
  const menuTitle = element('h2', 'reader-menu-title');
  const menuCloseButton = button('reader-menu-close');
  menuHeader.append(menuKicker, menuTitle, menuCloseButton);
  const menuProgress = element('p', 'reader-menu-progress');
  const menuMain = element('nav', 'reader-menu-actions');
  const menuContinueButton = button('menu-action menu-primary');
  const menuNewGameButton = button('menu-action');
  const menuSettingsButton = button('menu-action');
  menuMain.append(menuContinueButton, menuNewGameButton, menuSettingsButton);

  const settingsPanel = element('section', 'reader-menu-panel');
  const settingsTitle = element('h3', 'reader-panel-title');
  settingsTitle.tabIndex = -1;
  const languageLabel = element('p', 'reader-setting-label');
  const localeButtons = [button('setting-choice'), button('setting-choice')];
  localeButtons[0].dataset.locale = 'ru';
  localeButtons[1].dataset.locale = 'en';
  const languageChoices = element('div', 'setting-choice-row');
  languageChoices.append(...localeButtons);
  const settingButtons = [];
  for (const setting of ['textSize', 'contrast', 'motion']) {
    const settingButton = button('setting-row');
    settingButton.dataset.setting = setting;
    settingButtons.push(settingButton);
  }
  const settingsBackButton = button('menu-action menu-back');
  settingsPanel.append(settingsTitle, languageLabel, languageChoices, ...settingButtons, settingsBackButton);

  const confirmationPanel = element('section', 'reader-menu-panel');
  const confirmationTitle = element('h3', 'reader-panel-title');
  confirmationTitle.tabIndex = -1;
  const confirmationText = element('p', 'reader-confirmation-text');
  const newGameConfirmButton = button('menu-action menu-danger');
  const newGameCancelButton = button('menu-action');
  confirmationPanel.append(confirmationTitle, confirmationText, newGameConfirmButton, newGameCancelButton);

  menuCard.append(menuHeader, menuProgress, menuMain, settingsPanel, confirmationPanel);
  menu.append(menuShade, menuCard);
  menu.hidden = true;

  const orientationLock = element('section', 'orientation-lock');
  orientationLock.setAttribute('role', 'status');
  const orientationIcon = element('span', 'orientation-icon', '↻');
  orientationIcon.setAttribute('aria-hidden', 'true');
  const orientationTitle = element('h2', 'orientation-title');
  const orientationText = element('p', 'orientation-text');
  orientationLock.append(orientationIcon, orientationTitle, orientationText);

  // A standalone title slide, distinct from the dialogue and independent of scene navigation.
  const episodeIntro = button('episode-intro');
  episodeIntro.hidden = true;
  const introNumber = element('span', 'episode-intro-number');
  const introRule = element('span', 'episode-intro-rule');
  introRule.setAttribute('aria-hidden', 'true');
  const introTitle = element('span', 'episode-intro-title');
  const introSkip = element('span', 'episode-intro-skip');
  episodeIntro.append(introNumber, introRule, introTitle, introSkip);

  shell.append(stage, menu, episodeIntro, orientationLock);
  root.append(shell);

  let previousSceneId = null;
  let pendingSceneReady = Promise.resolve();
  let renderToken = 0;

  function animateSceneChange() {
    pendingSceneReady = new Promise(resolve => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        image.removeEventListener('animationend', finish);
        image.removeEventListener('animationcancel', finish);
        resolve();
      };
      image.addEventListener('animationend', finish, { once: true });
      image.addEventListener('animationcancel', finish, { once: true });
      const schedule = globalThis.requestAnimationFrame ?? (callback => queueMicrotask(callback));
      schedule(() => {
        image.classList.add('scene-fade-in');
        if (typeof getComputedStyle === 'function' && getComputedStyle(image).animationName === 'none') finish();
      });
    });
    return pendingSceneReady;
  }

  function updateSettings(labels, settings, locale) {
    const scale = Number(settings?.scale ?? 1);
    const scaleLabel = scale <= .95 ? labels.smaller : scale >= 1.2 ? labels.larger : labels.normal;
    languageLabel.textContent = labels.language;
    localeButtons[0].textContent = labels.russian;
    localeButtons[1].textContent = labels.english;
    for (const localeButton of localeButtons) {
      localeButton.setAttribute('aria-pressed', String(localeButton.dataset.locale === locale));
    }
    settingButtons[0].textContent = `${labels.textSize}: ${scaleLabel}`;
    settingButtons[1].textContent = `${labels.contrast}: ${settings?.contrast ? labels.contrastOn : labels.contrastOff}`;
    settingButtons[2].textContent = `${labels.motion}: ${settings?.reducedMotion ? labels.motionOff : labels.motionOn}`;
  }

  function updateMenu({ labels, engine, menuOpen, menuView, settings }) {
    menu.hidden = !menuOpen;
    menu.setAttribute('aria-label', labels.menu);
    menuKicker.textContent = labels.episode;
    menuTitle.textContent = labels.menu;
    menuCloseButton.textContent = `× ${labels.close}`;
    menuCloseButton.setAttribute('aria-label', labels.close);
    menuProgress.textContent = `${labels.episodeBase} ${engine.episodeIntro().episode} · ${engine.sceneTitle()}`;
    menuContinueButton.textContent = labels.resume;
    menuNewGameButton.textContent = labels.newGame;
    menuSettingsButton.textContent = labels.settings;
    menuMain.hidden = menuView !== 'main';
    settingsPanel.hidden = menuView !== 'settings';
    confirmationPanel.hidden = menuView !== 'confirm';
    settingsTitle.textContent = labels.settingsTitle;
    settingsBackButton.textContent = `← ${labels.backToMenu}`;
    confirmationTitle.textContent = labels.confirmNewGameTitle;
    confirmationText.textContent = labels.confirmNewGameText;
    newGameConfirmButton.textContent = labels.confirmNewGame;
    newGameCancelButton.textContent = labels.cancel;
    updateSettings(labels, settings, engine.locale());
  }

  return {
    elements: {
      root, shell, stage, advanceSurface: stage, image, title: sceneTitle, sceneTitle, speaker, text, choices, status,
      backButton, menuButton, menu, menuCloseButton, menuContinueButton, menuSettingsButton, menuNewGameButton,
      settingsBackButton, newGameConfirmButton, newGameCancelButton, settingsTitle, confirmationTitle, localeButtons, settingButtons,
      orientationLock, orientationTitle, orientationText, episodeIntro
    },
    render({ engine, assetManager, notice = '', menuOpen = false, menuView = 'main', settings = {}, showIntro = false }) {
      const locale = engine.locale();
      const labels = UI_TEXT[locale] ?? UI_TEXT.ru;
      const scene = engine.currentScene();
      const line = engine.currentLine();
      const sceneChanged = previousSceneId !== scene.id;
      previousSceneId = scene.id;

      shell.setAttribute('aria-label', labels.appLabel);
      stage.setAttribute('aria-label', labels.tapToContinue);
      backLabel.textContent = labels.back;
      backButton.setAttribute('aria-label', labels.back);
      menuLabel.textContent = labels.menu;
      menuButton.setAttribute('aria-label', labels.menu);
      choices.setAttribute('aria-label', labels.chooseResponse);
      sceneTitle.textContent = getLocalizedText(scene.title, locale);
      sceneTitle.hidden = true; // Chapter names belong to the episode intro, not the reading HUD.
      speaker.textContent = line.speaker
        ? getLocalizedText(engine.graph().characterNames?.[line.speaker] ?? line.speaker.toUpperCase(), locale)
        : '';
      speaker.hidden = !line.speaker;
      text.textContent = line.text;
      image.alt = `${sceneTitle.textContent} · ${labels.placeholder}`;

      if (sceneChanged) {
        image.classList.remove('scene-fade-in');
        const token = ++renderToken;
        const source = assetManager.sourceFor(scene);
        pendingSceneReady = assetManager.preloadSceneAsset(scene)
          .then(() => {
            if (token !== renderToken) return;
            image.src = source;
            art.style.setProperty('--scene-image', `url("${source}")`);
            image.dataset.assetId = scene.assetId;
            image.dataset.sceneId = scene.id;
            delete image.dataset.assetStatus;
            return animateSceneChange();
          })
          .catch(() => {
            if (token !== renderToken) return;
            image.dataset.assetStatus = 'fallback-last-valid';
          });
      } else {
        pendingSceneReady = Promise.resolve();
      }

      choices.replaceChildren();
      const choiceButtons = engine.choices().map(choice => {
        const choiceButton = button('choice-button', getLocalizedText(choice.label, locale));
        choiceButton.dataset.choiceId = choice.id;
        return choiceButton;
      });
      choices.append(...choiceButtons);
      choices.hidden = choiceButtons.length === 0;
      const complete = engine.isEpisodeComplete();
      advanceHint.textContent = labels.tapToContinue;
      advanceHint.hidden = choiceButtons.length > 0 || complete || !engine.showTutorialHint();
      status.textContent = notice || (complete ? labels.complete : engine.isEnding() ? labels.cliffhanger : labels.saved);
      backButton.disabled = !engine.canBack();
      dialogue.dataset.hasChoices = String(choiceButtons.length > 0);
      updateMenu({ labels, engine, menuOpen, menuView, settings });
      episodeIntro.hidden = !showIntro;
      stage.inert = Boolean(showIntro || menuOpen);
      if (showIntro) {
        const chapter = engine.episodeIntro();
        introNumber.textContent = `${labels.episodeBase} ${chapter.episode}`;
        introTitle.textContent = chapter.title;
        introSkip.textContent = labels.tapToContinue;
        episodeIntro.setAttribute('aria-label', `${chapter.title}. ${labels.skipIntro}`);
      }
      orientationTitle.textContent = labels.rotateTitle;
      orientationText.textContent = labels.rotateText;
      return { choiceButtons, sceneChanged, ready: pendingSceneReady };
    }
  };
}
