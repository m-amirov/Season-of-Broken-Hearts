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
