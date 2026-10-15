import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const baseUrl = process.env.STAGE8_BASE_URL ?? 'http://127.0.0.1:4173/';
const playwrightModule = process.env.STAGE8_PLAYWRIGHT_MODULE;
const chromePath = process.env.STAGE8_CHROME_PATH;
if (!playwrightModule || !chromePath) throw new Error('STAGE8_PLAYWRIGHT_MODULE and STAGE8_CHROME_PATH are required');
const { chromium } = await import(pathToFileURL(playwrightModule).href);
const saveKey = 'season-of-broken-hearts.save.v1';
const outputPath = path.resolve(process.env.STAGE8_OUTPUT_FILE ?? 'artifacts/evidence/stage8.3-targeted-runtime-20261014.json');
const screenshotRoot = path.resolve(process.env.STAGE8_SCREENSHOT_ROOT ?? 'artifacts/evidence/stage8.3-targeted-runtime');
const defaultViewports = [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 1366, height: 768 },
  { width: 1600, height: 900 },
  { width: 1920, height: 1080 }
];
const viewports = process.env.STAGE8_VIEWPORTS_JSON ? JSON.parse(process.env.STAGE8_VIEWPORTS_JSON) : defaultViewports;
const defaultRoutes = [
  { id: 'formal-humor-numbers-hear', choices: { ep1_gate: 'matteo_formal', ep1_kitchen: 'elio_humor', ep1_hotel_crisis: 'hotel_numbers', ep1_leo_choice: 'leo_hear' } },
  { id: 'direct-boundary-staff-distance', choices: { ep1_gate: 'matteo_direct', ep1_kitchen: 'elio_boundary', ep1_hotel_crisis: 'hotel_staff', ep1_leo_choice: 'leo_distance' } }
];
const routes = process.env.STAGE8_ROUTES_JSON ? JSON.parse(process.env.STAGE8_ROUTES_JSON) : defaultRoutes;
const targetAssets = new Set(process.env.STAGE8_TARGET_ASSETS_JSON
  ? JSON.parse(process.env.STAGE8_TARGET_ASSETS_JSON)
  : ['ep1-lobby-cg', 'ep1-matteo-office-cg', 'ep1-staff-laundry-cg']);
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();

function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function relative(file) { return path.relative(root, file).split(path.sep).join('/'); }
function expectedFormat(viewport) { return viewport.width / viewport.height >= 1.15 ? 'landscape' : 'portrait'; }
async function readState(page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? 'null'), saveKey); }
async function waitRuntimeReady(page) {
  await page.waitForFunction(key => {
    const state = JSON.parse(localStorage.getItem(key) ?? 'null');
    const image = document.querySelector('.scene-art img');
    return state?.cursor?.sceneId && image?.dataset.sceneId === state.cursor.sceneId && image.complete && image.naturalWidth > 0
      && [...image.getAnimations()].every(animation => animation.playState === 'finished');
  }, saveKey, { timeout: 15000 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForTimeout(450);
}
async function readRuntime(page, viewport) {
  return page.evaluate(({ key, expected }) => {
    const save = JSON.parse(localStorage.getItem(key) ?? 'null');
    const image = document.querySelector('.scene-art img');
    return {
      sceneId: save?.cursor?.sceneId ?? null,
      dialogueIndex: save?.cursor?.dialogueIndex ?? null,
      assetId: image?.dataset.assetId ?? null,
      assetFormat: image?.dataset.assetFormat ?? null,
      assetRequestedFormat: image?.dataset.assetRequestedFormat ?? null,
      assetSrc: image?.dataset.assetSrc ?? null,
      naturalWidth: image?.naturalWidth ?? 0,
      naturalHeight: image?.naturalHeight ?? 0,
      objectPosition: image ? getComputedStyle(image).objectPosition : null,
      artBounds: document.querySelector('.scene-art')?.getBoundingClientRect().toJSON() ?? null,
      choicesVisible: Boolean(document.querySelector('.choices') && !document.querySelector('.choices').hidden),
      expectedFormat: expected
    };
  }, { key: saveKey, expected: expectedFormat(viewport) });
}
async function waitForCursorChange(page, before) {
  await page.waitForFunction(({ key, sceneId, dialogueIndex }) => {
    const state = JSON.parse(localStorage.getItem(key) ?? 'null');
    return state?.cursor && (state.cursor.sceneId !== sceneId || state.cursor.dialogueIndex !== dialogueIndex);
  }, { key: saveKey, sceneId: before.cursor.sceneId, dialogueIndex: before.cursor.dialogueIndex }, { timeout: 15000 });
  const after = await readState(page);
  if (after.cursor.sceneId !== before.cursor.sceneId) await waitRuntimeReady(page);
  else await page.waitForTimeout(30);
}
async function advance(page, before) {
  await page.locator('.reader-stage').focus();
  await page.keyboard.press('ArrowRight');
  await waitForCursorChange(page, before);
}
async function capture(page, viewport, captures, keySet, errors, routeId) {
  const state = await readRuntime(page, viewport);
  if (!targetAssets.has(state.assetId)) return state;
  const key = `${viewport.width}x${viewport.height}/${state.assetId}`;
  if (!keySet.has(key)) {
    const file = path.join(screenshotRoot, `${viewport.width}x${viewport.height}`, `${state.assetId}.png`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await page.screenshot({ path: file, fullPage: true });
    captures.push({ route: routeId, viewport, ...state, screenshot: relative(file), screenshotSha256: sha256(file), screenshotBytes: fs.statSync(file).size });
    keySet.add(key);
    console.log(`CAPTURE ${key} scene=${state.sceneId} position=${state.objectPosition}`);
  }
  return state;
}

const output = { schemaVersion: 1, status: 'RUNNING', sourceHead, baseUrl, viewports, targetAssets: [...targetAssets], captures: [], routes: [], consoleErrors: [], requestFailures: [], httpErrors: [] };
const capturedKeys = new Set();
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
      await page.goto(`${baseUrl}?lang=ru&stage8.3=${viewport.width}-${viewport.height}-${route.id}`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(key => localStorage.removeItem(key), saveKey);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: 'Начать историю' }).click();
      await page.locator('.episode-intro').click();
      await waitRuntimeReady(page);
      const seenScenes = [];
      for (let guard = 0; guard < 220; guard += 1) {
        const state = await capture(page, viewport, output.captures, capturedKeys, consoleErrors, route.id);
        if (!state.sceneId) throw new Error(`Missing scene at ${viewport.width}x${viewport.height}/${route.id}`);
        if (!seenScenes.includes(state.sceneId)) seenScenes.push(state.sceneId);
        if (state.sceneId === 'ep1_hook') break;
        const before = await readState(page);
        if (state.choicesVisible) {
          const choiceId = route.choices[state.sceneId];
          if (!choiceId) throw new Error(`No choice for ${state.sceneId} in ${route.id}`);
          await page.locator(`[data-choice-id="${choiceId}"]`).click();
          await waitForCursorChange(page, before);
        } else {
          await advance(page, before);
        }
      }
      output.routes.push({ route: route.id, viewport, sceneIds: seenScenes, consoleErrors, requestFailures, httpErrors });
      output.consoleErrors.push(...consoleErrors.map(error => ({ route: route.id, viewport, error })));
      output.requestFailures.push(...requestFailures.map(error => ({ route: route.id, viewport, ...error })));
      output.httpErrors.push(...httpErrors.map(error => ({ route: route.id, viewport, ...error })));
      await context.close();
    }
  }
  output.coverage = { required: [...viewports].flatMap(viewport => [...targetAssets].map(assetId => `${viewport.width}x${viewport.height}/${assetId}`)), captured: [...capturedKeys], missing: [...viewports].flatMap(viewport => [...targetAssets].map(assetId => `${viewport.width}x${viewport.height}/${assetId}`)).filter(key => !capturedKeys.has(key)) };
  output.status = output.coverage.missing.length === 0 && output.consoleErrors.length === 0 && output.requestFailures.length === 0 && output.httpErrors.length === 0 ? 'PASS_STAGE8_3_TARGETED_RUNTIME_QA' : 'FAIL_STAGE8_3_TARGETED_RUNTIME_QA';
} finally {
  await browser.close();
}
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ status: output.status, captures: output.captures.length, missing: output.coverage?.missing ?? [], consoleErrors: output.consoleErrors.length, requestFailures: output.requestFailures.length, httpErrors: output.httpErrors.length, output: relative(outputPath) }, null, 2));
if (output.status !== 'PASS_STAGE8_3_TARGETED_RUNTIME_QA') process.exitCode = 1;
