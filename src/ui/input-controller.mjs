const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, summary, [contenteditable="true"], [data-no-advance]';
const DRAG_DISTANCE_PX = 12;
const LONG_PRESS_MS = 650;

function isInteractiveTarget(target) {
  return Boolean(target?.closest?.(INTERACTIVE_SELECTOR));
}

export function createInputController(elements, handlers) {
  let locked = false;
  let menuOpen = false;
  let activeGesture = null;
  let surfaceGesture = null;
  let suppressSurfaceClickUntil = 0;
  let choiceCleanups = [];
  const cleanups = [];
  const gestureTarget = elements.gestureTarget ?? globalThis.document;

  const reject = event => {
    event?.preventDefault?.();
    return false;
  };

  const claimPointer = (button, event, narrative = true) => {
    if ((narrative && (locked || menuOpen)) || activeGesture || event?.isPrimary === false) return reject(event);
    activeGesture = { button, pointerId: event.pointerId };
    return true;
  };

  const cancelButtonPointer = event => {
    if (activeGesture?.pointerId === event.pointerId) activeGesture = null;
  };

  const finishSurfacePointer = event => {
    if (!surfaceGesture || surfaceGesture.pointerId !== event.pointerId) return;
    const gesture = surfaceGesture;
    surfaceGesture = null;
    const elapsed = Number.isFinite(event?.duration)
      ? event.duration
      : Math.max(0, Date.now() - gesture.startedAt);
    if (event.type === 'pointercancel' || gesture.moved || elapsed > LONG_PRESS_MS) {
      suppressSurfaceClickUntil = Date.now() + 500;
    }
  };

  const releasePointer = event => {
      cancelButtonPointer(event);
      finishSurfacePointer(event);
  };

  if (gestureTarget?.addEventListener) {
    gestureTarget.addEventListener('pointerup', releasePointer);
    gestureTarget.addEventListener('pointercancel', releasePointer);
    cleanups.push(() => {
      gestureTarget.removeEventListener('pointerup', releasePointer);
      gestureTarget.removeEventListener('pointercancel', releasePointer);
    });
  }

  const runClick = (button, callback, event, narrative = true) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if ((narrative && (locked || menuOpen)) || event?.detail > 1) return false;
    if (activeGesture && activeGesture.button !== button) return false;
    activeGesture = null;
    if (narrative) locked = true;
    callback?.();
    return true;
  };

  const bind = (button, callback, cleanupList = cleanups, { narrative = true } = {}) => {
    if (!button || !callback) return;
    const pointerdown = event => claimPointer(button, event, narrative);
    const click = event => runClick(button, callback, event, narrative);
    button.addEventListener('pointerdown', pointerdown, { passive: false });
    button.addEventListener('click', click);
    cleanupList.push(() => {
      button.removeEventListener('pointerdown', pointerdown);
      button.removeEventListener('click', click);
    });
  };

  const surface = elements.advanceSurface;
  const surfacePointerDown = event => {
    if (locked || menuOpen || event?.isPrimary === false || isInteractiveTarget(event.target)) return reject(event);
    if (surfaceGesture) return reject(event);
    surfaceGesture = {
      pointerId: event.pointerId,
      clientX: event.clientX ?? 0,
      clientY: event.clientY ?? 0,
      startedAt: Date.now(),
      moved: false
    };
    event.preventDefault?.();
  };
  const surfacePointerMove = event => {
    if (!surfaceGesture || surfaceGesture.pointerId !== event.pointerId) return;
    const dx = (event.clientX ?? 0) - surfaceGesture.clientX;
    const dy = (event.clientY ?? 0) - surfaceGesture.clientY;
    if (Math.hypot(dx, dy) > DRAG_DISTANCE_PX) surfaceGesture.moved = true;
  };
  const surfaceClick = event => {
    if (isInteractiveTarget(event.target)) return false;
    if (Date.now() < suppressSurfaceClickUntil) return false;
    if (event.detail > 1 || locked || menuOpen) return false;
    event.preventDefault?.();
    event.stopPropagation?.();
    locked = true;
    handlers.onAdvance?.();
    return true;
  };
  const surfaceKeyDown = event => {
    if (!['Space', 'Enter', 'ArrowRight'].includes(event.code)) return;
    if (isInteractiveTarget(event.target) || locked || menuOpen) return;
    event.preventDefault?.();
    locked = true;
    handlers.onAdvance?.();
  };

  if (surface?.addEventListener) {
    surface.addEventListener('pointerdown', surfacePointerDown, { passive: false });
    surface.addEventListener('pointermove', surfacePointerMove, { passive: true });
    surface.addEventListener('pointerup', finishSurfacePointer);
    surface.addEventListener('pointercancel', finishSurfacePointer);
    surface.addEventListener('click', surfaceClick);
    surface.addEventListener('keydown', surfaceKeyDown);
    cleanups.push(() => {
      surface.removeEventListener('pointerdown', surfacePointerDown);
      surface.removeEventListener('pointermove', surfacePointerMove);
      surface.removeEventListener('pointerup', finishSurfacePointer);
      surface.removeEventListener('pointercancel', finishSurfacePointer);
      surface.removeEventListener('click', surfaceClick);
      surface.removeEventListener('keydown', surfaceKeyDown);
    });
  }

  bind(elements.nextButton, handlers.onAdvance);
  bind(elements.backButton, handlers.onBack);
  bind(elements.menuButton, handlers.onMenu, cleanups, { narrative: false });
  bind(elements.menuCloseButton, handlers.onMenuClose, cleanups, { narrative: false });
  bind(elements.menuContinueButton, handlers.onMenuClose, cleanups, { narrative: false });
  bind(elements.menuSettingsButton, handlers.onSettings, cleanups, { narrative: false });
  bind(elements.menuHomeButton, handlers.onHome, cleanups, { narrative: false });
  bind(elements.settingsBackButton, handlers.onSettingsBack, cleanups, { narrative: false });
  bind(elements.menuNewGameButton, handlers.onNewGameRequest, cleanups, { narrative: false });
  bind(elements.newGameConfirmButton, handlers.onNewGameConfirm, cleanups, { narrative: false });
  bind(elements.newGameCancelButton, handlers.onNewGameCancel, cleanups, { narrative: false });
  for (const button of elements.localeButtons ?? []) {
    bind(button, () => handlers.onLocale?.(button.dataset.locale), cleanups, { narrative: false });
  }
  for (const button of elements.settingButtons ?? []) {
    bind(button, () => handlers.onSetting?.(button.dataset.setting), cleanups, { narrative: false });
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
      activeGesture = null;
    },
    setMenuOpen(open) {
      menuOpen = Boolean(open);
      surfaceGesture = null;
      activeGesture = null;
    },
    isLocked() {
      return locked;
    },
    destroy() {
      for (const cleanup of choiceCleanups) cleanup();
      for (const cleanup of cleanups) cleanup();
      choiceCleanups = [];
      activeGesture = null;
      surfaceGesture = null;
    }
  };
}
