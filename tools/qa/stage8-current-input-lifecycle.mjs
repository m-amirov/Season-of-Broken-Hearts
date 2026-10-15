async page => {
  const saveKey = 'season-of-broken-hearts.save.v1';
  page.setDefaultTimeout(10000);
  const readSave = () => page.evaluate(key => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, saveKey);
  const cursorOf = value => JSON.stringify(value?.cursor ?? null);
  const waitReader = async () => {
    await page.waitForFunction(() => [...document.querySelectorAll('.scene-art img')]
      .every(image => image.complete && [...image.getAnimations()].every(animation => animation.playState === 'finished')));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  };
  const assertNoOverflow = async label => {
    const result = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      height: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight
    }));
    if (result.width > result.clientWidth || result.height > result.clientHeight + 1) {
      throw new Error(`${label}: ${JSON.stringify(result)}`);
    }
    return result;
  };

  await page.addInitScript(key => {
    if (location.search.includes('stage8-input-fresh')) localStorage.removeItem(key);
  }, saveKey);
  await page.goto('http://127.0.0.1:4173/?stage8-input-fresh=1', { waitUntil: 'networkidle' });
  await page.locator('.home-screen').waitFor({ state: 'visible' });
  const locale = await page.evaluate(() => document.documentElement.lang);
  const labels = locale === 'en'
    ? { start: 'Begin the story', resume: 'Resume', settings: 'Settings', backToMenu: 'Back to menu', mainMenu: 'Main menu' }
    : { start: 'Начать историю', resume: 'Продолжить', settings: 'Настройки', backToMenu: 'К меню', mainMenu: 'Главное меню' };
  if (await readSave()) throw new Error('fresh title fabricated a save');
  await page.getByRole('button', { name: labels.start }).click();
  await page.locator('.episode-intro').waitFor({ state: 'visible' });
  await page.locator('.episode-intro').click();
  await waitReader();

  let advances = 0;
  while (!(await page.locator('.choices').isVisible()) && advances < 32) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(260);
    advances += 1;
  }
  if (!(await page.locator('.choices').isVisible())) throw new Error('current keyboard runner did not reach a choice');
  const preChoice = await readSave();
  const choice = page.locator('.choice-button').first();
  await choice.click();
  await waitReader();
  const afterChoice = await readSave();
  if (cursorOf(afterChoice) === cursorOf(preChoice)) throw new Error('choice did not advance the saved cursor');

  await page.locator('.reader-back').click();
  await waitReader();
  const afterBack = await readSave();
  if (cursorOf(afterBack) !== cursorOf(preChoice)) throw new Error('Back did not restore the pre-choice cursor');
  if (!(await page.locator('.choices').isVisible())) throw new Error('Back did not restore reachable choices');

  await choice.click();
  await waitReader();
  const savedBeforeReload = await readSave();
  await page.locator('.reader-menu-button').click();
  await page.getByRole('button', { name: labels.settings }).click();
  await page.getByRole('button', { name: new RegExp(labels.backToMenu.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).click();
  await page.getByRole('button', { name: labels.mainMenu }).click();
  await page.locator('.home-screen').waitFor({ state: 'visible' });
  const savedAtMenu = await readSave();
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.locator('.home-screen').waitFor({ state: 'visible' });
  const savedAfterReload = await readSave();
  if (cursorOf(savedAfterReload) !== cursorOf(savedBeforeReload)) {
    throw new Error(`reload changed the saved cursor before=${cursorOf(savedBeforeReload)} atMenu=${cursorOf(savedAtMenu)} after=${cursorOf(savedAfterReload)}`);
  }
  await page.getByRole('button', { name: labels.resume }).click();
  await waitReader();
  if (await page.locator('.home-screen').isVisible()) throw new Error('Resume did not return to reader');
  if (cursorOf(await readSave()) !== cursorOf(savedBeforeReload)) throw new Error('Resume changed the saved cursor');

  const overflow = [];
  for (const [width, height] of [[360, 640], [390, 844], [430, 932], [1366, 768]]) {
    await page.setViewportSize({ width, height });
    overflow.push({ viewport: `${width}x${height}`, ...(await assertNoOverflow(`reader ${width}x${height}`)) });
  }
  return { status: 'PASS', locale, advancesToChoice: advances, backRestored: true, saveReloadResume: true, overflow };
}
