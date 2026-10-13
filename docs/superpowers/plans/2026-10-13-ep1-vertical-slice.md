# Season of Broken Hearts EP1 Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the starter placeholder with a dependency-free interactive-novel runtime and a real, localized, saveable EP1 vertical slice.

**Architecture:** `narrative/graph.json` is the authored source of truth. Pure ESM modules implement graph validation, deterministic state/effects, snapshot history, save migrations, localization, and the engine; a thin DOM layer renders the current engine state and routes explicit user input. A local dev server supplies a localhost-only SDK stub without shipping a production SDK replacement.

**Tech Stack:** Browser ESM, DOM/CSS, JSON, Node 22 built-in `node:test`, no added runtime dependencies, Playwright CLI for browser evidence.

**Spec:** `docs/superpowers/specs/2026-10-13-ep1-architecture-design.md`

## Global Constraints

- Preserve `docs/CONCEPT.md` as authoritative canon.
- Implement EP1 only; do not author or expose EP2–EP10 runtime scenes.
- Keep `route` uncommitted to a romance route during EP1.
- Do not add runtime dependencies.
- Keep Starter Kit managed files intact and run its status/self-test.
- Keep production access read-only; no Yandex publication, moderation submit, or external deploy.
- Art remains placeholders with `BLOCKED_ART_PRODUCTION` until real assets and pixel evidence exist.
- Do not claim Web High visual acceptance from Web preflight or DOM assertions.

## Review Focus

- A Back after a choice must restore the pre-choice state, not only the cursor — engine regression test.
- Re-selecting a choice after Back must not accumulate the abandoned effect — effect-once test.
- A corrupt or future-version save must reset predictably — save migration tests.
- A fast choice click must not also advance the scene — input lock/DOM smoke test.
- A locale change must preserve cursor, state, and history — engine/UI test.

### Task 1: Replace template product contract and author EP1 data

**Files:**
- Modify: `game-spec.yaml`, `index.html`, `PROJECT_RULES.md`
- Create: `narrative/graph.json`, `narrative/story-promises.json`, `narrative/episode-1.md`
- Create: `narrative/NARRATIVE_BIBLE.md`, `narrative/ROUTE_MAP.md`, `narrative/STYLE_GUIDE.md`, `narrative/STORY_PROMISES.md`, `narrative/EPISODE_OUTLINE.md`
- Create: `narrative/assets.json`, `assets/*.svg`

**Interfaces:** Graph schema is consumed by Tasks 2–5; asset manifest is consumed by the asset manager. Scene IDs are stable and all localized strings are present in both `ru` and `en`.

- [ ] Update the product spec from the Sky Routes seed to Season of Broken Hearts and point HTML at `/src/main.mjs`.
- [ ] Write the bounded EP1 graph with arrival, Villa Serena, Matteo, Elio, hotel stakes, Leo reunion, and the episode hook.
- [ ] Write the canonical narrative documents and mark future promises/episodes as planned rather than delivered.
- [ ] Add named placeholder SVGs and a scene asset manifest; record `BLOCKED_ART_PRODUCTION`.
- [ ] Validate JSON parsing and stable IDs before implementing consumers.

### Task 2: Build pure graph, state, localization, and save contracts test-first

**Files:**
- Create: `src/narrative/graph.mjs`, `src/narrative/state.mjs`, `src/narrative/localization.mjs`, `src/narrative/save.mjs`
- Test: `tests/unit/narrative-core.test.mjs`
- Modify: `package.json`

**Interfaces:** `validateGraph(graph)`, `createInitialState(graph)`, `applyEffects(state,effects)`, `canEnter(choice,state)`, `t(key,locale)`, `serializeSave(snapshot)`, `deserializeSave(raw,graph)`, and `migrateSave(payload)`.

- [ ] Write failing tests for graph edges, invalid guards, effects, localization parity, save round-trip, corrupt saves, and future-version rejection.
- [ ] Run the focused test and observe the expected missing-module failure.
- [ ] Implement the smallest pure modules satisfying the tests.
- [ ] Run the focused test to green and then the whole Node suite.

### Task 3: Implement deterministic engine and Back semantics test-first

**Files:**
- Create: `src/narrative/engine.mjs`
- Test: `tests/unit/engine.test.mjs`

**Interfaces:** `new NarrativeEngine(graph, options)`, `advance()`, `choose(choiceId)`, `back()`, `newGame()`, `setLocale(locale)`, `snapshot()`, `save()`, and `load(raw)`.

- [ ] Write failing tests for dialogue progression, guarded choices, exactly-once effects, Back-before-choice restoration, alternate choice replacement, New Game, and locale preservation.
- [ ] Run focused tests RED.
- [ ] Implement snapshot history and explicit transition locking at the pure engine boundary.
- [ ] Run focused and whole-suite tests GREEN.

### Task 4: Implement browser UI, asset manager, SDK boundary, and dev server

**Files:**
- Create: `src/main.mjs`, `src/ui/renderer.mjs`, `src/ui/input-controller.mjs`, `src/assets/asset-manager.mjs`, `src/platform/yandex-sdk.mjs`, `src/styles.css`, `tools/dev-server.mjs`
- Modify: `index.html`, `package.json`
- Test: `tests/unit/ui-contract.test.mjs`

**Interfaces:** renderer consumes engine snapshots; input controller emits explicit commands; `preloadSceneAsset(sceneId)` resolves from `narrative/assets.json`; `initYandexSdk()` performs one guarded platform init.

- [ ] Write failing UI contract tests for button actions and asset manifest references.
- [ ] Implement DOM renderer with safe text insertion, locale toggle, Back/New Game/save status, choice lock, and reduced-motion crossfade.
- [ ] Implement localhost dev server and SDK adapter without a production fallback.
- [ ] Run node tests, SDK validator, and contract validator.

### Task 5: Enable narrative-game profile from actual runtime data

**Files:**
- Create: `config/narrative-game.local.json`, `tools/narrative/export-fixtures.mjs`, `narrative/save-fixtures.json`
- Modify: `package.json`

- [ ] Add an export script that instantiates the real graph/engine and emits reachable save fixtures.
- [ ] Generate fixtures only after engine tests are green.
- [ ] Enable the project-owned profile with `promisesPath` and run `narrative-game-check --require-enabled`.
- [ ] Report structural PASS separately from runtime and semantic evidence.

### Task 6: Browser smoke, mobile evidence, review, and delivery

**Files:**
- Create: `output/playwright/*`, `artifacts/evidence/ep1-runtime-qa.json`
- Modify: `artifacts/evidence/final-gameplay-videos.json` only if required by an existing validator

- [ ] Start the local dev server and use Playwright CLI to test New Game, choices, Back, reload, and RU/EN at 360×640, 390×844, and 430×932.
- [ ] Capture screenshots and record SHA-256, dimensions, viewport, current HEAD, console, and network results.
- [ ] Run Starter Kit self-test/status, SDK/contract validators, narrative validator, and all Node tests.
- [ ] Inspect the final diff for managed-file drift, debug leftovers, and scope leakage.
- [ ] Commit the verified local changes with an explicit message; do not push unless branch permissions and the requested main push are both confirmed by the final read-only checks.

## Completion contract

The stage may be called complete only with a current evidence record. Full-season, production-art, Yandex-hosted, Web High strict, and release verdicts remain `NOT VERIFIED` or `BLOCKED` as applicable.
