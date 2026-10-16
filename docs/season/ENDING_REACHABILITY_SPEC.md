# Ending Reachability Specification

## Ending model

The season resolves two independent functions at the end of EP10:

```text
relationshipEnding = resolveRelationshipEnding(route, relationship/trust/career/consent state)
hotelOutcome       = resolveHotelOutcome(hotel evidence, staff protection, disclosure, investor terms)
finalState         = relationshipEnding × hotelOutcome
```

Neither function accepts the output of the other as an input. The expected
legal result is 7 relationship finals × 3 hotel outcomes = 21 combinations.

## Relationship ending thresholds

Scores are bounded evidence, not consent. A good ending always also requires a
route-specific action and a future conversation.

| Ending | Positive path | Negative path | Required authored action |
|---|---|---|---|
| `matteo-hope` | trust ≥ 3, relationship ≥ 3, mutual plan, delegation, full disclosure | not applicable | Matteo opens the ledger, delegates and removes employment leverage |
| `matteo-goodbye` | route Matteo with any failed positive prerequisite | not applicable | Nika says what she will not accept and leaves the relationship |
| `leo-second-chance` | trust ≥ 3, relationship ≥ 3, verified accountability, heritage plan | not applicable | Leo takes a career action that can be checked without Nika |
| `leo-echo` | route Leo with failed accountability or Aurea convenience | not applicable | Nika refuses to restart the old silence |
| `elio-table-for-two` | trust ≥ 3, relationship ≥ 3, discussed clarity, hybrid plan | not applicable | Elio and Nika write a workable two-career schedule |
| `elio-separate-kitchens` | route Elio with avoided clarity or unplanned departure | not applicable | Both name incompatible plans without blame or coercion |
| `nika-own-way` | independent progress self-authored and portfolio career plan | not applicable | Nika accepts a concrete professional future and keeps romance non-required |

The explorer must be able to produce both positive and negative samples for
each romantic route. The independent route has one positive ending, but its
hotel outcome must still vary across all three outcomes.

## Hotel outcome thresholds

Hotel resolution is a deterministic ordered rule evaluated after the final
public disclosure:

1. `independence` if `alternativeBudget=viable`, `staffTrust>=4`,
   `fundingEvidence>=3`, `staffProtection=secured` and
   `publicDisclosure=full`.
2. `limited-investment` if `investorTerms=limited-investment`,
   `staffTrust>=3`, `staffProtection=secured` and `publicDisclosure=full`.
3. `sale` otherwise.

The second rule does not require a romantic route and the first rule does not
require a happy relationship ending. A sale can occur with a happy romance;
this is a designed consequence, not a bug.

## Machine-checkable explorer contract

The future route explorer shall:

1. start from the EP1 save fixtures and the clean initial state;
2. enumerate each legal choice, apply only declared effects, and carry the
   exact scene ID, day, location, knowledge provenance and state snapshot;
3. reject a path when it enters route content before EP6, switches route after
   lock, uses a missing antecedent, or has a dangling target;
4. reach `ep10_hotel-resolution` and one route-specific final scene before
   calculating outcomes;
5. record at least one witness path for every relationship ending and hotel
   outcome;
6. record witness paths for all 21 ending pairs;
7. serialize and restore every witness final state;
8. run the same path in RU and EN and assert identical state transitions;
9. assert that Back removes the last choice effect and cannot duplicate a
   one-shot action;
10. report `PARTIAL_COVERAGE` rather than PASS if any declared branch family is
    not explored.

Pseudo-interface:

```js
const report = exploreSeason({ graph, fixtures, locales: ['ru', 'en'] });
assert.equal(report.routeLock.earlyLocks, 0);
assert.deepEqual(report.relationshipEndingIds, EXPECTED_RELATIONSHIP_ENDINGS);
assert.deepEqual(report.hotelOutcomeIds, EXPECTED_HOTEL_OUTCOMES);
assert.equal(report.legalEndingPairs.length, 21);
assert.equal(report.unresolved.length, 0);
```

This is a Phase 9.2 implementation requirement. The Phase 9.1 contract checker
only verifies the declared architecture, not runtime reachability.
