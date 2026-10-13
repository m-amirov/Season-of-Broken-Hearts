import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const playwrightModule = process.env.STAGE52_PLAYWRIGHT_MODULE;
const chromePath = process.env.STAGE52_CHROME_PATH;
if (!playwrightModule || !chromePath) throw new Error('STAGE52_PLAYWRIGHT_MODULE and STAGE52_CHROME_PATH are required');
const { chromium } = await import(pathToFileURL(playwrightModule).href);
const saveKey = 'season-of-broken-hearts.save.v1';
const baseUrl = process.env.STAGE52_BASE_URL ?? 'http://127.0.0.1:4173/';
const outputPath = path.resolve(process.env.STAGE52_OUTPUT_FILE ?? 'artifacts/evidence/stage5.2-lifecycle.json');
const screenshotRoot = path.resolve('artifacts/evidence/stage5.2/lifecycle');
fs.mkdirSync(screenshotRoot, { recursive: true });

async function waitReady(page) {
  await page.waitForFunction(() => [...document.querySelectorAll('.scene-art img')]
    .every(image => image.complete && image.naturalWidth > 0 && [...image.getAnimations()].every(animation => animation.playState === 'finished')));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
}

async function start(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.evaluate(key => localStorage.removeItem(key), saveKey);
  await page.reload({ waitUntil: 'networkidle' });
  await waitReady(page);
  await page.locator('.secondary-button').nth(1).click();
  await waitReady(page);
}

async function reachFirstChoice(page) {
  while (await page.locator('.choices').isHidden()) {
    await page.locator('.primary-button').click();
    await waitReady(page);
  }
}

async function readScene(page) {
  return page.evaluate(key => ({
    save: JSON.parse(localStorage.getItem(key)),
    image: (() => {
      const node = document.querySelector('.scene-art img');
      return { src: node?.getAttribute('src'), complete: node?.complete, naturalWidth: node?.naturalWidth, naturalHeight: node?.naturalHeight };
    })()
  }), saveKey);
}

async function advanceToScene(page, targetSceneId) {
  for (let guard = 0; guard < 20; guard += 1) {
    if ((await readScene(page)).save.cursor.sceneId === targetSceneId) return;
    await page.locator('.primary-button').click();
    await page.waitForTimeout(50);
    if ((await readScene(page)).save.cursor.sceneId === targetSceneId) return;
    await waitReady(page);
  }
  throw new Error(`Did not reach ${targetSceneId}`);
}

async function runSlowTransition(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.route('**/assets/production/cg/ep1-elio-kitchen-cg.png', async route => {
    await new Promise(resolve => setTimeout(resolve, 1800));
    await route.continue();
  });
  await start(page);
  await reachFirstChoice(page);
  await page.locator('[data-choice-id="matteo_formal"]').click();
  await waitReady(page);
  await advanceToScene(page, 'ep1_kitchen');
  await page.waitForTimeout(120);
  const during = await readScene(page);
  await page.screenshot({ path: path.join(screenshotRoot, 'slow-transition-120ms-390x844.png'), fullPage: true });
  await page.waitForTimeout(2100);
  const after = await readScene(page);
  await page.screenshot({ path: path.join(screenshotRoot, 'slow-transition-after-load-390x844.png'), fullPage: true });
  await context.close();
  return { during, after, pass: during.image.naturalWidth > 0 && after.save.cursor.sceneId === 'ep1_kitchen' && after.image.src.endsWith('/assets/production/cg/ep1-elio-kitchen-cg.png') && after.image.naturalWidth > 0 };
}

async function runFailure(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  let fail = false;
  await page.route('**/assets/production/cg/ep1-elio-kitchen-cg.png', route => fail ? route.abort('failed') : route.continue());
  await start(page);
  await reachFirstChoice(page);
  fail = true;
  await page.locator('[data-choice-id="matteo_formal"]').click();
  await waitReady(page);
  await advanceToScene(page, 'ep1_kitchen');
  await page.waitForTimeout(300);
  const failed = await readScene(page);
  await page.screenshot({ path: path.join(screenshotRoot, 'failed-transition-390x844.png'), fullPage: true });
  await context.close();
  return { failed, pass: failed.image.naturalWidth > 0 };
}

async function runReducedMotion(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await start(page);
  const reduced = await page.evaluate(() => {
    const image = document.querySelector('.scene-art img');
    return { animationName: getComputedStyle(image).animationName, animationDuration: getComputedStyle(image).animationDuration, animations: image.getAnimations().length };
  });
  await page.screenshot({ path: path.join(screenshotRoot, 'reduced-motion-390x844.png'), fullPage: true });
  await context.close();
  return { reduced, pass: reduced.animationName === 'scene-fade' && Number.parseFloat(reduced.animationDuration) <= 0.001 && reduced.animations <= 1 };
}

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
try {
  const slow = await runSlowTransition(browser);
  const failure = await runFailure(browser);
  const reducedMotion = await runReducedMotion(browser);
  const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const output = { schemaVersion: 1, status: slow.pass && failure.pass && reducedMotion.pass ? 'PASS' : 'REWORK', sourceHead, baseUrl, slow, failure, reducedMotion };
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');
  console.log(JSON.stringify(output, null, 2));
} finally {
  await browser.close();
}
