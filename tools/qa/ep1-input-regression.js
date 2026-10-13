async (page) => {
  const saveKey = 'season-of-broken-hearts.save.v1';
  let pointerId = 100;
  page.setDefaultTimeout(5000);
  page.setDefaultNavigationTimeout(5000);

  const waitReady = async () => {
    await page.waitForFunction(() => [...document.querySelectorAll('.scene-art img')]
      .every(image => image.classList.contains('scene-fade-in')
        && [...image.getAnimations()].every(animation => animation.playState === 'finished')), { timeout: 5000 });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  };

  const sceneId = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)).cursor.sceneId, saveKey);
  const tap = async locator => {
    const id = pointerId++;
    await locator.evaluate((button, pointerId) => {
      const pointer = {
        bubbles: true,
        cancelable: true,
        pointerId,
        pointerType: 'touch',
        isPrimary: true
      };
      button.dispatchEvent(new PointerEvent('pointerdown', pointer));
      button.dispatchEvent(new PointerEvent('pointerup', pointer));
      button.click();
    }, id);
    await waitReady();
  };

  const resetToEnglish = async () => {
    await page.evaluate(key => localStorage.removeItem(key), saveKey);
    await page.reload();
    await waitReady();
    await page.locator('.text-button[data-locale="en"]').click();
    await waitReady();
    await page.locator('.secondary-button').nth(1).click();
    await waitReady();
  };

  const advanceUntilChoice = async () => {
    while (await page.locator('.choices').isHidden()) {
      await page.locator('.primary-button').click();
      await waitReady();
    }
  };

  const results = {};

  await resetToEnglish();
  await advanceUntilChoice();
  const firstChoice = page.locator('[data-choice-id="matteo_formal"]');
  const secondChoice = page.locator('[data-choice-id="matteo_direct"]');
  await firstChoice.dispatchEvent('pointerdown', {
    bubbles: true,
    cancelable: true,
    pointerId: pointerId++,
    pointerType: 'touch',
    isPrimary: true
  });
  await page.locator('body').dispatchEvent('pointerup', {
    bubbles: true,
    cancelable: true,
    pointerId: pointerId - 1,
    pointerType: 'touch',
    isPrimary: true
  });
  await secondChoice.click();
  await waitReady();
  results.pointerupOutside = await sceneId();
  if (results.pointerupOutside !== 'ep1_matteo_direct_response') {
    throw new Error(`pointerup outside did not release ownership: ${results.pointerupOutside}`);
  }

  await resetToEnglish();
  await advanceUntilChoice();
  const cancelChoice = page.locator('[data-choice-id="matteo_formal"]');
  const cancelId = pointerId++;
  await cancelChoice.dispatchEvent('pointerdown', {
    bubbles: true,
    cancelable: true,
    pointerId: cancelId,
    pointerType: 'touch',
    isPrimary: true
  });
  await page.locator('body').dispatchEvent('pointercancel', {
    bubbles: true,
    cancelable: true,
    pointerId: cancelId,
    pointerType: 'touch',
    isPrimary: true
  });
  await cancelChoice.click();
  await waitReady();
  results.pointercancelOutside = await sceneId();
  if (results.pointercancelOutside !== 'ep1_matteo_formal_response') {
    throw new Error(`pointercancel outside did not release ownership: ${results.pointercancelOutside}`);
  }

  await resetToEnglish();
  await advanceUntilChoice();
  const dragChoice = page.locator('[data-choice-id="matteo_formal"]');
  const dragId = pointerId++;
  await dragChoice.dispatchEvent('pointerdown', {
    bubbles: true,
    cancelable: true,
    pointerId: dragId,
    pointerType: 'touch',
    isPrimary: true
  });
  await page.locator('body').dispatchEvent('pointermove', {
    bubbles: true,
    cancelable: true,
    pointerId: dragId,
    pointerType: 'touch',
    isPrimary: true,
    clientX: 2,
    clientY: 2
  });
  await page.locator('body').dispatchEvent('pointerup', {
    bubbles: true,
    cancelable: true,
    pointerId: dragId,
    pointerType: 'touch',
    isPrimary: true,
    clientX: 2,
    clientY: 2
  });
  await page.locator('[data-choice-id="matteo_direct"]').click();
  await waitReady();
  results.dragOffRelease = await sceneId();
  if (results.dragOffRelease !== 'ep1_matteo_direct_response') {
    throw new Error(`drag-off release did not allow the next button: ${results.dragOffRelease}`);
  }

  await resetToEnglish();
  await advanceUntilChoice();
  await page.evaluate(() => {
    const button = document.querySelector('[data-choice-id="matteo_formal"]');
    const pointer = { bubbles: true, cancelable: true, pointerId: 140, pointerType: 'touch', isPrimary: true };
    button.dispatchEvent(new PointerEvent('pointerdown', pointer));
    document.body.dispatchEvent(new PointerEvent('pointerup', pointer));
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }));
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 2 }));
  });
  await waitReady();
  results.doubleTap = await sceneId();
  if (results.doubleTap !== 'ep1_matteo_formal_response') {
    throw new Error(`double-tap caused an unexpected transition: ${results.doubleTap}`);
  }

  await resetToEnglish();
  await advanceUntilChoice();
  const keyboardChoice = page.locator('[data-choice-id="matteo_direct"]');
  await keyboardChoice.focus();
  await page.keyboard.press('Enter');
  await waitReady();
  results.keyboardActivation = await sceneId();
  if (results.keyboardActivation !== 'ep1_matteo_direct_response') {
    throw new Error(`keyboard activation failed: ${results.keyboardActivation}`);
  }

  await resetToEnglish();
  await advanceUntilChoice();
  await page.locator('[data-choice-id="matteo_formal"]').dispatchEvent('click', {
    bubbles: true,
    cancelable: true,
    detail: 0
  });
  await waitReady();
  results.screenReaderClick = await sceneId();
  if (results.screenReaderClick !== 'ep1_matteo_formal_response') {
    throw new Error(`screen-reader click failed: ${results.screenReaderClick}`);
  }

  await resetToEnglish();
  await advanceUntilChoice();
  await tap(page.locator('[data-choice-id="matteo_formal"]'));
  results.touchChoiceTransition = await sceneId();
  if (results.touchChoiceTransition !== 'ep1_matteo_formal_response') {
    throw new Error(`touch choice transition failed: ${results.touchChoiceTransition}`);
  }

  await page.evaluate(() => localStorage.removeItem('__stage4_progress'));
  return { status: 'PASS', locale: 'en', results };
}
