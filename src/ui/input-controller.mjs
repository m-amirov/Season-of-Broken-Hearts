export function createInputController(elements, handlers) {
  let locked = false;
  let choiceCleanups = [];
  const cleanups = [];

  const run = (callback, event) => {
    event?.preventDefault?.();
    if (locked) return false;
    locked = true;
    callback?.();
    return true;
  };

  const bind = (button, callback) => {
    if (!button) return;
    const listener = event => run(callback, event);
    button.addEventListener('click', listener);
    cleanups.push(() => button.removeEventListener('click', listener));
  };

  bind(elements.nextButton, handlers.onAdvance);
  bind(elements.backButton, handlers.onBack);
  bind(elements.newGameButton, handlers.onNewGame);
  for (const button of elements.localeButtons ?? []) {
    const locale = button.dataset.locale;
    bind(button, () => handlers.onLocale?.(locale));
  }

  return {
    bindChoiceButtons(buttons) {
      for (const cleanup of choiceCleanups) cleanup();
      choiceCleanups = [];
      for (const button of buttons) {
        const listener = event => run(() => handlers.onChoose?.(button.dataset.choiceId), event);
        button.addEventListener('click', listener);
        choiceCleanups.push(() => button.removeEventListener('click', listener));
      }
    },
    unlock() {
      locked = false;
    },
    lock() {
      locked = true;
    },
    isLocked() {
      return locked;
    },
    destroy() {
      for (const cleanup of choiceCleanups) cleanup();
      for (const cleanup of cleanups) cleanup();
      choiceCleanups = [];
    }
  };
}
