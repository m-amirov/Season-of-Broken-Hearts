import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const baseUrl = process.env.STAGE9_BASE_URL ?? 'http://127.0.0.1:4174/';
const playwrightModule = process.env.STAGE9_PLAYWRIGHT_MODULE;
const chromePath = process.env.STAGE9_CHROME_PATH;
if (!playwrightModule || !chromePath) throw new Error('STAGE9_PLAYWRIGHT_MODULE and STAGE9_CHROME_PATH are required');

const playwright = await import(pathToFileURL(playwrightModule).href);
const { chromium } = playwright.chromium ? playwright : playwright.default;
const saveKey = 'season-of-broken-hearts.save.v1';
const defaultViewports = [
  { width: 1920, height: 1080 },
  { width: 1920, height: 900 },
  { width: 1600, height: 900 },
  { width: 390, height: 844 },
  { width: 360, height: 640 },
  { width: 430, height: 932 }
];
const viewports = process.env.STAGE9_VIEWPORTS_JSON ? JSON.parse(process.env.STAGE9_VIEWPORTS_JSON) : defaultViewports;
const defaultRoutes = [
  {
    id: 'transparent-budget',
    choices: {
      ep1_gate: 'matteo_formal', ep1_kitchen: 'elio_humor', ep1_hotel_crisis: 'hotel_numbers', ep1_leo_choice: 'leo_hear',
      ep2_wedding_budget: 'ep2_budget_open'
    }
  },
  {
    id: 'temporary-budget',
    choices: {
      ep1_gate: 'matteo_direct', ep1_kitchen: 'elio_boundary', ep1_hotel_crisis: 'hotel_staff', ep1_leo_choice: 'leo_distance',
      ep2_wedding_budget: 'ep2_budget_improvise'
    }
  }
];
const routes = process.env.STAGE9_ROUTES_JSON ? JSON.parse(process.env.STAGE9_ROUTES_JSON) : defaultRoutes;
const targetScenes = new Set(['ep2_morning_brief', 'ep2_wedding_budget', 'ep2_workday_inventory']);
const outputPath = path.resolve(process.env.STAGE9_OUTPUT_FILE ?? 'artifacts/evidence/stage9.4-ep2-runtime.json');
const screenshotRoot = path.resolve(process.env.STAGE9_SCREENSHOT_ROOT ?? 'artifacts/evidence/stage9.4-ep2-runtime');
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();

function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function relative(file) { return path.relative(root, file).split(path.sep).join('/'); }
function expectedFormat(viewport) { return viewport.width / viewport.height >= 1.15 ? 'landscape' : 'portrait'; }
async function readState(page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? 'null'), saveKey); }
async function readRuntime(page, viewport) {
  return page.evaluate(({ key, expected }) => {
    const save = JSON.parse(localStorage.getItem(key) ?? 'null');
    const image = document.querySelector('.scene-art img');
    const art = document.querySelector('.scene-art');
    const rect = art?.getBoundingClientRect();
    return {
      sceneId: save?.cursor?.sceneId ?? null,
      dialogueIndex: save?.cursor?.dialogueIndex ?? null,
      assetId: image?.dataset.assetId ?? null,
      assetFormat: image?.dataset.assetFormat ?? null,
      assetRequestedFormat: image?.dataset.assetRequestedFormat ?? null,
      assetSrc: image?.dataset.assetSrc ?? null,
      naturalWidth: image?.naturalWidth ?? 0,
      naturalHeight: image?.naturalHeight ?? 0,
      artBounds: rect ? { width: Math.round(rect.width), height: Math.round(rect.height) } : null,
      expectedFormat: expected,
      noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
      noVerticalOverflow: document.documentElement.scrollHeight <= window.innerHeight,
      language: document.documentElement.lang
    };
  }, { key: saveKey, expected: expectedFormat(viewport) });
}
async function waitRuntimeReady(page) {
  await page.waitForFunction(key => {
    const state = JSON.parse(localStorage.getItem(key) ?? 'null');
    const image = document.querySelector('.scene-art img');
    return state?.cursor?.sceneId && image?.dataset.sceneId === state.cursor.sceneId
      && image.complete && image.naturalWidth > 0
      && document.querySelector('.episode-intro')?.hidden === true
      && [...image.getAnimations()].every(animation => animation.playState === 'finished');
  }, saveKey, { timeout: 15000 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForTimeout(450);
}
async function waitForCursorChange(page, before) {
  try {
    await page.waitForFunction(({ key, sceneId, dialogueIndex }) => {
      const state = JSON.parse(localStorage.getItem(key) ?? 'null');
      return state?.cursor && (state.cursor.sceneId !== sceneId || state.cursor.dialogueIndex !== dialogueIndex);
    }, { key: saveKey, sceneId: before.cursor.sceneId, dialogueIndex: before.cursor.dialogueIndex }, { timeout: 15000 });
  } catch (error) {
    const current = await readState(page);
    throw new Error(`Cursor did not advance from ${before.cursor.sceneId}/${before.cursor.dialogueIndex}; current=${JSON.stringify(current?.cursor ?? null)}: ${error.message}`);
  }
  const after = await readState(page);
  if (after.cursor.sceneId !== before.cursor.sceneId) await waitRuntimeReady(page);
}
async function startFresh(page, suffix) {
  await page.goto(`${baseUrl}?lang=ru&stage9-4=${suffix}`, { waitUntil: 'networkidle' });
  await page.evaluate(key => localStorage.removeItem(key), saveKey);
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Начать историю' }).click();
  await page.locator('.episode-intro').waitFor({ state: 'visible' });
  await page.locator('.episode-intro').click();
  await waitRuntimeReady(page);
}

const output = {
  schemaVersion: 1,
  status: 'RUNNING',
  sourceHead,
  baseUrl,
  viewports,
  routes: [],
  captures: [],
  transitionChecks: {},
  consoleErrors: [],
  requestFailures: [],
  httpErrors: []
};
const browser = await chromium.launch({ headless: true, executablePath: chromePath });

try {
  for (const viewport of viewports) {
    for (const route of routes) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      page.setDefaultNavigationTimeout(15000);
      const consoleErrors = [];
      const requestFailures = [];
      const httpErrors = [];
      page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
      page.on('requestfailed', request => requestFailures.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' }));
      page.on('response', response => { if (response.status() >= 400) httpErrors.push({ url: response.url(), status: response.status() }); });

      await startFresh(page, `${viewport.width}-${viewport.height}-${route.id}`);
      const seenScenes = [];
      const capturedScenes = [];
      for (let guard = 0; guard < 260; guard += 1) {
        const state = await readRuntime(page, viewport);
        if (!state.sceneId) throw new Error(`Missing scene state at ${viewport.width}x${viewport.height}/${route.id}`);
        if (!seenScenes.includes(state.sceneId)) seenScenes.push(state.sceneId);
        if (targetScenes.has(state.sceneId) && !capturedScenes.includes(state.sceneId)) {
          const file = path.join(screenshotRoot, `${viewport.width}x${viewport.height}`, route.id, `${state.sceneId}.png`);
          fs.mkdirSync(path.dirname(file), { recursive: true });
          await page.screenshot({ path: file, fullPage: true });
          output.captures.push({
            viewport, route: route.id, sceneId: state.sceneId, assetId: state.assetId,
            format: state.assetFormat, source: state.assetSrc,
            naturalDimensions: `${state.naturalWidth}x${state.naturalHeight}`,
            screenshot: relative(file), screenshotSha256: sha256(file), screenshotBytes: fs.statSync(file).size,
            visualRuntime: { artBounds: state.artBounds, dialogueSafeScreenshot: true, noHorizontalOverflow: state.noHorizontalOverflow, noVerticalOverflow: state.noVerticalOverflow },
            language: state.language
          });
          capturedScenes.push(state.sceneId);
        }
        if (state.sceneId === 'ep2_workday_inventory' && capturedScenes.includes(state.sceneId)) break;
        const save = await readState(page);
        const choiceButtons = page.locator('.choices .choice-button');
        if (await choiceButtons.count()) {
          const choiceId = route.choices[state.sceneId];
          if (!choiceId) throw new Error(`No choice mapping for ${state.sceneId} in ${route.id}`);
          const before = await readState(page);
          await page.locator(`[data-choice-id="${choiceId}"]`).click();
          await waitForCursorChange(page, before);
        } else {
          await page.locator('.reader-stage').click({ position: { x: 5, y: 5 } });
          await waitForCursorChange(page, save);
        }
      }
      if (capturedScenes.length !== targetScenes.size) throw new Error(`Target scene coverage ${capturedScenes.length}/${targetScenes.size} for ${route.id}`);
      output.routes.push({ route: route.id, viewport, sceneIds: seenScenes, sceneCount: seenScenes.length, capturedScenes, consoleErrors, requestFailures, httpErrors });
      output.consoleErrors.push(...consoleErrors.map(error => ({ viewport, route: route.id, error })));
      output.requestFailures.push(...requestFailures.map(error => ({ viewport, route: route.id, ...error })));
      output.httpErrors.push(...httpErrors.map(error => ({ viewport, route: route.id, ...error })));
      await context.close();
    }
  }

  const transitionContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const transitionPage = await transitionContext.newPage();
  await startFresh(transitionPage, 'transitions');
  const beforeBack = await readState(transitionPage);
  await transitionPage.locator('.reader-stage').click({ position: { x: 5, y: 5 } });
  await waitForCursorChange(transitionPage, beforeBack);
  const afterAdvance = await readState(transitionPage);
  await transitionPage.getByRole('button', { name: 'Назад' }).click();
  await waitRuntimeReady(transitionPage);
  const afterBack = await readState(transitionPage);
  await transitionPage.getByRole('button', { name: 'Меню' }).click();
  await transitionPage.getByRole('button', { name: 'Новая игра' }).click();
  await transitionPage.getByRole('button', { name: 'Начать заново' }).click();
  await transitionPage.locator('.episode-intro').waitFor({ state: 'visible' });
  await transitionPage.locator('.episode-intro').click();
  await waitRuntimeReady(transitionPage);
  const afterNewGame = await readState(transitionPage);
  output.transitionChecks = {
    back: { before: beforeBack.cursor, afterAdvance: afterAdvance.cursor, afterBack: afterBack.cursor, restored: afterBack.cursor.sceneId === beforeBack.cursor.sceneId && afterBack.cursor.dialogueIndex === beforeBack.cursor.dialogueIndex },
    newGame: { cursor: afterNewGame.cursor, resetToStart: afterNewGame.cursor.sceneId === 'ep1_arrival' && afterNewGame.cursor.dialogueIndex === 0 },
    locale: await transitionPage.evaluate(() => ({ htmlLang: document.documentElement.lang, title: document.title }))
  };
  await transitionContext.close();

  if (output.captures.length !== viewports.length * routes.length * targetScenes.size) throw new Error(`Screenshot coverage ${output.captures.length}`);
  if (output.consoleErrors.length || output.requestFailures.length || output.httpErrors.length) {
    throw new Error(`Runtime errors: console=${output.consoleErrors.length}, request=${output.requestFailures.length}, http=${output.httpErrors.length}`);
  }
  if (output.captures.some(capture => !capture.visualRuntime.noHorizontalOverflow || !capture.visualRuntime.noVerticalOverflow)) {
    throw new Error('Runtime overflow detected in one or more captures');
  }
  if (output.captures.some(capture => capture.language !== 'ru')) throw new Error('Locale mismatch');
  if (!output.transitionChecks.back.restored || !output.transitionChecks.newGame.resetToStart) {
    console.error(JSON.stringify({ transitionChecks: output.transitionChecks }, null, 2));
    throw new Error('Back/New Game check failed');
  }
  output.status = 'PASS_STAGE9_4_RUNTIME_VISUAL_CAPTURE';
} finally {
  await browser.close();
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({
  status: output.status, sourceHead, output: relative(outputPath), captures: output.captures.length,
  consoleErrors: output.consoleErrors.length, requestFailures: output.requestFailures.length, httpErrors: output.httpErrors.length,
  transitionChecks: output.transitionChecks
}, null, 2));
