import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateWardrobeContinuity } from '../../tools/narrative/wardrobe-continuity-check.mjs';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

test('EP1 wardrobe matrix enforces mandatory identity, continuity, shared-scene contrast and dual-format declarations', () => {
  const result = validateWardrobeContinuity({
    rules: readJson('config/wardrobe-rules.json'),
    matrix: readJson('artifacts/production-art/ep1-wardrobe-continuity-matrix.json'),
    assets: readJson('narrative/assets.json')
  });
  assert.equal(result.status, 'PASS_WARDROBE_CONTINUITY_RULES');
  assert.equal(result.families, 10);
  assert.equal(result.sceneCoverage, 18);
  assert.deepEqual(result.errors, []);
});
