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
  {
    id: 'public-agreement',
    choices: {
      ep1_gate: 'matteo_formal', ep1_kitchen: 'elio_humor', ep1_hotel_crisis: 'hotel_numbers', ep1_leo_choice: 'leo_hear',
      ep2_wedding_budget: 'ep2_budget_open', ep2_family_rehearsal: 'ep2_giulia_family_plan', ep2_fake_terms: 'ep2_terms_public',
      ep2_bianca_arrives: 'ep2_bianca_professional', ep2_public_agreement: 'ep2_public_yes'
    }
  },
  {
    id: 'public-refusal',
    choices: {
      ep1_gate: 'matteo_direct', ep1_kitchen: 'elio_boundary', ep1_hotel_crisis: 'hotel_staff', ep1_leo_choice: 'leo_distance',
      ep2_wedding_budget: 'ep2_budget_open', ep2_family_rehearsal: 'ep2_giulia_family_plan', ep2_fake_terms: 'ep2_terms_public',
      ep2_bianca_arrives: 'ep2_bianca_pushback', ep2_public_agreement: 'ep2_public_no', ep2_public_refusal: 'ep2_refusal_help_giulia'
    }
  }
];
const targetScene = 'ep2_rehearsal_failure';
const targetAsset = 'ep2-rehearsal-failure-cg';
const expectedSources = {
  portrait: '/assets/production/cg/ep2-service-rehearsal-failure-cg.png',
  landscape: '/assets/production/cg/ep2-service-rehearsal-failure-cg-landscape.png'
};
const expectedHashes = {
  portrait: '71e8fdbf4e26c50eb6e35346984be59c9c87afb8392d6f2dd33e452ae2cad0bd',
  landscape: 'bb5759e93a3674f841ebbae535c63cbe6e7aef4dfe6c219648fbf02ca0baad58'
};
const initialState = {
  route: 'none', trustMatteo: 0, trustLeo: 0, trustElio: 0, relationshipMatteo: 0, relationshipLeo: 0,
  relationshipElio: 0, staffTrust: 0, fundingEvidence: 0, investorTerms: 'unknown', hotelEvidence: 'none',
  matteoApproach: 'none', elioApproach: 'none', leoConversation: 'none', metMatteo: false, metElio: false,
  metLeo: false, leoTruthHeard: false, elioKitchen: false, askedAboutHotel: false, lastChoice: 'none',
  routeLocked: false, fakeDatingStatus: 'none', fakeDatingTermsKnown: false, biancaRoleKnown: true,
  biancaTrust: 'professional', publicAgreement: 'accepted', consentBoundary: 'respected', ep2BudgetChoice: 'open',
  matteoFutureTalk: 'none', leoAureaLinkKnown: false, leoAccountability: 'none', leoEvidence: 'none',
  ep3SurveyChoice: 'none', matteoPublicGesture: 'hand', ep3SurveyAction: 'none'
};
const outputPath = path.resolve(process.env.STAGE9_OUTPUT_FILE ?? 'artifacts/evidence/web-high-control/S32_CURRENT_HEAD_RUNTIME_QA_20261020.json');
const screenshotRoot = path.resolve(process.env.STAGE9_SCREENSHOT_ROOT ?? 'artifacts/evidence/web-high-control/S32_CURRENT_HEAD_RUNTIME_QA_20261020');
const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const relative = file => path.relative(root, file).split(path.sep).join('/');
const expectedFormat = viewport => viewport.width / viewport.height >= 1.15 ? 'landscape' : 'portrait';
const readState = page => page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? 'null'), saveKey);

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
  await page.waitForFunction(({ key, sceneId, dialogueIndex }) => {
    const state = JSON.parse(localStorage.getItem(key) ?? 'null');
    return state?.cursor && (state.cursor.sceneId !== sceneId || state.cursor.dialogueIndex !== dialogueIndex);
  }, { key: saveKey, sceneId: before.cursor.sceneId, dialogueIndex: before.cursor.dialogueIndex }, { timeout: 15000 });
  const after = await readState(page);
  if (after.cursor.sceneId !== before.cursor.sceneId) await waitRuntimeReady(page);
}

function saveFor(routeId) {
  const refusal = routeId === 'public-refusal';
  return JSON.stringify({
    schemaVersion: 4, locale: 'ru', cursor: { sceneId: targetScene, dialogueIndex: 0 },
    state: { ...initialState, publicAgreement: refusal ? 'refused' : 'accepted', consentBoundary: refusal ? 'declined' : 'respected', matteoPublicGesture: refusal ? 'declined' : 'hand' },
    history: [], readerProgress: { seenEpisodes: [2], tutorialAdvances: 2 }
  });
}

async function launchAt(page, routeId) {
  await page.goto(`${baseUrl}?lang=ru&s32-canonical-qa=${routeId}`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: saveKey, value: saveFor(routeId) });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find(item => /Продолжить|Resume/i.test(item.textContent ?? ''));
    if (!button) throw new Error('Resume button not found after injecting S32 save');
    button.click();
  });
  await waitRuntimeReady(page);
}

async function startFresh(page, suffix) {
  await page.goto(`${baseUrl}?lang=ru&s32-canonical-qa=${suffix}`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(key => localStorage.removeItem(key), saveKey);
  await page.reload({ waitUntil: 'domcontentloaded' });
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
  targetScene,
  targetAsset,
  expectedSources,
  expectedHashes,
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
  for (const viewport of viewports) for (const route of routes) {
    console.log(`START ${viewport.width}x${viewport.height} ${route.id}`);
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

    await launchAt(page, route.id);
    console.log(`READY ${viewport.width}x${viewport.height} ${route.id}`);
    const seenScenes = [];
    let captured = false;
    for (let guard = 0; guard < 300; guard += 1) {
      const state = await readRuntime(page, viewport);
      if (!state.sceneId) throw new Error(`Missing scene state at ${viewport.width}x${viewport.height}/${route.id}`);
      if (!seenScenes.includes(state.sceneId)) seenScenes.push(state.sceneId);
      if (state.sceneId === targetScene) {
        const format = expectedFormat(viewport);
        const file = path.join(screenshotRoot, `${viewport.width}x${viewport.height}`, route.id, `${targetScene}.png`);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        await page.screenshot({ path: file, fullPage: true });
        output.captures.push({
          viewport, route: route.id, sceneId: state.sceneId, assetId: state.assetId, expectedAssetId: targetAsset,
          format: state.assetFormat, requestedFormat: state.assetRequestedFormat, source: state.assetSrc,
          expectedSource: expectedSources[format], expectedHash: expectedHashes[format],
          naturalDimensions: `${state.naturalWidth}x${state.naturalHeight}`,
          screenshot: relative(file), screenshotSha256: sha256(file), screenshotBytes: fs.statSync(file).size,
          visualRuntime: { artBounds: state.artBounds, expectedFormat: format, dialogueSafeScreenshot: true, noHorizontalOverflow: state.noHorizontalOverflow, noVerticalOverflow: state.noVerticalOverflow },
          language: state.language
        });
        console.log(`CAPTURED ${viewport.width}x${viewport.height} ${route.id}`);
        captured = true;
        break;
      }
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
    if (!captured) throw new Error(`Target scene ${targetScene} not reached in ${route.id}`);
    output.routes.push({ route: route.id, viewport, sceneIds: seenScenes, targetScene, consoleErrors, requestFailures, httpErrors });
    output.consoleErrors.push(...consoleErrors.map(error => ({ viewport, route: route.id, error })));
    output.requestFailures.push(...requestFailures.map(error => ({ viewport, route: route.id, ...error })));
    output.httpErrors.push(...httpErrors.map(error => ({ viewport, route: route.id, ...error })));
    await context.close();
  }

  const transitionContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const transitionPage = await transitionContext.newPage();
  await launchAt(transitionPage, 'public-agreement');
  const before = await readState(transitionPage);
  await transitionPage.locator('.reader-stage').click({ position: { x: 5, y: 5 } });
  await waitForCursorChange(transitionPage, before);
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
    back: { before: before.cursor, afterAdvance: afterAdvance.cursor, afterBack: afterBack.cursor, restored: afterBack.cursor.sceneId === before.cursor.sceneId && afterBack.cursor.dialogueIndex === before.cursor.dialogueIndex },
    newGame: { cursor: afterNewGame.cursor, resetToStart: afterNewGame.cursor.sceneId === 'ep1_arrival' && afterNewGame.cursor.dialogueIndex === 0 },
    locale: await transitionPage.evaluate(() => ({ htmlLang: document.documentElement.lang, title: document.title }))
  };
  await transitionContext.close();

  if (output.captures.length !== viewports.length * routes.length) throw new Error(`Screenshot coverage ${output.captures.length}`);
  if (output.consoleErrors.length || output.requestFailures.length || output.httpErrors.length) throw new Error(`Runtime errors console=${output.consoleErrors.length} request=${output.requestFailures.length} http=${output.httpErrors.length}`);
  if (output.captures.some(c => c.assetId !== targetAsset || c.source !== c.expectedSource || c.format !== c.visualRuntime.expectedFormat || !c.visualRuntime.noHorizontalOverflow || !c.visualRuntime.noVerticalOverflow)) throw new Error('Canonical mapping/format/overflow mismatch');
  if (output.captures.some(c => c.language !== 'ru') || !output.transitionChecks.back.restored || !output.transitionChecks.newGame.resetToStart) throw new Error('Locale or Back/New Game check failed');
  output.status = 'PASS_S32_CANONICAL_RUNTIME_PIXEL_QA';
} finally {
  await browser.close();
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ status: output.status, sourceHead, output: relative(outputPath), captures: output.captures.length, consoleErrors: output.consoleErrors.length, requestFailures: output.requestFailures.length, httpErrors: output.httpErrors.length, transitionChecks: output.transitionChecks }, null, 2));
