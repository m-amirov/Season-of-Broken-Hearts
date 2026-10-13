import { getLocalizedText } from '../narrative/localization.mjs';

function element(tag, className, text = '') {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function createRenderer(root) {
  root.replaceChildren();
  const shell = element('section', 'novel-shell');
  shell.setAttribute('aria-label', 'Season of Broken Hearts');

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

  const choices = element('div', 'choices', '');
  choices.setAttribute('role', 'group');
  choices.setAttribute('aria-label', 'Choices');

  const status = element('p', 'runtime-status');
  status.setAttribute('aria-live', 'polite');
  const actions = element('footer', 'action-bar');
  const backButton = element('button', 'secondary-button', 'Назад');
  backButton.type = 'button';
  const newGameButton = element('button', 'secondary-button', 'Новая игра');
  newGameButton.type = 'button';
  const nextButton = element('button', 'primary-button', 'Продолжить');
  nextButton.type = 'button';
  actions.append(backButton, newGameButton, nextButton);

  content.append(topbar, dialogue, choices, status, actions);
  shell.append(art, content);
  root.append(shell);

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
      const scene = engine.currentScene();
      const line = engine.currentLine();
      title.textContent = getLocalizedText(scene.title, engine.locale());
      speaker.textContent = line.speaker ? line.speaker.toUpperCase() : '';
      speaker.hidden = !line.speaker;
      text.textContent = line.text;
      image.src = assetManager.sourceFor(scene);
      image.alt = `${title.textContent} placeholder`;
      image.classList.remove('scene-fade-in');
      requestAnimationFrame(() => image.classList.add('scene-fade-in'));
      choices.replaceChildren();
      const choiceButtons = engine.choices().map(choice => {
        const button = element('button', 'choice-button', getLocalizedText(choice.label, engine.locale()));
        button.type = 'button';
        button.dataset.choiceId = choice.id;
        return button;
      });
      choices.append(...choiceButtons);
      choices.hidden = choiceButtons.length === 0;
      nextButton.hidden = choiceButtons.length > 0;
      nextButton.textContent = engine.isEnding() ? 'Эпизод завершён' : 'Продолжить';
      nextButton.disabled = engine.isEnding();
      backButton.disabled = !engine.canBack();
      for (const button of [ruButton, enButton]) {
        button.setAttribute('aria-pressed', String(button.dataset.locale === engine.locale()));
      }
      status.textContent = notice || (engine.isEnding() ? 'EP1 · cliffhanger' : 'EP1 · сохранение включено');
      return choiceButtons;
    }
  };
}
