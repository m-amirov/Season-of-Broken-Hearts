async (page) => {
  const saveKey = 'season-of-broken-hearts.save.v1';
  const waitReady = async () => {
    await page.waitForFunction(() => [...document.querySelectorAll('.scene-art img')]
      .every(image => [...image.getAnimations()].every(animation => animation.playState === 'finished')));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => resolve())));
  };
  const sceneId = () => page.evaluate(key => {
    const save = JSON.parse(localStorage.getItem(key));
    return save.cursor.sceneId;
  }, saveKey);
  const dialogueIndex = () => page.evaluate(key => {
    const save = JSON.parse(localStorage.getItem(key));
    return save.cursor.dialogueIndex;
  }, saveKey);
  const clickNext = async () => {
    await page.locator('.primary-button').click();
    await waitReady();
  };
  const advanceUntilChoice = async () => {
    while (await page.locator('.choices').isHidden()) await clickNext();
  };

  await page.reload();
  await waitReady();
  await page.locator('.text-button[data-locale="ru"]').click();
  await waitReady();
  await page.locator('.secondary-button').nth(1).click();
  await waitReady();

  const path = ['matteo_formal', 'elio_humor', 'hotel_numbers', 'leo_hear'];
  for (const choiceId of path) {
    await advanceUntilChoice();
    await page.locator(`[data-choice-id="${choiceId}"]`).click();
    await waitReady();
  }
  while ((await sceneId()) !== 'ep1_hook') await clickNext();

  const finalLines = [];
  for (let index = 0; index < 5; index += 1) {
    finalLines.push(await page.locator('.dialogue-text').textContent());
    const next = page.locator('.primary-button');
    if (index < 4) {
      if (await next.isDisabled()) throw new Error(`Next disabled before final line ${index}`);
      await clickNext();
    }
  }
  const completion = {
    sceneId: await sceneId(),
    dialogueIndex: await dialogueIndex(),
    nextText: await page.locator('.primary-button').textContent(),
    nextDisabled: await page.locator('.primary-button').isDisabled(),
    finalLines
  };
  const viewport = page.viewportSize() ?? { width: 0, height: 0 };
  await page.screenshot({ path: `artifacts/evidence/stage3/screenshots/ep1-ru-terminal-${viewport.width}x${viewport.height}.png` });

  await page.reload();
  await waitReady();
  const reload = {
    sceneId: await sceneId(),
    dialogueIndex: await dialogueIndex(),
    nextText: await page.locator('.primary-button').textContent(),
    nextDisabled: await page.locator('.primary-button').isDisabled()
  };
  await page.locator('.secondary-button').first().click();
  await waitReady();
  const back = { sceneId: await sceneId(), dialogueIndex: await dialogueIndex() };
  await clickNext();
  await page.locator('.secondary-button').nth(1).click();
  await waitReady();
  const newGame = { sceneId: await sceneId(), dialogueIndex: await dialogueIndex() };

  await page.locator('.text-button[data-locale="en"]').click();
  await waitReady();
  const english = {
    title: await page.locator('.scene-title').textContent(),
    text: await page.locator('.dialogue-text').textContent(),
    buttons: await page.locator('button').allTextContents(),
    cursor: { sceneId: await sceneId(), dialogueIndex: await dialogueIndex() }
  };

  await page.reload();
  await waitReady();
  await page.locator('.secondary-button').nth(1).click();
  await waitReady();
  await advanceUntilChoice();
  const choice = page.locator('[data-choice-id="matteo_direct"]');
  const box = await choice.boundingBox();
  if (!box) throw new Error('choice target has no bounding box');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.up();
  await page.mouse.down();
  await page.mouse.up();
  await waitReady();
  const doubleTap = {
    sceneId: await sceneId(),
    dialogueIndex: await dialogueIndex(),
    visibleText: await page.locator('.dialogue-text').textContent()
  };

  return { completion, reload, back, newGame, english, doubleTap };
}
