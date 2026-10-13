export function createInputController(elements, handlers) {
  let locked = false;
  let activeGesture = null;
  let choiceCleanups = [];
  const cleanups = [];
  const gestureTarget = elements.gestureTarget ?? globalThis.document;

  const reject = event => {
    event?.preventDefault?.();
    return false;
  };

  const claimPointer = (button, event) => {
    if (locked || activeGesture) return reject(event);
    activeGesture = { button, pointerId: event.pointerId };
    return true;
  };

  const cancelPointer = event => {
    if (activeGesture?.pointerId === event.pointerId) activeGesture = null;
  };

  if (gestureTarget?.addEventListener) {
    gestureTarget.addEventListener('pointerup', cancelPointer);
    gestureTarget.addEventListener('pointercancel', cancelPointer);
    cleanups.push(() => {
      gestureTarget.removeEventListener('pointerup', cancelPointer);
      gestureTarget.removeEventListener('pointercancel', cancelPointer);
    });
  }

  const runClick = (button, callback, event) => {
    event?.preventDefault?.();
    if (locked || event?.detail > 1) return false;
    if (activeGesture && activeGesture.button !== button) return false;
    activeGesture = null;
    locked = true;
    callback?.();
    return true;
  };

  const bind = (button, callback, cleanupList = cleanups) => {
    if (!button) return;
    const pointerdown = event => claimPointer(button, event);
    const click = event => runClick(button, callback, event);
    button.addEventListener('pointerdown', pointerdown, { passive: false });
    button.addEventListener('click', click);
    cleanupList.push(() => {
      button.removeEventListener('pointerdown', pointerdown);
      button.removeEventListener('click', click);
    });
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
        bind(button, () => handlers.onChoose?.(button.dataset.choiceId), choiceCleanups);
      }
    },
    unlock() {
      locked = false;
      activeGesture = null;
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
      activeGesture = null;
    }
  };
}
