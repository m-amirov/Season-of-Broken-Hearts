import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const baseUrl = process.env.STAGE8_BASE_URL ?? 'http://127.0.0.1:4174/';
const playwrightModule = process.env.STAGE8_PLAYWRIGHT_MODULE;
const chromePath = process.env.STAGE8_CHROME_PATH;
if (!playwrightModule || !chromePath) throw new Error('STAGE8_PLAYWRIGHT_MODULE and STAGE8_CHROME_PATH are required');

const { chromium } = await import(pathToFileURL(playwrightModule).href);
const outputPath = path.resolve(process.env.STAGE8_OUTPUT_FILE ?? 'artifacts/evidence/stage8-dual-format-runtime.json');
const screenshotRoot = path.resolve('artifacts/evidence/stage8-dual-format/runtime');
const saveKey = 'season-of-broken-hearts.save.v1';
const viewports = [
  { width: 1366, height: 768 },
  { width: 1600, height: 900 },
  { width: 1920, height: 900 },
  { width: 1920, height: 1080 },
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 430, height: 932 }
];
const routes = [
  { id: 'formal-humor-numbers-hear', choices: { ep1_gate: 'matteo_formal', ep1_kitchen: 'elio_humor', ep1_hotel_crisis: 'hotel_numbers', ep1_leo_choice: 'leo_hear' } },
  { id: 'direct-boundary-staff-distance', choices: { ep1_gate: 'matteo_direct', ep1_kitchen: 'elio_boundary', ep1_hotel_crisis: 'hotel_staff', ep1_leo_choice: 'leo_distance' } }
];

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function expectedFormat(viewport) {
  return viewport.width / viewport.height >= 1.15 ? 'landscape' : 'portrait';
}

async function waitReady(page) {
  await page.waitForFunction(() => {
    const image = document.querySelector('.scene-art img');
    return image && image.complete && image.naturalWidth > 0
      && [...image.getAnimations()].every(animation => animation.playState === 'finished');
  }, { timeout: 15000 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function waitRuntimeReady(page) {
  await page.waitForFunction(key => {
    const state = JSON.parse(localStorage.getItem(key) ?? 'null');
    const image = document.querySelector('.scene-art img');
    return state?.cursor?.sceneId && image?.dataset.sceneId === state.cursor.sceneId
      && image.complete && image.naturalWidth > 0
      && [...image.getAnimations()].every(animation => animation.playState === 'finished');
  }, saveKey, { timeout: 15000 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForTimeout(450);
}

async function readState(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? 'null'), saveKey);
}

async function readRuntime(page, viewport) {
  return page.evaluate(({ key, expected }) => {
    const save = JSON.parse(localStorage.getItem(key) ?? 'null');
    const image = document.querySelector('.scene-art img');
    const art = document.querySelector('.scene-art');
    return {
      sceneId: save?.cursor?.sceneId ?? null,
      dialogueIndex: save?.cursor?.dialogueIndex ?? null,
      assetId: image?.dataset.assetId ?? null,
      assetFormat: image?.dataset.assetFormat ?? null,
      assetRequestedFormat: image?.dataset.assetRequestedFormat ?? null,
      assetSrc: image?.dataset.assetSrc ?? null,
      naturalWidth: image?.naturalWidth ?? 0,
      naturalHeight: image?.naturalHeight ?? 0,
      artBounds: art ? (() => { const rect = art.getBoundingClientRect(); return { width: Math.round(rect.width), height: Math.round(rect.height) }; })() : null,
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

const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const output = {
  schemaVersion: 1,
  status: 'RUNNING',
  sourceHead,
  baseUrl,
  viewports,
  routes: [],
  captures: [],
  resize: null,
  consoleErrors: [],
  requestFailures: [],
  httpErrors: []
};
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

      await page.goto(`${baseUrl}?lang=ru&stage8-fresh=${viewport.width}-${viewport.height}-${route.id}`, { waitUntil: 'networkidle' });
      await page.evaluate(key => localStorage.removeItem(key), saveKey);
      await page.reload({ waitUntil: 'networkidle' });
      await page.getByRole('button', { name: 'Начать историю' }).click();
      await page.locator('.episode-intro').waitFor({ state: 'visible' });
      await page.locator('.episode-intro').click();
      await waitRuntimeReady(page);

      const seenScenes = [];
      for (let guard = 0; guard < 220; guard += 1) {
        const state = await readRuntime(page, viewport);
        if (!state.sceneId) throw new Error(`Missing scene state at ${viewport.width}x${viewport.height}/${route.id}`);
        if (!seenScenes.includes(state.sceneId)) {
          seenScenes.push(state.sceneId);
          const key = `${viewport.width}x${viewport.height}/${state.assetId}`;
          if (!capturedKeys.has(key)) {
            const file = path.join(screenshotRoot, `${viewport.width}x${viewport.height}`, `${state.assetId}.png`);
            fs.mkdirSync(path.dirname(file), { recursive: true });
            await page.screenshot({ path: file, fullPage: true });
            output.captures.push({
              viewport,
              sceneId: state.sceneId,
              assetId: state.assetId,
              format: state.assetFormat,
              source: state.assetSrc,
              naturalDimensions: `${state.naturalWidth}x${state.naturalHeight}`,
              screenshot: relative(file),
              screenshotSha256: sha256(file),
              screenshotBytes: fs.statSync(file).size,
              visualRuntime: { artBounds: state.artBounds, dialogueSafeScreenshot: true }
            });
            capturedKeys.add(key);
          }
        }
        if (state.assetFormat !== state.expectedFormat) {
          throw new Error(`Wrong runtime format at ${state.sceneId}/${viewport.width}x${viewport.height}: ${state.assetFormat} != ${state.expectedFormat}`);
        }
        if (state.expectedFormat === 'portrait' && `${state.naturalWidth}x${state.naturalHeight}` !== '1024x1536') {
          throw new Error(`Unexpected portrait dimensions at ${state.sceneId}: ${state.naturalWidth}x${state.naturalHeight}`);
        }
        if (state.expectedFormat === 'landscape' && `${state.naturalWidth}x${state.naturalHeight}` !== '1672x941') {
          throw new Error(`Unexpected landscape dimensions at ${state.sceneId}: ${state.naturalWidth}x${state.naturalHeight}`);
        }
        if (state.sceneId === 'ep1_hook') break;

        if (state.choicesVisible) {
          const choiceId = route.choices[state.sceneId];
          if (!choiceId) throw new Error(`No choice mapping for ${state.sceneId} in ${route.id}`);
          const before = await readState(page);
          await page.locator(`[data-choice-id="${choiceId}"]`).click();
          await waitForCursorChange(page, before);
        } else {
          await advance(page, await readState(page));
        }
      }
      output.routes.push({ route: route.id, viewport, sceneIds: seenScenes, sceneCount: seenScenes.length, consoleErrors, requestFailures, httpErrors });
      output.consoleErrors.push(...consoleErrors.map(error => ({ viewport, route: route.id, error })));
      output.requestFailures.push(...requestFailures.map(error => ({ viewport, route: route.id, ...error })));
      output.httpErrors.push(...httpErrors.map(error => ({ viewport, route: route.id, ...error })));
      await context.close();
    }
  }

  const resizeContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const resizePage = await resizeContext.newPage();
  const resizeErrors = [];
  resizePage.on('console', message => { if (message.type() === 'error') resizeErrors.push(message.text()); });
  await resizePage.goto(`${baseUrl}?lang=ru&stage8-resize`, { waitUntil: 'networkidle' });
  await resizePage.evaluate(key => localStorage.removeItem(key), saveKey);
  await resizePage.reload({ waitUntil: 'networkidle' });
  await resizePage.getByRole('button', { name: 'Начать историю' }).click();
  await resizePage.locator('.episode-intro').click();
  await waitRuntimeReady(resizePage);
  const portrait = await readRuntime(resizePage, { width: 390, height: 844 });
  await resizePage.setViewportSize({ width: 1920, height: 1080 });
  await resizePage.waitForFunction(() => document.querySelector('.scene-art img')?.dataset.assetFormat === 'landscape', { timeout: 15000 });
  await waitRuntimeReady(resizePage);
  const landscape = await readRuntime(resizePage, { width: 1920, height: 1080 });
  await resizePage.setViewportSize({ width: 360, height: 640 });
  await resizePage.waitForFunction(() => document.querySelector('.scene-art img')?.dataset.assetFormat === 'portrait', { timeout: 15000 });
  await waitRuntimeReady(resizePage);
  const portraitAgain = await readRuntime(resizePage, { width: 360, height: 640 });
  output.resize = { portrait, landscape, portraitAgain, consoleErrors: resizeErrors };
  await resizeContext.close();

  const covered = new Set(output.routes.flatMap(route => route.sceneIds));
  output.coverage = {
    sceneCount: covered.size,
    expectedSceneCount: 18,
    portraitCaptures: output.captures.filter(capture => capture.format === 'portrait').length,
    landscapeCaptures: output.captures.filter(capture => capture.format === 'landscape').length,
    uniquePortraitAssets: new Set(output.captures.filter(capture => capture.format === 'portrait').map(capture => capture.assetId)).size,
    uniqueLandscapeAssets: new Set(output.captures.filter(capture => capture.format === 'landscape').map(capture => capture.assetId)).size
  };
  if (output.coverage.sceneCount !== 18) throw new Error(`Scene coverage ${output.coverage.sceneCount}/18`);
  if (output.coverage.uniquePortraitAssets !== 10 || output.coverage.uniqueLandscapeAssets !== 10) {
    throw new Error(`Asset family coverage ${output.coverage.uniquePortraitAssets} portrait / ${output.coverage.uniqueLandscapeAssets} landscape`);
  }
  if (output.consoleErrors.length || output.requestFailures.length || output.httpErrors.length || output.resize.consoleErrors.length) {
    throw new Error(`Runtime errors: console=${output.consoleErrors.length}, request=${output.requestFailures.length}, http=${output.httpErrors.length}, resizeConsole=${output.resize.consoleErrors.length}`);
  }
  if (output.resize.portrait.assetFormat !== 'portrait' || output.resize.landscape.assetFormat !== 'landscape' || output.resize.portraitAgain.assetFormat !== 'portrait') {
    throw new Error(`Resize format sequence failed: ${JSON.stringify(output.resize)}`);
  }
  output.status = 'PASS_STAGE8_DUAL_FORMAT_RUNTIME_QA';
} finally {
  await browser.close();
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({
  status: output.status,
  sourceHead,
  output: relative(outputPath),
  coverage: output.coverage,
  captures: output.captures.length,
  consoleErrors: output.consoleErrors.length,
  requestFailures: output.requestFailures.length,
  httpErrors: output.httpErrors.length
}, null, 2));
