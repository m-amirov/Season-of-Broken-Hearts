async (page) => {
  const saveKey = 'season-of-broken-hearts.save.v1';
  const baseUrl = 'http://127.0.0.1:4173/';
  const consoleErrors = [];
  const requestFailures = [];
  page.setDefaultTimeout(5000);
  page.setDefaultNavigationTimeout(5000);
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', request => requestFailures.push({ url: request.url(), failure: request.failure()?.errorText ?? 'unknown' }));

  const waitReady = async () => {
    await page.waitForFunction(() => [...document.querySelectorAll('.scene-art img')]
      .every(image => image.classList.contains('scene-fade-in')
        && [...image.getAnimations()].every(animation => animation.playState === 'finished')));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  };

  const readSave = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);
  const sceneId = async () => (await readSave()).cursor.sceneId;
  const clickNext = async () => {
    await page.locator('.primary-button').click();
    await waitReady();
  };
  const advanceUntilChoice = async () => {
    for (let guard = 0; guard < 100; guard += 1) {
      if (!(await page.locator('.choices').isHidden())) return;
      await clickNext();
    }
    throw new Error('choice scene was not reached within 100 dialogue advances');
  };

  const layout = async label => page.evaluate(({ label: viewportLabel }) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const selectors = ['.scene-art', '.dialogue-panel', '.dialogue-text', '.primary-button', '.choices'];
    const boxes = selectors.flatMap(selector => [...document.querySelectorAll(selector)]
      .filter(element => !element.hidden && getComputedStyle(element).display !== 'none')
      .map(element => {
        const rect = element.getBoundingClientRect();
        return {
          selector,
          left: Math.round(rect.left),
          top: Math.round(rect.top),
          right: Math.round(rect.right),
          bottom: Math.round(rect.bottom),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          withinViewport: rect.left >= -1 && rect.top >= -1 && rect.right <= width + 1 && rect.bottom <= height + 1
        };
      }));
    const overflow = {
      document: document.documentElement.scrollWidth > width || document.documentElement.scrollHeight > height,
      dialogueText: [...document.querySelectorAll('.dialogue-text')].some(element => element.scrollWidth > element.clientWidth + 1)
    };
    return {
      label: viewportLabel,
      viewport: { width, height },
      boxes,
      overflow,
      pass: !overflow.document && !overflow.dialogueText && boxes.every(box => box.withinViewport)
    };
  }, { label });

  const start = async (locale, viewport) => {
    await page.setViewportSize(viewport);
    await page.goto(`${baseUrl}?lang=${locale}`);
    await waitReady();
    await page.evaluate(key => localStorage.removeItem(key), saveKey);
    await page.reload();
    await waitReady();
    await page.locator(`.text-button[data-locale="${locale}"]`).click();
    await waitReady();
    await page.locator('.secondary-button').nth(1).click();
    await waitReady();
  };

  const playPath = async (locale, viewport, path, conditionalText, prefix) => {
    await start(locale, viewport);
    const layouts = [await layout(`${prefix}-arrival`), await (async () => {
      await advanceUntilChoice();
      return layout(`${prefix}-first-choice`);
    })()];
    for (const choiceId of path) {
      if (choiceId !== path[0]) await advanceUntilChoice();
      await page.locator(`[data-choice-id="${choiceId}"]`).click();
      await waitReady();
    }
    while (await sceneId() !== 'ep1_hook') await clickNext();

    const finalLines = [];
    for (let guard = 0; guard < 20; guard += 1) {
      finalLines.push(await page.locator('.dialogue-text').textContent());
      const next = page.locator('.primary-button');
      if (await next.isDisabled()) break;
      await clickNext();
    }
    const terminal = await readSave();
    if (terminal.cursor.sceneId !== 'ep1_hook' || !finalLines.some(line => line.includes(conditionalText))) {
      throw new Error(`delayed consequence missing for ${locale}: ${JSON.stringify({ terminal, finalLines })}`);
    }
    const terminalScreenshot = `artifacts/evidence/stage4/screenshots/${prefix}-terminal-${viewport.width}x${viewport.height}.png`;
    await page.screenshot({ path: terminalScreenshot });

    await page.reload();
    await waitReady();
    const reload = await readSave();
    await page.locator('.secondary-button').first().click();
    await waitReady();
    const back = await readSave();
    if (reload.cursor.sceneId !== 'ep1_hook' || back.cursor.sceneId !== 'ep1_hook' || back.cursor.dialogueIndex >= reload.cursor.dialogueIndex) {
      throw new Error(`Back/reload did not restore the previous terminal cursor for ${locale}`);
    }
    await clickNext();
    await page.locator('.secondary-button').nth(1).click();
    await waitReady();
    const newGame = await readSave();
    if (newGame.cursor.sceneId !== 'ep1_arrival' || newGame.cursor.dialogueIndex !== 0) {
      throw new Error(`New Game did not reset EP1 for ${locale}: ${JSON.stringify(newGame.cursor)}`);
    }

    return {
      locale,
      viewport,
      path,
      finalLineCount: finalLines.length,
      delayedConsequence: conditionalText,
      terminalCursor: terminal.cursor,
      reloadCursor: reload.cursor,
      backCursor: back.cursor,
      newGameCursor: newGame.cursor,
      layouts,
      screenshot: terminalScreenshot
    };
  };

  const ru = await playPath(
    'ru',
    { width: 1920, height: 900 },
    ['matteo_formal', 'elio_humor', 'hotel_numbers', 'leo_hear'],
    'Ника положила фотографию условий Aurea',
    'ep1-ru'
  );
  const en = await playPath(
    'en',
    { width: 390, height: 844 },
    ['matteo_direct', 'elio_boundary', 'hotel_staff', 'leo_distance'],
    "Nika opened Giulia's notebook",
    'ep1-en'
  );

  await start('ru', { width: 360, height: 640 });
  await advanceUntilChoice();
  const narrowLayout = await layout('ep1-ru-first-choice-360x640');
  if (!narrowLayout.pass) throw new Error(`critical clipping at 360x640: ${JSON.stringify(narrowLayout)}`);
  await page.screenshot({ path: 'artifacts/evidence/stage4/screenshots/ep1-ru-first-choice-360x640.png' });

  return {
    status: 'PASS',
    browser: 'Chromium via Playwright CLI',
    cases: { ru, en, narrowLayout },
    consoleErrors,
    requestFailures
  };
}
