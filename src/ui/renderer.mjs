import { getLocalizedText } from '../narrative/localization.mjs';

export const UI_TEXT = {
  ru: {
    appLabel: 'Сезон разбитых сердец',
    choices: 'Варианты ответа',
    back: 'Назад',
    newGame: 'Новая игра',
    continue: 'Продолжить',
    complete: 'Эпизод завершён',
    saved: 'EP1 · сохранение включено',
    cliffhanger: 'EP1 · клиффхэнгер',
    completed: 'EP1 · эпизод завершён',
    corruptSave: 'Сохранение повреждено или устарело — начата новая игра.',
    bootError: 'Не удалось открыть эпизод. Перезагрузите страницу.',
    placeholder: 'временный placeholder'
  },
  en: {
    appLabel: 'Season of Broken Hearts',
    choices: 'Response choices',
    back: 'Back',
    newGame: 'New Game',
    continue: 'Continue',
    complete: 'Episode Complete',
    saved: 'EP1 · save enabled',
    cliffhanger: 'EP1 · cliffhanger',
    completed: 'EP1 · episode complete',
    corruptSave: 'The save is damaged or outdated — a new game has started.',
    bootError: 'Unable to open the episode. Reload the page.',
    placeholder: 'temporary placeholder'
  }
};

function element(tag, className, text = '') {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function createRenderer(root) {
  root.replaceChildren();
  const shell = element('section', 'novel-shell');
  shell.setAttribute('aria-label', UI_TEXT.ru.appLabel);

  const art = element('div', 'scene-art');
  const image = document.createElement('img');
  image.alt = '';
  image.loading = 'eager';
  art.append(image);

  const content = element('div', 'novel-content');
  const topbar = element('header', 'novel-topbar');
  const title = element('h1', 'scene-title');
  const localeBar = element('div', 'locale-bar');
  const ruButton = element('button', 'text-button', 'RU');
  ruButton.type = 'button';
  ruButton.dataset.locale = 'ru';
  const enButton = element('button', 'text-button', 'EN');
  enButton.type = 'button';
  enButton.dataset.locale = 'en';
  localeBar.append(ruButton, enButton);
  topbar.append(title, localeBar);

  const dialogue = element('article', 'dialogue-card');
  const speaker = element('div', 'speaker-name');
  const text = element('p', 'dialogue-text');
  dialogue.append(speaker, text);

  const choices = element('div', 'choices');
  choices.setAttribute('role', 'group');

  const status = element('p', 'runtime-status');
  status.setAttribute('aria-live', 'polite');
  const actions = element('footer', 'action-bar');
  const backButton = element('button', 'secondary-button');
  backButton.type = 'button';
  const newGameButton = element('button', 'secondary-button');
  newGameButton.type = 'button';
  const nextButton = element('button', 'primary-button');
  nextButton.type = 'button';
  actions.append(backButton, newGameButton, nextButton);

  content.append(topbar, dialogue, choices, status, actions);
  shell.append(art, content);
  root.append(shell);

  let previousSceneId = null;
  let pendingSceneReady = Promise.resolve();

  function animateSceneChange() {
    pendingSceneReady = new Promise(resolve => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        image.removeEventListener('animationend', finish);
        resolve();
      };
      image.addEventListener('animationend', finish, { once: true });
      const schedule = globalThis.requestAnimationFrame ?? (callback => queueMicrotask(callback));
      schedule(() => {
        image.classList.add('scene-fade-in');
        if (typeof getComputedStyle === 'function' && getComputedStyle(image).animationName === 'none') finish();
      });
    });
    return pendingSceneReady;
  }

  return {
    elements: {
      root,
      shell,
      image,
      title,
      speaker,
      text,
      choices,
      status,
      nextButton,
      backButton,
      newGameButton,
      localeButtons: [ruButton, enButton]
    },
    render({ engine, assetManager, notice = '' }) {
      const locale = engine.locale();
      const labels = UI_TEXT[locale] ?? UI_TEXT.ru;
      const scene = engine.currentScene();
      const line = engine.currentLine();
      const sceneChanged = previousSceneId !== scene.id;
      previousSceneId = scene.id;

      shell.setAttribute('aria-label', labels.appLabel);
      choices.setAttribute('aria-label', labels.choices);
      backButton.textContent = labels.back;
      newGameButton.textContent = labels.newGame;
      title.textContent = getLocalizedText(scene.title, locale);
      speaker.textContent = line.speaker
        ? getLocalizedText(engine.graph().characterNames?.[line.speaker] ?? line.speaker.toUpperCase(), locale)
        : '';
      speaker.hidden = !line.speaker;
      text.textContent = line.text;
      image.src = assetManager.sourceFor(scene);
      image.alt = `${title.textContent} ${labels.placeholder}`;

      if (sceneChanged) {
        image.classList.remove('scene-fade-in');
        animateSceneChange();
      }

      choices.replaceChildren();
      const choiceButtons = engine.choices().map(choice => {
        const button = element('button', 'choice-button', getLocalizedText(choice.label, locale));
        button.type = 'button';
        button.dataset.choiceId = choice.id;
        return button;
      });
      choices.append(...choiceButtons);
      choices.hidden = choiceButtons.length === 0;
      const complete = engine.isEpisodeComplete();
      nextButton.hidden = choiceButtons.length > 0;
      nextButton.textContent = complete ? labels.complete : labels.continue;
      nextButton.disabled = complete;
      backButton.disabled = !engine.canBack();
      for (const button of [ruButton, enButton]) {
        button.setAttribute('aria-pressed', String(button.dataset.locale === locale));
      }
      status.textContent = notice || (complete ? labels.completed : engine.isEnding() ? labels.cliffhanger : labels.saved);
      return { choiceButtons, sceneChanged, ready: pendingSceneReady };
    }
  };
}
