import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const playwrightModule = process.env.STAGE52_PLAYWRIGHT_MODULE;
if (!playwrightModule) throw new Error('STAGE52_PLAYWRIGHT_MODULE is required');
const { chromium } = await import(pathToFileURL(playwrightModule).href);

const root = process.cwd();
const baseUrl = process.env.STAGE52_BASE_URL ?? 'http://127.0.0.1:4173/';
const chromePath = process.env.STAGE52_CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const outputRoot = path.resolve(process.env.STAGE52_OUTPUT_ROOT ?? 'artifacts/evidence/stage5.2/runtime');
const previewObjectPosition = process.env.STAGE52_OBJECT_POSITION ?? null;
const previewObjectPositions = JSON.parse(process.env.STAGE52_OBJECT_POSITIONS ?? '{}');
const usePreview = process.env.STAGE52_USE_PREVIEW !== 'false';
const saveKey = 'season-of-broken-hearts.save.v1';
const viewports = [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 1920, height: 900 }
];

const cases = [
  {
    id: 'CG-01-v1', cue: 'CG-01', variant: 'v1', sceneId: 'ep1_arrival', anchorIndex: 0,
    asset: 'assets/production/cg/ep1-arrival-cg.png',
    landmarks: {
      nikaFace: [0.30, 0.09, 0.54, 0.29],
      villaEntrance: [0.56, 0.08, 0.99, 0.67],
      suitcase: [0.00, 0.60, 0.30, 0.98]
    }
  },
  {
    id: 'CG-01-v2', cue: 'CG-01', variant: 'v2', sceneId: 'ep1_arrival', anchorIndex: 0,
    asset: 'assets/production/cg/ep1-arrival-cg-v2.png',
    landmarks: {
      nikaFace: [0.30, 0.09, 0.54, 0.29],
      villaEntrance: [0.56, 0.08, 0.99, 0.67],
      suitcase: [0.06, 0.64, 0.34, 0.99]
    }
  },
  {
    id: 'CG-02', cue: 'CG-02', sceneId: 'ep1_gate', anchorIndex: 3, choiceIndex: 7,
    asset: 'assets/production/cg/ep1-matteo-gate-cg.png',
    landmarks: {
      nikaFace: [0.10, 0.15, 0.37, 0.34],
      matteoFace: [0.58, 0.06, 0.82, 0.28],
      offeredHandshake: [0.42, 0.34, 0.61, 0.53],
      keysAndFolder: [0.75, 0.39, 0.99, 0.67],
      nikaBag: [0.00, 0.41, 0.20, 0.76]
    }
  },
  {
    id: 'CG-03', cue: 'CG-03', sceneId: 'ep1_kitchen', anchorIndex: 0,
    asset: 'assets/production/cg/ep1-elio-kitchen-cg.png',
    landmarks: {
      nikaFace: [0.12, 0.12, 0.38, 0.29],
      elioFace: [0.58, 0.07, 0.83, 0.26],
      kitchenWorkline: [0.38, 0.38, 1.00, 0.96],
      cupAndCounter: [0.00, 0.73, 0.28, 1.00]
    }
  },
  {
    id: 'CG-04', cue: 'CG-04', sceneId: 'ep1_leo_entrance', anchorIndex: 0,
    asset: 'assets/production/cg/ep1-leo-harbor-cg.png',
    landmarks: {
      nikaFace: [0.10, 0.14, 0.38, 0.34],
      leoFace: [0.56, 0.04, 0.83, 0.27],
      blueprintTube: [0.72, 0.50, 1.00, 0.69],
      pavedQuay: [0.00, 0.64, 1.00, 1.00],
      waterline: [0.00, 0.44, 1.00, 0.64]
    }
  }
];
const selectedCaseIds = process.env.STAGE52_CASE_IDS
  ? new Set(process.env.STAGE52_CASE_IDS.split(',').map(value => value.trim()).filter(Boolean))
  : null;
const activeCases = selectedCaseIds ? cases.filter(caseInfo => selectedCaseIds.has(caseInfo.id)) : cases;

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function sceneFor(caseInfo) {
  return caseInfo.sceneId;
}

async function waitReady(page) {
  await page.waitForFunction(() => {
    const image = document.querySelector('.scene-art img');
    return image && image.complete && image.naturalWidth > 0
      && [...image.getAnimations()].every(animation => animation.playState === 'finished');
  }, { timeout: 10000 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function readState(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey);
}

async function clickNext(page) {
  await page.locator('.primary-button').click();
  await waitReady(page);
}

async function navigateToScene(page, targetScene) {
  const choices = {
    ep1_gate: 'matteo_formal',
    ep1_kitchen: 'elio_humor',
    ep1_hotel_crisis: 'hotel_numbers',
    ep1_leo_choice: 'leo_hear'
  };
  for (let guard = 0; guard < 140; guard += 1) {
    const state = await readState(page);
    if (state.cursor.sceneId === targetScene) return state;
    const choiceButtons = page.locator('.choices .choice-button');
    if (!(await page.locator('.choices').isHidden())) {
      const choiceId = choices[state.cursor.sceneId];
      if (!choiceId) throw new Error(`No route choice for ${state.cursor.sceneId} while seeking ${targetScene}`);
      await page.locator(`[data-choice-id="${choiceId}"]`).click();
      await waitReady(page);
      continue;
    }
    if (await page.locator('.primary-button').isDisabled()) {
      throw new Error(`Episode ended before reaching ${targetScene} at ${state.cursor.sceneId}:${state.cursor.dialogueIndex}`);
    }
    await clickNext(page);
  }
  throw new Error(`Scene ${targetScene} was not reached`);
}

async function installPreview(page, caseInfo) {
  await page.evaluate(({ targetScene, asset, objectPosition }) => {
    const apply = () => {
      const image = document.querySelector('.scene-art img');
      if (!image) return;
      let state = null;
      try { state = JSON.parse(localStorage.getItem('season-of-broken-hearts.save.v1') ?? 'null'); } catch { return; }
      if (state?.cursor?.sceneId !== targetScene) return;
      const wanted = new URL('/' + asset, location.origin).href;
      if (image.src !== wanted) {
        image.dataset.stage52PreviewAsset = asset;
        image.src = wanted;
      }
      if (objectPosition) image.style.objectPosition = objectPosition;
    };
    const observer = new MutationObserver(apply);
    observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['src'] });
    const interval = setInterval(apply, 25);
    window.__stage52StopPreview = () => { observer.disconnect(); clearInterval(interval); };
    apply();
  }, {
    targetScene: sceneFor(caseInfo),
    asset: caseInfo.asset,
    objectPosition: previewObjectPositions[caseInfo.id] ?? previewObjectPosition
  });
}

async function capture(page, caseInfo, viewport, stateLabel, targetIndex) {
  if (targetIndex !== undefined) {
    for (let guard = 0; guard < 20; guard += 1) {
      const state = await readState(page);
      if (state.cursor.dialogueIndex >= targetIndex) break;
      await clickNext(page);
    }
  }
  await waitReady(page);
  const label = `${caseInfo.id}-${stateLabel}-${viewport.width}x${viewport.height}`;
  const screenshotFile = path.join(outputRoot, caseInfo.id, `${stateLabel}-${viewport.width}x${viewport.height}.png`);
  fs.mkdirSync(path.dirname(screenshotFile), { recursive: true });
  await page.screenshot({ path: screenshotFile, fullPage: true });
  const metrics = await page.evaluate(({ landmarks: sourceLandmarks }) => {
    const art = document.querySelector('.scene-art');
    const image = art?.querySelector('img');
    const artRect = art.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    const style = getComputedStyle(image);
    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;
    const layoutWidth = image.offsetWidth;
    const layoutHeight = image.offsetHeight;
    const transformedScaleX = imageRect.width / layoutWidth;
    const transformedScaleY = imageRect.height / layoutHeight;
    const coverScale = Math.max(layoutWidth / naturalWidth, layoutHeight / naturalHeight);
    const visibleWidth = Math.min(naturalWidth, layoutWidth / (coverScale * transformedScaleX));
    const visibleHeight = Math.min(naturalHeight, layoutHeight / (coverScale * transformedScaleY));
    const position = style.objectPosition.match(/([\d.]+)%\s+([\d.]+)%/) ?? [, '50', '50'];
    const cropLeft = (naturalWidth - visibleWidth) * Number(position[1]) / 100;
    const cropTop = (naturalHeight - visibleHeight) * Number(position[2]) / 100;
    const project = box => {
      const [left, top, right, bottom] = box;
      const x1 = (left * naturalWidth - cropLeft) / visibleWidth;
      const y1 = (top * naturalHeight - cropTop) / visibleHeight;
      const x2 = (right * naturalWidth - cropLeft) / visibleWidth;
      const y2 = (bottom * naturalHeight - cropTop) / visibleHeight;
      return {
        sourceNormalized: box,
        runtimeNormalized: [x1, y1, x2, y2].map(value => Math.round(value * 1000) / 1000),
        clipped: x1 < 0 || y1 < 0 || x2 > 1 || y2 > 1,
        runtimePixels: {
          left: Math.round(artRect.left + x1 * artRect.width),
          top: Math.round(artRect.top + y1 * artRect.height),
          right: Math.round(artRect.left + x2 * artRect.width),
          bottom: Math.round(artRect.top + y2 * artRect.height)
        }
      };
    };
    const state = JSON.parse(localStorage.getItem('season-of-broken-hearts.save.v1'));
    return {
      viewport: { width: innerWidth, height: innerHeight },
      sceneId: state.cursor.sceneId,
      dialogueIndex: state.cursor.dialogueIndex,
      sceneArt: {
        left: Math.round(artRect.left), top: Math.round(artRect.top),
        width: Math.round(artRect.width), height: Math.round(artRect.height)
      },
      imageRect: {
        left: Math.round(imageRect.left), top: Math.round(imageRect.top),
        width: Math.round(imageRect.width), height: Math.round(imageRect.height)
      },
      source: { width: naturalWidth, height: naturalHeight },
      css: {
        objectFit: style.objectFit,
        objectPosition: style.objectPosition,
        transform: style.transform,
        transformScaleX: Math.round(transformedScaleX * 10000) / 10000,
        transformScaleY: Math.round(transformedScaleY * 10000) / 10000
      },
      cropSourcePixels: {
        left: Math.round(cropLeft), top: Math.round(cropTop),
        right: Math.round(cropLeft + visibleWidth), bottom: Math.round(cropTop + visibleHeight),
        width: Math.round(visibleWidth), height: Math.round(visibleHeight)
      },
      landmarks: Object.fromEntries(Object.entries(sourceLandmarks).map(([key, value]) => [key, project(value)])),
      choicesVisible: !document.querySelector('.choices').hidden,
      dialogueText: document.querySelector('.dialogue-text')?.textContent ?? ''
    };
  }, { landmarks: caseInfo.landmarks });
  return {
    label, screenshot: relative(screenshotFile), sha256: sha256(screenshotFile),
    bytes: fs.statSync(screenshotFile).size, stateLabel, ...metrics
  };
}

const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const output = {
  schemaVersion: 1,
  status: 'RUNNING',
  sourceHead: head,
  baseUrl,
  previewObjectPosition,
  previewObjectPositions,
  usePreview,
  viewports,
  cases: [],
  assets: []
};

for (const caseInfo of activeCases) {
  const assetFile = path.resolve(caseInfo.asset);
  if (!fs.existsSync(assetFile)) throw new Error(`Missing preview asset: ${caseInfo.asset}`);
  output.assets.push({
    id: caseInfo.id, cue: caseInfo.cue, path: caseInfo.asset,
    sha256: sha256(assetFile), bytes: fs.statSync(assetFile).size,
    expectedDimensions: '1024x1536'
  });
}

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
try {
  for (const caseInfo of activeCases) {
    const caseResult = { id: caseInfo.id, cue: caseInfo.cue, asset: caseInfo.asset, captures: [] };
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      const consoleErrors = [];
      const requestFailures = [];
      page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
      page.on('requestfailed', request => requestFailures.push({ url: request.url(), failure: request.failure()?.errorText ?? 'unknown' }));
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await waitReady(page);
      await page.evaluate(key => localStorage.removeItem(key), saveKey);
      await page.reload({ waitUntil: 'networkidle' });
      await waitReady(page);
      if (usePreview) await installPreview(page, caseInfo);
      await navigateToScene(page, caseInfo.sceneId);
      const anchor = await capture(page, caseInfo, viewport, 'anchor', caseInfo.anchorIndex);
      caseResult.captures.push({ ...anchor, consoleErrors, requestFailures });
      if (caseInfo.choiceIndex !== undefined) {
        const choice = await capture(page, caseInfo, viewport, 'choice', caseInfo.choiceIndex);
        caseResult.captures.push({ ...choice, consoleErrors, requestFailures });
      }
      await page.evaluate(() => window.__stage52StopPreview?.());
      await context.close();
    }
    output.cases.push(caseResult);
  }
  output.status = 'PASS_RUNTIME_PREVIEW_CAPTURED';
} finally {
  await browser.close();
}

const outputFile = path.resolve(process.env.STAGE52_OUTPUT_FILE ?? 'artifacts/evidence/stage5.2-runtime-matrix.json');
fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ status: output.status, sourceHead: head, output: relative(outputFile), captures: output.cases.reduce((sum, item) => sum + item.captures.length, 0), consoleErrors: output.cases.flatMap(item => item.captures.flatMap(capture => capture.consoleErrors)).length, requestFailures: output.cases.flatMap(item => item.captures.flatMap(capture => capture.requestFailures)).length }, null, 2));
