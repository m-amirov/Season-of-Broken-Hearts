import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('C:/Users/user/AppData/Local/npm-cache/_npx/257a462f87570f9c/node_modules/playwright');
const root = process.cwd();
const baseUrl = process.env.EP3_COMPLETION_BATCH_BASE_URL ?? 'http://127.0.0.1:4301/';
const outputPath = path.resolve(process.env.EP3_COMPLETION_BATCH_OUTPUT ?? 'artifacts/evidence/web-high-control/EP3_COMPLETION_BATCH_RUNTIME_QA_CURRENT_HEAD_20261021.json');
const screenshotRoot = path.resolve(process.env.EP3_COMPLETION_BATCH_SCREENSHOTS ?? 'output/playwright/ep3-completion-batch-runtime');
const saveKey = 'season-of-broken-hearts.save.v1';
const sceneIds = ['ep3_quiet_return', 'ep3_transition'];
const assetIds = {
  ep3_quiet_return: 'ep3-quiet-return-cg',
  ep3_transition: 'ep3-transition-cg'
};
const graph = JSON.parse(fs.readFileSync(path.join(root, 'narrative/graph.json'), 'utf8'));
const state = { ...graph.initialState, metLeo: true, ep3SurveyChoice: 'declined', ep3SurveyAction: 'hold', leoEvidence: 'drawing' };
const viewports = [
  { id: 'desktop', width: 1280, height: 720 },
  { id: 'mobile-390', width: 390, height: 844 },
  { id: 'mobile-360', width: 360, height: 640 }
];
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const relative = file => path.relative(root, file).split(path.sep).join('/');
const saveFor = sceneId => JSON.stringify({ schemaVersion: 4, locale: 'ru', cursor: { sceneId, dialogueIndex: 0 }, state, history: [], readerProgress: { seenEpisodes: [3], tutorialAdvances: 2 } });

async function waitReady(page, sceneId) {
  try {
    await page.waitForFunction(({ key, target }) => {
      const save = JSON.parse(localStorage.getItem(key) ?? 'null');
      const image = document.querySelector('.scene-art img');
      return save?.cursor?.sceneId === target && image?.dataset.sceneId === target && image.complete && image.naturalWidth > 0
        && document.querySelector('.episode-intro')?.hidden === true
        && [...image.getAnimations()].every(animation => animation.playState === 'finished');
    }, { key: saveKey, target: sceneId }, { timeout: 15000 });
  } catch (error) {
    const diagnostic = await page.evaluate(key => {
      const image = document.querySelector('.scene-art img');
      return {
        save: JSON.parse(localStorage.getItem(key) ?? 'null'),
        image: image ? { src: image.currentSrc, sceneId: image.dataset.sceneId, assetId: image.dataset.assetId, complete: image.complete, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight } : null,
        episodeIntroHidden: document.querySelector('.episode-intro')?.hidden ?? null,
        bodyText: document.body.innerText.slice(0, 500)
      };
    }, saveKey);
    throw new Error(`Runtime did not settle for ${sceneId}: ${JSON.stringify({ ...diagnostic, consoleErrors: output.consoleErrors, requestFailures: output.requestFailures, httpErrors: output.httpErrors })}`, { cause: error });
  }
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForTimeout(450);
}

async function launchAt(page, sceneId) {
  await page.goto(`${baseUrl}?lang=ru&ep3-completion-batch=${sceneId}`, { waitUntil: 'networkidle' });
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: saveKey, value: saveFor(sceneId) });
  await page.reload({ waitUntil: 'networkidle' });
  const resume = page.getByRole('button', { name: /Продолжить|Resume/i });
  if (await resume.count()) await resume.first().click();
  await waitReady(page, sceneId);
}

const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const output = { schemaVersion: 1, status: 'RUNNING', sourceHead, baseUrl, sceneIds, viewports, captures: [], consoleErrors: [], requestFailures: [], httpErrors: [] };
const browser = await chromium.launch({ headless: true, executablePath: process.env.EP3_COMPLETION_BATCH_CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
try {
  for (const sceneId of sceneIds) {
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      page.setDefaultNavigationTimeout(15000);
      page.on('console', message => { if (message.type() === 'error') output.consoleErrors.push({ sceneId, viewport: viewport.id, error: message.text() }); });
      page.on('requestfailed', request => output.requestFailures.push({ sceneId, viewport: viewport.id, url: request.url(), error: request.failure()?.errorText ?? 'unknown' }));
      page.on('response', response => { if (response.status() >= 400) output.httpErrors.push({ sceneId, viewport: viewport.id, url: response.url(), status: response.status() }); });
      await launchAt(page, sceneId);
      const runtime = await page.evaluate(({ key, expectedAsset }) => {
        const save = JSON.parse(localStorage.getItem(key) ?? 'null');
        const image = document.querySelector('.scene-art img');
        return {
          sceneId: save?.cursor?.sceneId ?? null,
          dialogueIndex: save?.cursor?.dialogueIndex ?? null,
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
      }, { key: saveKey, expectedAsset: assetIds[sceneId] });
      const file = path.join(screenshotRoot, sceneId, `${viewport.id}.png`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      await page.screenshot({ path: file, fullPage: true });
      output.captures.push({ sceneId, viewport: { width: viewport.width, height: viewport.height }, ...runtime, screenshot: relative(file), screenshotSha256: sha256(file), screenshotBytes: fs.statSync(file).size });
      await context.close();
    }
  }
  output.status = output.captures.length === sceneIds.length * viewports.length && output.consoleErrors.length === 0 && output.requestFailures.length === 0 && output.httpErrors.length === 0
    && output.captures.every(capture => capture.sceneId === capture.imageSceneId && capture.assetId === capture.expectedAsset && capture.naturalWidth > 0 && capture.naturalHeight > 0 && capture.noHorizontalOverflow && capture.noVerticalOverflow && capture.language === 'ru')
    ? 'PASS_EP3_COMPLETION_BATCH_RUNTIME_PIXEL_QA' : 'FAIL_EP3_COMPLETION_BATCH_RUNTIME_PIXEL_QA';
} finally {
  await browser.close();
}
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ status: output.status, sourceHead, captures: output.captures.length, consoleErrors: output.consoleErrors.length, requestFailures: output.requestFailures.length, httpErrors: output.httpErrors.length, output: relative(outputPath) }, null, 2));
if (output.status !== 'PASS_EP3_COMPLETION_BATCH_RUNTIME_PIXEL_QA') process.exitCode = 1;
