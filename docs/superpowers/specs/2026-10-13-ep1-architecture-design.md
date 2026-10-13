# Season of Broken Hearts — EP1 architecture

## Goal

Create a dependency-free browser ESM visual-novel runtime and a truthful,
testable vertical slice of Episode 1, «Никогда не возвращайся», without
claiming full-season, production-art, Yandex-hosted, or release readiness.

## Canon and scope

- `docs/CONCEPT.md` is authoritative for character identity, romance premise,
  agency, hotel conflict, season topology, and content boundaries.
- Only EP1 is authored and executable in this stage. Episodes 2–10 remain
  planned in the outline and are not represented as reachable runtime scenes.
- Routes remain `none` throughout EP1. Choices change trust, relationship,
  hotel, and knowledge flags but do not silently route-lock a romance.
- Art is represented by named, preloadable placeholders. The acceptance state
  is `BLOCKED_ART_PRODUCTION` until real assets and pixel evidence exist.

## Runtime boundaries

```text
narrative/graph.json
        │
        ▼
pure graph/state/save/engine modules  ──► Node tests and narrative validator
        │
        ▼
DOM renderer + input controller + asset manager
        │
        ▼
browser runtime (index.html, main.mjs, CSS)
```

The graph and pure modules never import DOM APIs. The UI owns rendering and
input only; it dispatches explicit `advance`, `choose`, `back`, `newGame`, and
`setLocale` commands to the engine.

## Data contracts

`narrative/graph.json` is the source of truth and follows Starter Kit
`narrative-game` schema v1:

- unique scene IDs;
- localized dialogue arrays and choice labels;
- exactly one scene exit: `next`, `choices`, or `ending`;
- finite `stateSchema` and complete `initialState`;
- effects are exact assignments or bounded numeric deltas validated by the
  runtime before application.

The runtime state is split into:

- relationship: `trustMatteo`, `trustLeo`, `trustElio`;
- romance: `relationshipMatteo`, `relationshipLeo`, `relationshipElio`;
- hotel: `staffTrust`, `fundingEvidence`, `investorTerms`;
- knowledge/episode flags and the intentionally unchanged `route`.

## Back, choices, and persistence

The engine cursor is `{sceneId, dialogueIndex}`. Every state-changing or cursor-
changing command records a complete pre-command snapshot. `back()` restores
the snapshot, including state and cursor, so changing a choice cannot retain
the abandoned effects. A save payload contains `schemaVersion`, locale,
cursor, state, and history; migrations reject unknown future versions and
repair only known older versions. Invalid JSON, invalid graph references, and
invalid state values reset to a safe new game and expose a non-blocking UI
notice.

## UI and platform boundary

- Portrait-first responsive DOM/CSS layout at 360×640, 390×844, and 430×932.
- Buttons use explicit pointer/click handling with a disabled transition lock;
  no tap on a choice can fall through to `advance`.
- Scene backgrounds are named placeholder assets. The asset manager preloads
  the next scene asset and applies crossfade classes; reduced motion disables
  the transition.
- `/sdk.js` remains the explicit platform entry in `index.html`. A single
  guarded `YaGames.init()` call is made from source. Local development uses a
  localhost-only adapter served by the dev server; production failure remains
  fail-closed.

## Acceptance evidence

- Pure Node tests cover graph validation, guarded transitions, effects-once,
  Back snapshots, reload/migration/New Game, localization, invalid saves, and
  EP1 route consistency.
- Starter Kit status/self-test and SDK/contract validators run against the
  current target.
- The optional `narrative-game` profile points to the actual runtime graph and
  generated reachable save fixtures. Its PASS is labelled structural only.
- Browser smoke captures current-runtime screenshots at all three required
  mobile viewports and records console/network results. Visual acceptance is
  scoped to placeholder composition and UI mechanics; production-art and
  Web High art acceptance remain blocked.
