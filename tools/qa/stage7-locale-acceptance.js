async page => {
  const baseUrl = 'http://127.0.0.1:4173/';
  page.setDefaultTimeout(8000);
  page.setDefaultNavigationTimeout(8000);

  await page.addInitScript(() => {
    const query = new URL(location.href).searchParams;
    localStorage.removeItem('season-of-broken-hearts.save.v1');
    const sdkLocale = query.get('stage7-sdk-lang');
    const browserLocale = query.get('stage7-browser-lang');
    if (sdkLocale) {
      window.YaGames = {
        init: () => Promise.resolve({ environment: { i18n: { lang: sdkLocale } } })
      };
    } else if (browserLocale) {
      Object.defineProperty(navigator, 'language', { configurable: true, value: browserLocale });
      window.YaGames = undefined;
    }
  });

  const run = async (query, expected, source) => {
    await page.goto(`${baseUrl}?stage7-fresh=1&${query}`);
    await page.locator('.home-screen').waitFor({ state: 'visible' });
    const result = await page.evaluate(() => ({
      htmlLang: document.documentElement.lang,
      title: document.title,
      text: document.querySelector('.home-screen')?.innerText ?? '',
      languageControls: document.querySelectorAll('[data-locale]').length
    }));
    if (result.htmlLang !== expected) throw new Error(`${source}: expected ${expected}, got ${result.htmlLang}`);
    if (result.languageControls !== 0) throw new Error(`${source}: manual locale controls are visible`);
    const expectedTitle = expected === 'ru' ? 'Сезон разбитых сердец' : 'Season of Broken Hearts';
    if (result.title !== expectedTitle || !result.text.includes(expected === 'ru' ? 'Начать историю' : 'Begin the story')) {
      throw new Error(`${source}: localized title screen did not render`);
    }
    return { source, input: query, expected, ...result };
  };

  const results = [];
  results.push(await run('stage7-sdk-lang=ru-RU', 'ru', 'Yandex debug SDK RU'));
  results.push(await run('stage7-sdk-lang=en-US', 'en', 'Yandex debug SDK EN'));
  results.push(await run('stage7-browser-lang=ru-RU', 'ru', 'local browser RU fallback'));
  results.push(await run('stage7-browser-lang=en-US', 'en', 'local browser EN fallback'));
  return { status: 'PASS', results };
}
