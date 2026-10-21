import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('C:/Users/user/AppData/Local/npm-cache/_npx/257a462f87570f9c/node_modules/playwright');
const root = process.cwd();
const baseUrl = 'http://127.0.0.1:4301/';
const outputPath = path.resolve('artifacts/evidence/web-high-control/EP3_ACCOUNTABILITY_CHOICE_RUNTIME_QA_CURRENT_HEAD_20261021.json');
const screenshotRoot = path.resolve('output/playwright/ep3-accountability-choice-runtime');
const saveKey = 'season-of-broken-hearts.save.v1';
const sceneId = 'ep3_accountability_choice';
const assetId = 'ep3-accountability-choice-cg';
const graph = JSON.parse(fs.readFileSync(path.join(root, 'narrative/graph.json'), 'utf8'));
const state = { ...graph.initialState, metLeo: true, ep3SurveyChoice: 'declined', ep3SurveyAction: 'hold' };
const viewports = [
  { id: 'desktop', width: 1280, height: 720 },
  { id: 'mobile-390', width: 390, height: 844 },
  { id: 'mobile-360', width: 360, height: 640 }
];
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const relative = file => path.relative(root, file).split(path.sep).join('/');
const save = JSON.stringify({ schemaVersion: 4, locale: 'ru', cursor: { sceneId, dialogueIndex: 0 }, state, history: [], readerProgress: { seenEpisodes: [3], tutorialAdvances: 2 } });

async function waitReady(page) {
  await page.waitForFunction(({ key, target }) => {
    const current = JSON.parse(localStorage.getItem(key) ?? 'null');
    const image = document.querySelector('.scene-art img');
    return current?.cursor?.sceneId === target && image?.dataset.sceneId === target && image.complete && image.naturalWidth > 0
      && document.querySelector('.episode-intro')?.hidden === true
      && [...image.getAnimations()].every(animation => animation.playState === 'finished');
  }, { key: saveKey, target: sceneId }, { timeout: 15000 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForTimeout(450);
}

const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const output = { schemaVersion: 1, status: 'RUNNING', sourceHead, baseUrl, sceneId, assetId, viewports, captures: [], consoleErrors: [], requestFailures: [], httpErrors: [] };
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(15000);
    page.on('console', message => { if (message.type() === 'error') output.consoleErrors.push({ viewport: viewport.id, error: message.text() }); });
    page.on('requestfailed', request => output.requestFailures.push({ viewport: viewport.id, url: request.url(), error: request.failure()?.errorText ?? 'unknown' }));
    page.on('response', response => { if (response.status() >= 400) output.httpErrors.push({ viewport: viewport.id, url: response.url(), status: response.status() }); });
    await page.goto(`${baseUrl}?lang=ru&stage9-4-s22-s23=${sceneId}`, { waitUntil: 'networkidle' });
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: saveKey, value: save });
    await page.reload({ waitUntil: 'networkidle' });
    const resume = page.getByRole('button', { name: /Продолжить|Resume/i });
    if (await resume.count()) await resume.first().click();
    await waitReady(page);
    const runtime = await page.evaluate(({ key, expectedAsset }) => {
      const current = JSON.parse(localStorage.getItem(key) ?? 'null');
      const image = document.querySelector('.scene-art img');
      return {
        sceneId: current?.cursor?.sceneId ?? null,
        dialogueIndex: current?.cursor?.dialogueIndex ?? null,
        imageSceneId: image?.dataset.sceneId ?? null,
        assetId: image?.dataset.assetId ?? null,
        expectedAsset,
        assetFormat: image?.dataset.assetFormat ?? null,
        naturalWidth: image?.naturalWidth ?? 0,
        naturalHeight: image?.naturalHeight ?? 0,
        noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
        noVerticalOverflow: document.documentElement.scrollHeight <= window.innerHeight,
        language: document.documentElement.lang,
        dialogueText: document.querySelector('.dialogue-text')?.textContent ?? ''
      };
    }, { key: saveKey, expectedAsset: assetId });
    const file = path.join(screenshotRoot, viewport.id + '.png');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await page.screenshot({ path: file, fullPage: true });
    output.captures.push({ viewport: { width: viewport.width, height: viewport.height }, ...runtime, screenshot: relative(file), screenshotSha256: sha256(file), screenshotBytes: fs.statSync(file).size });
    await context.close();
  }
  output.status = output.captures.length === viewports.length && output.consoleErrors.length === 0 && output.requestFailures.length === 0 && output.httpErrors.length === 0
    && output.captures.every(capture => capture.sceneId === sceneId && capture.imageSceneId === sceneId && capture.assetId === capture.expectedAsset && capture.naturalWidth > 0 && capture.naturalHeight > 0 && capture.noHorizontalOverflow && capture.noVerticalOverflow && capture.language === 'ru')
    ? 'PASS_EP3_ACCOUNTABILITY_CHOICE_RUNTIME_PIXEL_QA' : 'FAIL_EP3_ACCOUNTABILITY_CHOICE_RUNTIME_PIXEL_QA';
} finally {
  await browser.close();
}
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ status: output.status, sourceHead, captures: output.captures.length, consoleErrors: output.consoleErrors.length, requestFailures: output.requestFailures.length, httpErrors: output.httpErrors.length, output: relative(outputPath) }, null, 2));
if (output.status !== 'PASS_EP3_ACCOUNTABILITY_CHOICE_RUNTIME_PIXEL_QA') process.exitCode = 1;
