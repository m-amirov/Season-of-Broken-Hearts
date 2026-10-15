# State and Save Architecture

## Existing compatibility boundary

EP1 currently uses `graph.schemaVersion=1`, `CURRENT_SAVE_VERSION=3`, the
existing 23 state keys and save key
`season-of-broken-hearts.save.v1`. EP1 scene IDs and choice IDs are stable.
The full-season implementation must not rewrite those IDs or discard a valid
EP1 save.

## Season state ownership

| Domain | Planned keys | Owner | Allowed mutation |
|---|---|---|---|
| Route | `route`, `routeLocked` | EP6 route choice | one explicit lock; no later route switch |
| Trust | `trustMatteo`, `trustLeo`, `trustElio`, `staffTrust` | observed conversations/work actions | bounded values; never consent |
| Relationship | `relationshipMatteo`, `relationshipLeo`, `relationshipElio` | explicit mutual scenes | bounded values; route-specific use only |
| Hotel evidence | `fundingEvidence`, `investorTerms`, `budgetPlan`, `alternativeBudget`, `staffProtection`, `publicDisclosure` | business scenes | only after source document, action or public disclosure |
| Career | `nikaCareerPlan`, `matteoCareerChoice`, `leoCareerChoice`, `elioCareerChoice` | career decision scenes | one authored choice can be revised only by a later explicit choice |
| Knowledge | `biancaRoleKnown`, `fakeDatingTermsKnown`, `staffCutsKnown`, `aureaClientKnown`, `leoAureaLinkKnown`, `exclusiveTermsSeen`, `elioRestaurantOfferKnown`, `budgetGapKnown`, `publicTruthKnown` | source scenes | provenance-required booleans |
| Consent/boundary | `fakeDatingStatus`, `matteoPublicGesture`, `leoRepairChoice`, `elioClarityChoice` | boundary conversations | refusal remains a meaningful value |
| Route progress | `matteoCommitment`, `leoAccountability`, `leoCommitment`, `elioClarity`, `elioCommitment`, `independentProgress` | route scenes | selected-route domain only |
| Result | `endingId`, `hotelOutcome` | EP10 final resolver | written once at final resolution, then immutable |

The inherited EP1 keys remain authoritative. New keys are added only when they
have a named owner, a bounded domain, an antecedent scene and a consumer in the
route explorer or an authored payoff.

## Proposed bounded domains

- `route`: `none | matteo | leo | elio | independent`.
- Trust values: integers `0..4`; `staffTrust` is `0..5` because it aggregates
  multiple staff-facing actions, but it still remains a bounded evidence score.
- Relationship values: integers `0..4`, separate from trust.
- `investorTerms`: `unknown | known-risk | exclusive | control-risk |
  limited-investment | sale-imminent`.
- `budgetPlan`: `none | events | partnerships | mixed`.
- `alternativeBudget`: `none | draft | underfunded | viable`.
- `staffProtection`: `none | requested | secured`.
- `publicDisclosure`: `none | partial | full`.
- Career keys use explicit enums documented in the architecture JSON.
- Result keys are `unresolved` until EP10 and then use only declared IDs.

The implementation may use separate scene-local flags instead of adding global
keys when a fact has no cross-episode consumer. It must not add an unbounded
array or a generic `romanceScore` to avoid owning state precisely.

## Graph and build architecture for Phase 9.2

Keep `narrative/graph.json` as the compiled runtime artifact. Add authored
episode sources under:

```text
narrative/episodes/ep-02.json
narrative/episodes/ep-03.json
...
narrative/episodes/ep-10.json
narrative/graph-build.mjs
narrative/season-architecture.json
```

The builder must:

1. load EP1 graph unchanged and assert its scene/choice IDs;
2. load episodes in numeric order;
3. reject duplicate scene/choice IDs and unknown state keys;
4. attach episode/day/location metadata;
5. validate every RU/EN dialogue and every choice target;
6. emit deterministic key ordering and a stable JSON artifact;
7. write a build receipt containing source file hashes and graph hash.

No runtime code may read the planning Markdown directly.

## Save migration plan

The first full-season engine release uses save schema version 4:

| From | To | Rule |
|---|---|---|
| v0/v1 | v4 | retain current legacy mapping, default every new season key from graph initial state |
| v2 | v4 | preserve validated EP1 state/cursor/history, add new defaults and reader progress |
| v3 | v4 | preserve the current EP1 state/cursor/history exactly, add new defaults |
| v4 | v4 | validate exact key domains, cursor, history and final result values |
| future | reject | fail closed with the existing corrupt-save notice |

Migration must apply to the current state and every history snapshot. A valid
EP1 save loads at `ep1_hook` with `route=none`; it does not replay an episode
intro or fabricate a route. `SAVE_KEY` remains unchanged so existing browser
storage is discoverable.

## Back, New Game and locale invariants

- Before `advance`, `choose`, episode transition or final resolution, the
  engine records cursor, complete state, history-relevant reader progress and
  locale-independent content position.
- Back restores the full pre-command snapshot; it cannot reissue evidence,
  duplicate a one-shot disclosure or leave route lock behind.
- New Game clears route, trust, relationship, hotel, knowledge, career and
  ending state, then starts at `ep1_arrival`.
- Locale changes only select `dialogue[locale]`; progression and state are
  byte-for-byte equivalent across RU/EN paths.
- A final save includes both `endingId` and `hotelOutcome`; reload at the final
  screen must not calculate a different result.

## Required regression suites

Phase 9.2 must add tests for EP1 v3 → v4 migration, route lock, all 21 final
pairs, negative knowledge guards, Back after route lock, New Game reset,
locale-equivalent state transitions and final-state round trips.
