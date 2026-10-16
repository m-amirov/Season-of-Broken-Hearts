import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const root = process.cwd();
const baseUrl = process.env.STAGE9_S22S23_BASE_URL ?? 'http://127.0.0.1:4173/';
const outputPath = path.resolve(process.env.STAGE9_S22S23_OUTPUT ?? 'artifacts/production-art/stage9.4/runtime/STAGE9_4_S22_S23_RUNTIME_PIXEL_QA_20261016.json');
const screenshotRoot = path.resolve(process.env.STAGE9_S22S23_SCREENSHOTS ?? 'artifacts/production-art/stage9.4/runtime/screenshots');
const saveKey = 'season-of-broken-hearts.save.v1';
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const initialState = {
  route: 'none', trustMatteo: 0, trustLeo: 0, trustElio: 0, relationshipMatteo: 0, relationshipLeo: 0,
  relationshipElio: 0, staffTrust: 0, fundingEvidence: 0, investorTerms: 'unknown', hotelEvidence: 'none',
  matteoApproach: 'none', elioApproach: 'none', leoConversation: 'none', metMatteo: false, metElio: false,
  metLeo: false, leoTruthHeard: false, elioKitchen: false, askedAboutHotel: false, lastChoice: 'none',
  routeLocked: false, fakeDatingStatus: 'none', fakeDatingTermsKnown: false, biancaRoleKnown: false,
  biancaTrust: 'unknown', publicAgreement: 'unknown', consentBoundary: 'unknown', ep2BudgetChoice: 'none',
  matteoFutureTalk: 'none', leoAureaLinkKnown: false, leoAccountability: 'none', leoEvidence: 'none',
  ep3SurveyChoice: 'none', matteoPublicGesture: 'none', ep3SurveyAction: 'none'
};
const viewports = [
  { id: 'desktop', width: 1366, height: 768 },
  { id: 'mobile', width: 390, height: 844 }
];

function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function relative(file) { return path.relative(root, file).split(path.sep).join('/'); }
function expectedFormat(viewport) { return viewport.width / viewport.height >= 1.15 ? 'landscape' : 'portrait'; }
function saveFor(sceneId) {
  return JSON.stringify({
    schemaVersion: 4, locale: 'ru', cursor: { sceneId, dialogueIndex: 0 }, state: { ...initialState }, history: [],
    readerProgress: { seenEpisodes: [2], tutorialAdvances: 2 }
  });
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
      expectedFormat: expected,
      noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
      noVerticalOverflow: document.documentElement.scrollHeight <= window.innerHeight,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      language: document.documentElement.lang
    };
  }, { key: saveKey, expected: expectedFormat(viewport) });
}

async function waitReady(page, targetScene) {
  await page.waitForFunction(({ key, target }) => {
    const save = JSON.parse(localStorage.getItem(key) ?? 'null');
    const image = document.querySelector('.scene-art img');
    return save?.cursor?.sceneId === target && image?.dataset.sceneId === target && image.complete && image.naturalWidth > 0
      && document.querySelector('.episode-intro')?.hidden === true
      && [...image.getAnimations()].every(animation => animation.playState === 'finished');
  }, { key: saveKey, target: targetScene }, { timeout: 15000 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForTimeout(450);
}

async function waitCursorChange(page, before) {
  await page.waitForFunction(({ key, sceneId, dialogueIndex }) => {
    const save = JSON.parse(localStorage.getItem(key) ?? 'null');
    return save?.cursor && (save.cursor.sceneId !== sceneId || save.cursor.dialogueIndex !== dialogueIndex);
  }, { key: saveKey, sceneId: before.sceneId, dialogueIndex: before.dialogueIndex }, { timeout: 15000 });
}

async function launchAt(page, sceneId) {
  await page.goto(`${baseUrl}?lang=ru&stage9-4-s22-s23=${sceneId}`, { waitUntil: 'networkidle' });
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: saveKey, value: saveFor(sceneId) });
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find(item => /Продолжить|Resume/i.test(item.textContent ?? ''));
    if (!button) throw new Error('Resume button not found after injecting a valid scene save');
    button.click();
  });
  await waitReady(page, sceneId);
}

async function capture(page, viewport, sceneId, tag, captures) {
  const state = await readRuntime(page, viewport);
  if (state.sceneId !== sceneId) throw new Error(`Expected ${sceneId}, got ${state.sceneId}`);
  const file = path.join(screenshotRoot, viewport.id, `${tag}.png`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, fullPage: true });
  captures.push({ sceneId, tag, ...state, screenshot: relative(file), screenshotSha256: sha256(file), screenshotBytes: fs.statSync(file).size });
}

const output = { schemaVersion: 1, status: 'RUNNING', sourceHead, baseUrl, viewports, captures: [], transitions: [], consoleErrors: [], requestFailures: [], httpErrors: [] };
const browser = await chromium.launch({ headless: true, executablePath: process.env.STAGE9_S22S23_CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(15000);
    page.on('console', message => { if (message.type() === 'error') output.consoleErrors.push({ viewport: viewport.id, error: message.text() }); });
    page.on('requestfailed', request => output.requestFailures.push({ viewport: viewport.id, url: request.url(), error: request.failure()?.errorText ?? 'unknown' }));
    page.on('response', response => { if (response.status() >= 400) output.httpErrors.push({ viewport: viewport.id, url: response.url(), status: response.status() }); });

    await launchAt(page, 'ep2_family_rehearsal');
    await capture(page, viewport, 'ep2_family_rehearsal', 'S22', output.captures);
    for (let guard = 0; guard < 20 && !(await page.locator('.choices .choice-button').count()); guard += 1) {
      const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);
      await page.locator('.reader-stage').click({ position: { x: 5, y: 5 } });
      await waitCursorChange(page, before);
    }
    await page.locator('[data-choice-id="ep2_giulia_personal_plan"]').click();
    await waitReady(page, 'ep2_family_rehearsal_response');
    await capture(page, viewport, 'ep2_family_rehearsal_response', 'S23', output.captures);
    output.transitions.push({ viewport: viewport.id, from: 'ep2_family_rehearsal', choice: 'ep2_giulia_personal_plan', to: 'ep2_family_rehearsal_response', passed: true });
    await context.close();
  }
  const required = viewports.flatMap(viewport => ['S22', 'S23'].map(tag => `${viewport.id}/${tag}`));
  const captured = output.captures.map(capture => `${viewports.find(viewport => viewport.width === capture.viewport.width && viewport.height === capture.viewport.height)?.id}/${capture.tag}`);
  output.coverage = { required, captured, missing: required.filter(key => !captured.includes(key)) };
  output.status = output.coverage.missing.length === 0 && output.consoleErrors.length === 0 && output.requestFailures.length === 0 && output.httpErrors.length === 0
    && output.captures.every(capture => capture.naturalWidth > 0 && capture.naturalHeight > 0 && capture.assetFormat === capture.expectedFormat && capture.noHorizontalOverflow && capture.noVerticalOverflow && capture.language === 'ru')
    ? 'PASS_STAGE9_4_S22_S23_RUNTIME_PIXEL_QA' : 'FAIL_STAGE9_4_S22_S23_RUNTIME_PIXEL_QA';
} finally {
  await browser.close();
}
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ status: output.status, sourceHead, captures: output.captures.length, missing: output.coverage?.missing ?? [], consoleErrors: output.consoleErrors.length, requestFailures: output.requestFailures.length, httpErrors: output.httpErrors.length, output: relative(outputPath) }, null, 2));
if (output.status !== 'PASS_STAGE9_4_S22_S23_RUNTIME_PIXEL_QA') process.exitCode = 1;
