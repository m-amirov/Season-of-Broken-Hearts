import assert from 'node:assert/strict';
import test from 'node:test';
import contract from '../../narrative/season-architecture.json' with { type: 'json' };
import { validateSeasonArchitecture } from '../../tools/narrative/season-architecture-check.mjs';

test('full-season architecture contract covers routes, endings, outcomes and timeline', () => {
  const report = validateSeasonArchitecture(contract);
  assert.equal(report.valid, true, report.errors.join('; '));
  assert.deepEqual(report.coverage, {
    episodes: 10,
    routes: 4,
    relationshipEndings: 7,
    hotelOutcomes: 3,
    expectedEndingPairs: 21,
    promises: 8
  });
});

test('architecture contract rejects romantic and hotel ending coupling', () => {
  const invalid = structuredClone(contract);
  invalid.relationshipEndings[0].condition += ' && hotelOutcome=sale';
  assert.equal(validateSeasonArchitecture(invalid).valid, false);
});
