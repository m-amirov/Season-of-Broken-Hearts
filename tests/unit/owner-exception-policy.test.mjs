import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const policy = JSON.parse(fs.readFileSync(new URL('../../config/skill-policy.json', import.meta.url), 'utf8'));

test('full-season owner waiver is project-scoped and preserves the global concept-proof invariant', () => {
  assert.equal(policy.globalRules.blindPlaytestRequiredBeforeMassContent, true);

  const exception = policy.projectOwnerExceptions?.conceptProofBeforeMassProduction;
  assert.ok(exception);
  assert.equal(exception.decision, 'CONTINUE_PRODUCTION');
  assert.equal(exception.exceptionCode, 'OWNER_ACCEPTED_BLIND_PLAYTEST_RISK_2026_10_15');
  assert.equal(exception.blindPlaytestFormalPass, 'NOT_ATTESTED');
  assert.equal(exception.observationStatus, 'AWAITING_BLIND_PLAYTEST');
  assert.deepEqual(exception.waives, ['blindPlaytestRequiredBeforeMassContent']);
  assert.ok(exception.retainedGates.includes('conceptProofRequiredBeforeProduction'));
  assert.ok(exception.retainedGates.includes('screenshotVisualGateRequiredForProductionVisiblePasses'));
  assert.ok(exception.retainedGates.includes('mandatoryEvidenceForRelease'));
});
