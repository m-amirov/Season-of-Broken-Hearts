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
const viewports = process.env.STAGE9_VIEWPORTS_JSON ? JSON.parse(process.env.STAGE9_VIEWPORTS_JSON) : [
  { width: 1920, height: 1080 }, { width: 1920, height: 900 }, { width: 1600, height: 900 },
  { width: 390, height: 844 }, { width: 360, height: 640 }, { width: 430, height: 932 }
];
const routes = [
  { id: 'audit-professional', targetScene: 'ep2_bianca_professional_response', targetAsset: 'ep2-bianca-professional-response-cg', choices: {
    ep1_gate:'matteo_formal', ep1_kitchen:'elio_humor', ep1_hotel_crisis:'hotel_numbers', ep1_leo_choice:'leo_hear',
    ep2_wedding_budget:'ep2_budget_open', ep2_family_rehearsal:'ep2_giulia_family_plan', ep2_fake_terms:'ep2_terms_public', ep2_bianca_arrives:'ep2_bianca_professional'
  }},
  { id: 'audit-pushback', targetScene: 'ep2_bianca_pushback_response', targetAsset: 'ep2-bianca-pushback-response-cg', choices: {
    ep1_gate:'matteo_direct', ep1_kitchen:'elio_boundary', ep1_hotel_crisis:'hotel_staff', ep1_leo_choice:'leo_distance',
    ep2_wedding_budget:'ep2_budget_open', ep2_family_rehearsal:'ep2_giulia_family_plan', ep2_fake_terms:'ep2_terms_public', ep2_refusal_workday:'ep2_refusal_help_giulia', ep2_bianca_arrives:'ep2_bianca_pushback'
  }}
];
const outputPath = path.resolve(process.env.STAGE9_OUTPUT_FILE ?? 'artifacts/evidence/stage9.4-ep2-audit-runtime.json');
const screenshotRoot = path.resolve(process.env.STAGE9_SCREENSHOT_ROOT ?? 'artifacts/evidence/stage9.4-ep2-audit-runtime');
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const relative = file => path.relative(root, file).split(path.sep).join('/');
const expectedFormat = viewport => viewport.width / viewport.height >= 1.15 ? 'landscape' : 'portrait';
const readState = page => page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? 'null'), saveKey);
const readRuntime = (page, viewport) => page.evaluate(({ key, expected }) => {
  const save = JSON.parse(localStorage.getItem(key) ?? 'null');
  const image = document.querySelector('.scene-art img');
  const art = document.querySelector('.scene-art');
  const rect = art?.getBoundingClientRect();
  return { sceneId: save?.cursor?.sceneId ?? null, dialogueIndex: save?.cursor?.dialogueIndex ?? null,
    assetId: image?.dataset.assetId ?? null, assetFormat: image?.dataset.assetFormat ?? null,
    assetRequestedFormat: image?.dataset.assetRequestedFormat ?? null, assetSrc: image?.dataset.assetSrc ?? null,
    naturalWidth: image?.naturalWidth ?? 0, naturalHeight: image?.naturalHeight ?? 0,
    artBounds: rect ? { width: Math.round(rect.width), height: Math.round(rect.height) } : null,
    expectedFormat: expected, noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
    noVerticalOverflow: document.documentElement.scrollHeight <= window.innerHeight, language: document.documentElement.lang };
}, { key: saveKey, expected: expectedFormat(viewport) });
async function waitRuntimeReady(page) {
  try {
    await page.waitForFunction(key => { const state = JSON.parse(localStorage.getItem(key) ?? 'null'); const image = document.querySelector('.scene-art img');
      return state?.cursor?.sceneId && image?.dataset.sceneId === state.cursor.sceneId && image.complete && image.naturalWidth > 0
        && document.querySelector('.episode-intro')?.hidden === true;
    }, saveKey, { timeout: 15000 });
  } catch (error) {
    const diagnostics = await page.evaluate(key => {
      const state = JSON.parse(localStorage.getItem(key) ?? 'null');
      const image = document.querySelector('.scene-art img');
      return { cursor: state?.cursor ?? null, imageScene: image?.dataset.sceneId ?? null, src: image?.dataset.assetSrc ?? null,
        complete: image?.complete ?? false, naturalWidth: image?.naturalWidth ?? 0, introHidden: document.querySelector('.episode-intro')?.hidden ?? null,
        animations: image ? [...image.getAnimations()].map(animation => ({ playState: animation.playState, currentTime: animation.currentTime })) : [] };
    }, saveKey);
    throw new Error(`Runtime image was not ready: ${JSON.stringify(diagnostics)}: ${error.message}`);
  }
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); await page.waitForTimeout(450);
}
async function waitForCursorChange(page, before) {
  try {
    await page.waitForFunction(({ key, sceneId, dialogueIndex }) => { const state = JSON.parse(localStorage.getItem(key) ?? 'null');
      return state?.cursor && (state.cursor.sceneId !== sceneId || state.cursor.dialogueIndex !== dialogueIndex);
    }, { key: saveKey, sceneId: before.cursor.sceneId, dialogueIndex: before.cursor.dialogueIndex }, { timeout: 15000 });
  } catch (error) {
    const after = await readState(page);
    const diagnostics = await page.evaluate(() => ({
      sceneId: document.querySelector('.scene-art img')?.dataset.sceneId ?? null,
      imageComplete: document.querySelector('.scene-art img')?.complete ?? false,
      naturalWidth: document.querySelector('.scene-art img')?.naturalWidth ?? 0,
      introHidden: document.querySelector('.episode-intro')?.hidden ?? null,
      choiceCount: document.querySelectorAll('.choices .choice-button').length
    }));
    throw new Error(`Cursor did not change from ${JSON.stringify(before.cursor)}; after=${JSON.stringify(after?.cursor ?? null)} diagnostics=${JSON.stringify(diagnostics)}: ${error.message}`);
  }
  const after = await readState(page); if (after.cursor.sceneId !== before.cursor.sceneId) await waitRuntimeReady(page);
}
async function startFresh(page, suffix) {
  await page.goto(`${baseUrl}?lang=ru&stage9-4-audit=${suffix}`, { waitUntil: 'networkidle' });
  await page.evaluate(key => localStorage.removeItem(key), saveKey); await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Начать историю' }).click(); await page.locator('.episode-intro').waitFor({ state: 'visible' });
  await page.locator('.episode-intro').click(); await waitRuntimeReady(page);
}
const output = { schemaVersion: 1, status: 'RUNNING', sourceHead, baseUrl, viewports, routes: [], captures: [],
  transitionChecks: {}, consoleErrors: [], requestFailures: [], httpErrors: [], targetScenes: routes.map(route => route.targetScene) };
const browser = await chromium.launch({ headless: true, executablePath: chromePath });
try {
  for (const viewport of viewports) for (const route of routes) {
    const context = await browser.newContext({ viewport }); const page = await context.newPage(); page.setDefaultTimeout(15000); page.setDefaultNavigationTimeout(15000);
    const consoleErrors = [], requestFailures = [], httpErrors = [];
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('requestfailed', request => requestFailures.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' }));
    page.on('response', response => { if (response.status() >= 400) httpErrors.push({ url: response.url(), status: response.status() }); });
    await startFresh(page, `${viewport.width}-${viewport.height}-${route.id}`); const seenScenes = [];
    let captured = false;
    for (let guard = 0; guard < 280; guard += 1) {
      const state = await readRuntime(page, viewport); if (!state.sceneId) throw new Error(`Missing scene state ${route.id}`);
      if (!seenScenes.includes(state.sceneId)) seenScenes.push(state.sceneId);
      if (state.sceneId === route.targetScene) {
        const file = path.join(screenshotRoot, `${viewport.width}x${viewport.height}`, route.id, `${state.sceneId}.png`); fs.mkdirSync(path.dirname(file), { recursive: true }); await page.screenshot({ path: file, fullPage: true });
        output.captures.push({ viewport, route: route.id, sceneId: state.sceneId, assetId: state.assetId, expectedAssetId: route.targetAsset,
          format: state.assetFormat, requestedFormat: state.assetRequestedFormat, source: state.assetSrc, naturalDimensions: `${state.naturalWidth}x${state.naturalHeight}`,
          screenshot: relative(file), screenshotSha256: sha256(file), screenshotBytes: fs.statSync(file).size,
          visualRuntime: { artBounds: state.artBounds, expectedFormat: state.expectedFormat, dialogueSafeScreenshot: true, noHorizontalOverflow: state.noHorizontalOverflow, noVerticalOverflow: state.noVerticalOverflow }, language: state.language });
        captured = true; break;
      }
      const save = await readState(page); const choiceButtons = page.locator('.choices .choice-button');
      if (await choiceButtons.count()) { const choiceId = route.choices[state.sceneId]; if (!choiceId) throw new Error(`No choice mapping for ${state.sceneId}/${route.id}`); const before = await readState(page); await page.locator(`[data-choice-id="${choiceId}"]`).click(); await waitForCursorChange(page, before); }
      else { await page.keyboard.press('ArrowRight'); await waitForCursorChange(page, save); }
    }
    if (!captured) throw new Error(`Target ${route.targetScene} not reached in ${route.id}`);
    output.routes.push({ route: route.id, viewport, sceneIds: seenScenes, targetScene: route.targetScene, consoleErrors, requestFailures, httpErrors });
    output.consoleErrors.push(...consoleErrors.map(error => ({ viewport, route: route.id, error }))); output.requestFailures.push(...requestFailures.map(error => ({ viewport, route: route.id, ...error }))); output.httpErrors.push(...httpErrors.map(error => ({ viewport, route: route.id, ...error })));
    await context.close();
  }
  const transitionContext = await browser.newContext({ viewport: { width: 390, height: 844 } }); const page = await transitionContext.newPage(); await startFresh(page, 'transitions');
  const before = await readState(page); await page.locator('.reader-stage').click({ position: { x: 5, y: 5 } }); await waitForCursorChange(page, before); const advanced = await readState(page);
  await page.getByRole('button', { name: 'Назад' }).click(); await waitRuntimeReady(page); const back = await readState(page);
  await page.getByRole('button', { name: 'Меню' }).click(); await page.getByRole('button', { name: 'Новая игра' }).click(); await page.getByRole('button', { name: 'Начать заново' }).click(); await page.locator('.episode-intro').waitFor({ state: 'visible' }); await page.locator('.episode-intro').click(); await waitRuntimeReady(page); const newGame = await readState(page);
  output.transitionChecks = { back: { before: before.cursor, afterAdvance: advanced.cursor, afterBack: back.cursor, restored: back.cursor.sceneId === before.cursor.sceneId && back.cursor.dialogueIndex === before.cursor.dialogueIndex }, newGame: { cursor: newGame.cursor, resetToStart: newGame.cursor.sceneId === 'ep1_arrival' && newGame.cursor.dialogueIndex === 0 }, locale: await page.evaluate(() => ({ htmlLang: document.documentElement.lang, title: document.title })) }; await transitionContext.close();
  if (output.captures.length !== viewports.length * routes.length) throw new Error(`Screenshot coverage ${output.captures.length}`);
  if (output.consoleErrors.length || output.requestFailures.length || output.httpErrors.length) throw new Error(`Runtime errors console=${output.consoleErrors.length} request=${output.requestFailures.length} http=${output.httpErrors.length}`);
  if (output.captures.some(c => c.assetId !== c.expectedAssetId || c.format !== c.visualRuntime.expectedFormat || !c.visualRuntime.noHorizontalOverflow || !c.visualRuntime.noVerticalOverflow)) throw new Error('Mapping/format/overflow mismatch');
  if (output.captures.some(c => c.language !== 'ru') || !output.transitionChecks.back.restored || !output.transitionChecks.newGame.resetToStart) throw new Error('Locale or Back/New Game check failed');
  output.status = 'PASS_STAGE9_4_AUDIT_RUNTIME_VISUAL_CAPTURE';
} finally { await browser.close(); }
fs.mkdirSync(path.dirname(outputPath), { recursive: true }); fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ status: output.status, sourceHead, output: relative(outputPath), captures: output.captures.length, consoleErrors: output.consoleErrors.length, requestFailures: output.requestFailures.length, httpErrors: output.httpErrors.length, transitionChecks: output.transitionChecks }, null, 2));
