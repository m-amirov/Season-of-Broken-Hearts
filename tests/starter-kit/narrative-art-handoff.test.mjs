import test from 'node:test';
import assert from 'node:assert/strict';
import { runNarrativeArtHandoff, verifyNarrativeArtHandoff } from '../../tools/narrative/narrative-art-handoff.mjs';

const H = 'a'.repeat(40);
const SHA = 'b'.repeat(64);
const model = () => ({ scenes: [{ id: 'S01', episode: 1 }, { id: 'S02', episode: 1 }, { id: 'S03', episode: 2 }] });
const descriptor = (path, width, height) => ({ path, sha256: SHA, width, height });
const manifest = () => ({
  schemaVersion: 1,
  profile: 'narrative-game',
  sourceHead: H,
  episode: 1,
  sceneAssets: { S01: 'arrival', S02: 'arrival' },
  assets: {
    arrival: {
      portrait: descriptor('assets/cg/arrival-portrait.png', 1024, 1536),
      desktop: descriptor('assets/cg/arrival-desktop.png', 1920, 1080)
    }
  }
});

test('both declared formats cover every narrative scene and remain a declaration-only PASS', () => {
  const result = verifyNarrativeArtHandoff(model(), manifest(), { currentHead: H });
  assert.equal(result.status, 'PASS_DUAL_FORMAT_HANDOFF_DECLARED');
  assert.equal(result.requiredScenes, 2);
  assert.equal(result.uniqueAssets, 1);
  assert.equal(result.formatsChecked, 2);
  assert.equal(result.visualAcceptance, 'NOT_VERIFIED');
});

test('missing desktop declaration blocks the handoff without inventing a path', () => {
  const value = manifest();
  delete value.assets.arrival.desktop;
  const result = verifyNarrativeArtHandoff(model(), value, { currentHead: H });
  assert.equal(result.status, 'BLOCKED_DUAL_FORMAT_HANDOFF');
  assert.ok(result.errors.some(error => error.code === 'ART_VARIANT_DECLARATION_MISSING'));
});

test('omitted scene coverage blocks even when another scene reuses a valid pair', () => {
  const value = manifest();
  delete value.sceneAssets.S02;
  const result = verifyNarrativeArtHandoff(model(), value, { currentHead: H });
  assert.ok(result.errors.some(error => error.code === 'ART_SCENE_UNMAPPED'));
});

test('stale source head blocks the project-to-CEOS handoff', () => {
  const value = manifest();
  value.sourceHead = 'c'.repeat(40);
  const result = verifyNarrativeArtHandoff(model(), value, { currentHead: H });
  assert.ok(result.errors.some(error => error.code === 'ART_SOURCE_HEAD_MISMATCH'));
});

test('generic or disabled profiles do not activate the dual-format handoff', () => {
  assert.equal(verifyNarrativeArtHandoff(model(), { schemaVersion: 1, profile: 'generic', enabled: true }).status, 'BLOCKED_DUAL_FORMAT_HANDOFF');
  assert.equal(runNarrativeArtHandoff('.', { schemaVersion: 1, profile: 'narrative-game', enabled: false }, 'missing.json').status, 'SKIPPED_OPT_IN_PROFILE');
});
