async page => {
  const saveKey = 'season-of-broken-hearts.save.v1';
  const screenshotRoot = 'output/playwright/stage7';
  page.setDefaultTimeout(8000);
  page.setDefaultNavigationTimeout(8000);

  const save = () => page.evaluate(key => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, saveKey);
  const visible = selector => page.locator(selector).filter({ visible: true }).first();
  const waitReader = async () => {
    await page.waitForFunction(() => [...document.querySelectorAll('.scene-art img')]
      .every(image => image.complete && [...image.getAnimations()].every(animation => animation.playState === 'finished')));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  };
  const clickHomeAction = async text => {
    await page.evaluate(label => {
      const button = [...document.querySelectorAll('.home-action')]
        .find(element => !element.hidden && element.textContent.trim() === label);
      if (!button) throw new Error(`Home action not found: ${label}`);
      button.click();
    }, text);
  };
  const clickMenuAction = async text => {
    await page.evaluate(label => {
      const button = [...document.querySelectorAll('.reader-menu .menu-action')]
        .find(element => !element.hidden && element.textContent.trim() === label);
      if (!button) throw new Error(`Menu action not found: ${label}`);
      button.click();
    }, text);
  };
  const resize = async (width, height) => {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  };
  const capture = name => page.screenshot({ path: `${screenshotRoot}/${name}.png`, scale: 'css' });
  const visibleHomeText = () => page.locator('.home-screen').innerText();
  const visibleMenuText = () => page.locator('.reader-menu').innerText();
  const assertNoOverflow = async label => {
    const overflow = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
      height: document.documentElement.scrollHeight,
      viewport: document.documentElement.clientHeight
    }));
    if (overflow.width > overflow.client || overflow.height > overflow.viewport + 1) {
      throw new Error(`${label}: overflow ${JSON.stringify(overflow)}`);
    }
    return overflow;
  };

  await page.addInitScript(key => {
    if (location.search.includes('stage7-fresh')) localStorage.removeItem(key);
  }, saveKey);
  await page.goto('http://127.0.0.1:4173/?stage7-fresh=1');
  await page.locator('.home-screen').waitFor({ state: 'visible' });
  const locale = await page.evaluate(() => document.documentElement.lang);
  const labels = locale === 'en' ? {
    resume: 'Resume', newGame: 'New Game', settings: 'Settings', mainMenu: 'Main menu',
    start: 'Begin the story', backToMenu: '← Back to menu', cancel: 'Cancel'
  } : {
    resume: 'Продолжить', newGame: 'Новая игра', settings: 'Настройки', mainMenu: 'Главное меню',
    start: 'Начать историю', backToMenu: '← К меню', cancel: 'Отмена'
  };
  const freshHomeText = await visibleHomeText();
  if (freshHomeText.includes(labels.resume)) throw new Error('Fresh title screen exposes Resume');
  if (await save()) throw new Error('Fresh title screen fabricated a save');

  const titleViewports = [[1366, 768], [1600, 900], [1920, 900], [1920, 1080]];
  for (const [width, height] of titleViewports) {
    await resize(width, height);
    await assertNoOverflow(`home ${width}x${height}`);
    await capture(`home-desktop-${width}x${height}`);
  }
  for (const [width, height] of [[360, 640], [390, 844], [430, 932]]) {
    await resize(width, height);
    await assertNoOverflow(`home ${width}x${height}`);
    await capture(`home-mobile-${width}x${height}`);
  }

  await resize(390, 844);
  await clickHomeAction(labels.settings);
  await page.locator('.reader-menu').waitFor({ state: 'visible' });
  await assertNoOverflow('home settings mobile');
  await capture('settings-mobile-390x844');
  await clickMenuAction(labels.backToMenu);
  if (await page.locator('.reader-menu').isVisible()) throw new Error('Home settings did not close');

  await clickHomeAction(labels.start);
  await page.locator('.episode-intro').waitFor({ state: 'visible' });
  await page.waitForTimeout(800);
  await capture('ep1-intro-mobile-390x844');
  await page.locator('.episode-intro').click();
  await waitReader();
  await capture('dialogue-mobile-390x844');

  let clicks = 0;
  while (await page.locator('.choices').isHidden() && clicks < 30) {
    const box = await page.locator('.reader-stage').boundingBox();
    if (!box) throw new Error('Reader stage has no hit area');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(180);
    clicks += 1;
  }
  if (await page.locator('.choices').isHidden()) throw new Error('Choice did not become reachable');
  await assertNoOverflow('choice mobile');
  await capture('choice-mobile-390x844');

  await page.locator('.reader-menu-button').click();
  await page.locator('.reader-menu').waitFor({ state: 'visible' });
  await resize(1600, 900);
  await assertNoOverflow('reader menu desktop');
  await capture('ingame-menu-desktop-1600x900');

  await clickMenuAction(labels.settings);
  await assertNoOverflow('reader settings desktop');
  await capture('settings-desktop-1600x900');
  await resize(390, 844);
  await assertNoOverflow('reader settings mobile');
  await capture('settings-mobile-reader-390x844');

  await clickMenuAction(labels.backToMenu);
  await clickMenuAction(labels.newGame);
  await assertNoOverflow('new game confirmation mobile');
  await capture('new-game-confirmation-mobile-390x844');
  await clickMenuAction(labels.cancel);
  await clickMenuAction(labels.mainMenu);
  await page.locator('.home-screen').waitFor({ state: 'visible' });
  const savedHomeText = await visibleHomeText();
  if (!savedHomeText.includes(labels.resume) || !savedHomeText.includes(labels.newGame)) {
    throw new Error('Saved title screen does not expose Resume and New Game');
  }
  await assertNoOverflow('saved home mobile');
  await capture('home-saved-mobile-390x844');

  await page.goto('http://127.0.0.1:4173/');
  await page.locator('.home-screen').waitFor({ state: 'visible' });
  const beforeReload = await save();
  await page.reload();
  await page.locator('.home-screen').waitFor({ state: 'visible' });
  const afterReload = await save();
  if (JSON.stringify(afterReload?.cursor) !== JSON.stringify(beforeReload?.cursor)) {
    throw new Error('Reload changed the saved cursor');
  }
  await clickHomeAction(labels.resume);
  await waitReader();
  if (await page.locator('.home-screen').isVisible()) throw new Error('Resume left title screen open');
  if (JSON.stringify((await save())?.cursor) !== JSON.stringify(beforeReload?.cursor)) {
    throw new Error('Resume changed the saved cursor');
  }

  await page.locator('.reader-menu-button').click();
  await clickMenuAction(labels.settings);
  if (await page.locator('button[data-locale], [data-locale]').count()) {
    throw new Error('Manual locale controls are still exposed');
  }

  return {
    status: 'PASS',
    titleViewports,
    choiceClicks: clicks,
    savedCursor: beforeReload?.cursor,
    locale,
    screenshots: titleViewports.length + 12
  };
}
