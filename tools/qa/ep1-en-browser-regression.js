async (page) => {
  const saveKey = 'season-of-broken-hearts.save.v1';
  const waitReady = async () => {
    await page.waitForFunction(() => [...document.querySelectorAll('.scene-art img')]
      .every(image => [...image.getAnimations()].every(animation => animation.playState === 'finished')));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  };
  const sceneId = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)).cursor.sceneId, saveKey);
  const clickNext = async () => { await page.locator('.primary-button').click(); await waitReady(); };
  const advanceUntilChoice = async () => { while (await page.locator('.choices').isHidden()) await clickNext(); };

  await page.evaluate(key => localStorage.removeItem(key), saveKey);
  await page.reload();
  await waitReady();
  await page.locator('.text-button[data-locale="en"]').click();
  await waitReady();
  const newGame = page.locator('.secondary-button').nth(1);
  await newGame.click();
  await waitReady();

  const path = ['matteo_direct', 'elio_boundary', 'hotel_staff', 'leo_distance'];
  const branchScenes = [];
  for (const choiceId of path) {
    await advanceUntilChoice();
    await page.locator(`[data-choice-id="${choiceId}"]`).click();
    await waitReady();
    branchScenes.push(await sceneId());
  }
  while (await sceneId() !== 'ep1_hook') await clickNext();
  const lines = [];
  for (let index = 0; index < 5; index += 1) {
    lines.push(await page.locator('.dialogue-text').textContent());
    if (index < 4) await clickNext();
  }
  return {
    status: 'PASS',
    locale: await page.locator('.text-button[data-locale="en"]').getAttribute('aria-pressed'),
    branchScenes,
    finalScene: await sceneId(),
    finalLineCount: lines.length,
    completionText: await page.locator('.primary-button').textContent(),
    completionDisabled: await page.locator('.primary-button').isDisabled(),
    englishLines: lines
  };
}
