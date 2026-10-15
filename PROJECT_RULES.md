# Project Rules

Project-owned extension point. Add game-specific architecture, protected systems, economy, art, save-schema, test and release constraints here. Do not edit `.starter-kit/core/AGENTS_CORE.md` for project-specific exceptions.

## Screenshot Visual Gate extension

`SCREENSHOT_VISUAL_GATE` is mandatory for production-visible passes under the managed engineering and visual-quality contracts. Record any project-specific art language, prohibited patterns, required state matrix, evidence location, and accepted visual baseline here. These rules can be stricter but cannot waive actual-runtime current-HEAD screenshots, affected-state coverage, visual review, or the acceptance-token barrier.

## Narrative vertical-slice rules

- `docs/CONCEPT.md` is the canon for character identity, agency, romance
  boundaries, hotel conflict, season topology and content limits.
- `narrative/graph.json` is the authored EP1 source of truth. Stable scene and
  choice IDs must not be renamed without a migration note and regression test.
- `route` remains `none` through EP1. Trust, romance, hotel and knowledge state
  are separate keys; no choice may silently consume another route's effects.
- Dialogue and choices remain player-facing and route-neutral. Do not expose
  internal state names such as `route`, `routeStatus` or `routeIntent`.
- Placeholder scenes are functional only. `BLOCKED_ART_PRODUCTION` remains in
  force until real assets, provenance and current-runtime pixel evidence exist.
- Save schema changes require a migration or a deterministic safe reset; Back
  always restores a complete pre-command state snapshot.

## Full-season concept-proof owner exception (2026-10-15)

The project owner explicitly accepted the risk of missing independent EP1
blind-playtest sessions and authorized `CONTINUE_PRODUCTION` for EP2–EP10.
Authoritative owner record:
`artifacts/concept-proof/FULL_SEASON_OWNER_DECISION_2026-10-15.md`.

This is a project-specific **waiver of the requirement to finish the
three-person blind playtest before mass content production**, not a claim that
the playtest was passed. `BLIND_PLAYTEST_FORMAL_PASS` remains
`NOT_ATTESTED` and the observation ledger remains
`AWAITING_BLIND_PLAYTEST`. The 2026-10-13 `EP1_DECISION.md` is historical;
its EP1-only authorization scope is superseded by the newer decision.

For Stage 9, accept the newer `CONTINUE_PRODUCTION` owner decision and
proceed with full-season architecture, narrative, route implementation, and
production under unchanged technical/narrative/visual quality gates.
Do not block *solely* for the absent three reader sessions or the earlier
EP1 pilot limit. Do not amend historical playtest sessions, erase missing
evidence, infer reader comprehension, or claim product validation PASS.

This override is narrower than the overall Starter Kit quality rules:
keep the independent art acceptance, save/runtime/route/locale gates and
official Yandex release requirements. It does not authorize publication,
submission to moderation, or fake release evidence. Do not edit managed
`.starter-kit/core/CONCEPT_PROOF_GATE.md` for this local exception.
