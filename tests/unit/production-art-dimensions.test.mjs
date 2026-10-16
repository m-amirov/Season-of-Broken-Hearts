import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const config = () => read('config/production-art-dimensions.json');
const stageManifest = () => read('artifacts/production-art/stage9.4/PRODUCTION_ASSET_MANIFEST.json');
const briefs = () => read('artifacts/production-art/stage9.4/SOURCE_BOUND_ART_BRIEFS.json');

test('native source PNG dimensions are consistent across Stage 9.4 contracts', () => {
  const source = config().sourcePng;
  const manifest = stageManifest().dualFormatContract;
  const brief = briefs().dualFormatContract;

  assert.deepEqual([source.portrait.width, source.portrait.height], [1024, 1536]);
  assert.deepEqual([manifest.portrait.width, manifest.portrait.height], [1024, 1536]);
  assert.deepEqual([brief.portrait.width, brief.portrait.height], [1024, 1536]);

  assert.deepEqual([source.desktop.width, source.desktop.height], [1672, 941]);
  assert.deepEqual([manifest.desktop.width, manifest.desktop.height], [1672, 941]);
  assert.deepEqual([brief.landscape.width, brief.landscape.height], [1672, 941]);
  assert.ok(Math.abs(source.desktop.width / source.desktop.height - 16 / 9) < 0.002);
  assert.equal(manifest.desktop.contract, 'config/production-art-dimensions.json');
});

test('1920x1080 is a runtime viewport target, not a required generated PNG canvas', () => {
  const c = config();
  const brief = briefs().dualFormatContract.landscape;
  assert.deepEqual(brief.runtimeViewportTarget, { width: 1920, height: 1080 });
  assert.ok(c.runtimeScreenshotViewports.desktop.some(v => v.width === 1920 && v.height === 1080));
  assert.notDeepEqual([c.sourcePng.desktop.width, c.sourcePng.desktop.height], [1920, 1080]);
  assert.deepEqual([c.ceosMinimumAccepted.desktop.width, c.ceosMinimumAccepted.desktop.height], [1280, 720]);
  assert.match(brief.outputGateCommand, /--width 1672 --height 941/);
  assert.match(c.artOutputVerification.desktopCommand, /--width 1672 --height 941/);
  assert.equal(c.artOutputVerification.noResampleOrCropOrStretch, true);
});

test('the original S19 gate failure remains historical; no acceptance is inferred', () => {
  const stage = stageManifest();
  const family = stage.assets['ep2-office-morning-brief-cg'];
  const failure = read('artifacts/production-art/stage9.4/receipts/S19-ep2-office-morning-brief-landscape-candidate1-failure.json');

  assert.equal(stage.status, 'BLOCKED_ART_OUTPUT');
  assert.equal(stage.runtimeAdmission, 'NONE');
  assert.equal(family.desktop, null);
  assert.equal(family.blockedVariant.expectedDimensions, '1920x1080');
  assert.equal(family.blockedVariant.actualDimensions, '1672x941');
  assert.equal(failure.status, 'BLOCKED_ART_OUTPUT');
  assert.deepEqual(failure.issues, ['ART_DIMENSION_MISMATCH']);
  assert.equal(stage.resolutionDecision.productionArtAccepted, false);
});

test('EP1 approved desktop CGs already use the native 1672x941 composition', () => {
  const ep1 = read('artifacts/production-art/stage8-wardrobe-rework-dual-format-manifest-final.json');
  const assets = Object.values(ep1.assets);
  assert.ok(assets.length > 0);
  for (const asset of assets) {
    assert.equal(asset.desktop.width, 1672);
    assert.equal(asset.desktop.height, 941);
  }
});
