# Codex — Stage 6: Responsive Cinematic Reader UI

**Project:** Season of Broken Hearts — `m-amirov/Season-of-Broken-Hearts`  
**Reference (read-only):** `m-amirov/kiss-at-the-edge-of-the-world`, especially `src/literary-player.js` and `src/literary.css` on verified main.  
**Source HEAD for preflight:** `c12faa3f629c24ccc278b049e60bad2d65062138` (refresh before editing).  
**Requested by owner:** UI interaction should be like «Поцелуй на краю света»; hide RU/EN buttons; tap-to-advance, Menu and Back in top bar; **real desktop UI** and **portrait-only mobile UI**.  
**Scope:** UI, input, responsive layout, platform locale, relevant tests and truthful config. No story rewrite/art regeneration/season production/release.

## Baseline identified from current repository

- `src/ui/renderer.mjs` currently builds `localeBar` with two RU/EN buttons; back/new game/continue actions live in footer. There is no reader menu.
- `src/styles.css` uses vertical `.novel-shell`, separate `.scene-art` above `.novel-content`, and `@media(min-width:700px) .novel-shell{max-width:720px}`. This is **not a proper widescreen desktop layout**.
- `src/ui/input-controller.mjs` has important pointer ownership/double-tap suppression; preserve correctness and avoid wiring the stage through a naive bubbling click handler.
- `src/main.mjs` detects locale only from `navigator.language` and always prints footer buttons. Existing SDK initializer returns `YaGames.init()` result but does not yet expose normalized `environment.i18n.lang`.
- Current graphics: four accepted source-level EP1 CGs + remaining honest placeholders; CG-03 kitchen has a **separate semantic mismatch** involving white apron/knife/pot in the text and dark apron/towel in the art. Do not silently mark it resolved in this UI task.

## 1. Reference behavior — adapt, do not blindly copy

Read the existing production UI/gesture implementation in `m-amirov/kiss-at-the-edge-of-the-world/src/literary-player.js` and `src/literary.css`, especially `renderReader`, `renderMenu`, `bindStageNavigation`, `bindStageTapTarget`, `.reader-header`, `.reader-sheet`, `.literary-picture` and mobile/desktop media rules.

**Bring across UX patterns, not wholesale code or visual branding**:
- image-led / cinematic reader;
- top-level minimalist nav;
- clear dialogue surface over art;
- tap or click in unoccupied space to progress;
- choice guards and back history;
- pause/menu/settings/new game flows;
- explicit PC layout + portrait handheld.

Preserve Season of Broken Hearts’ name, Mediterranean visual atmosphere, typography hierarchy, existing scene/character identity, state machine and original files. Do not bring story logic, save schema or hundreds of override CSS rules from the reference game.

## 2. New reading screen

- A single responsive scene stage occupies the gameplay viewport, artwork as background image layer with controllable per-asset focal point, covered by **lightweight top nav overlay** and **translucent lower dialogue/choice panel** (legible over both light and dark CG).
- **Top left:** `Назад / Back` (label and arrow), disabled/inactive only when `engine.canBack()===false`; backed by existing snapshot state history.
- **Top right:** `☰ Меню / Menu`, opens a real accessible menu overlay, not a full game reset.
- A subtle episode/progress marker may sit between them if it fits, but avoid huge repeating title text and debug banners in the reading state.
- **No visible RU/EN controls anywhere in the player UI.** Locale defaults to Yandex Games SDK `environment.i18n.lang` on platform; browser language fallback when SDK data is missing/local LAN. Normalize `ru*` to `ru`, `en*` to `en`, and every other value to `en`; an existing save's locale never overrides the current platform locale.
- **No permanent large Continue button or New Game button** on dialogue screens. Provide a subtle noninteractive advance cue when a dialogue can progress. At choices, clear choice cards appear; a tap outside them must NOT skip/choose.
- Keep speaker labels distinct and accessible, wrap long RU/EN text; no shadows or busy animation that reduce readability.
- Menu should provide: `Продолжить / Resume`, `Новая игра / New Game` (confirmation preserving save unless confirmed), `Настройки / Settings` (readable text controls/reduced motion if feasible; language is platform-selected). Do not add unattainable features (cloud save, paid items, audio) or dead buttons.
- Opening menu must not advance narrative; closing it returns to same scene+line+choices+locale+saved state. Lock narrative inputs under modal/menu.
- Terminal/cliffhanger screens must remain readable and navigable without fake Continue.

## 3. Input safety (must not regress)

Implement coherent gesture ownership adapted to the existing controller:

- One ordinary touch pointerup/tap or mouse left click on **noninteractive scene/dialogue area** = exactly one advance when not awaiting choice, not complete, not menu-open and loading safely.
- Do not double-advance on `pointerup` followed by synthetic `click`, rapid double tap, touch-to-mouse emulation, pointercancel, drags, scrolls, long press, multipointer, or click through from choice/menu/back buttons.
- Ignore taps on real controls, choices, overlays, settings inputs, and external links. Avoid global body-level handlers that accidentally swallow UI clicks.
- Choice selection always owns its own gesture; no accidental auto-selection/skip. Preserve existing `unlock/lock` and pending decode scene transition semantics. No event-listener accumulation on re-render.
- On desktop enable keyboard Space/Enter/ArrowRight for narrative progression only when focus is not on an actionable element, with accessibility `focus-visible`. Provide explicit accessible button/aria keyboard path for canvas reader without relying solely on touch.
- Back returns exactly one previous dialogue/snapshot without creating duplicate save events; no unintended menu close/advance.

## 4. Two real responsive compositions

### Phone/mobile: **portrait only**

- Support 360×640, 390×844, 430×932, plus narrow/short heights and safe-area insets / on-screen browser bars.
- Use `100dvh`, `env(safe-area-inset-*)`, and proper content sizing; no horizontal overflow, clipped dialogue, unreachable choices, offscreen top nav or phone keyboard traps.
- Vertical **image-led** layout: art fills the stage; lower panel overlaps the lower portion. Preserve character faces, major props, and approved asset-specific focal points; the current images are 1024×1536 portrait.
- On **mobile devices rotated to landscape**, show accessible localized `Поверните устройство / Rotate your device` orientation overlay (CSS/layout-detected landscape small-screen), not a cramped active reader. Preserve game state, pause/block stage gesture, restore instantly on portrait. Check game/catalog orientation metadata appropriate for Yandex; do not assume `screen.orientation.lock()` works in browser. Never apply the rotate overlay to actual desktop landscape windows.
- A tablet/laptop touch screen should not be misclassified simply because `pointer:coarse`; combine viewport/device heuristics responsibly and test a desktop window resized narrow.

### PC/desktop: **landscape and resizable**

- Explicit wide game layout for 1280×720, 1366×768, 1600×900, 1920×900, 1920×1080; test window resize and 100–125% zoom. Do not retain `max-width:720px` novel-shell.
- Use viewport width meaningfully: stage/art region should be materially wider than the phone viewport; top bar across stage; a readable, horizontally centered or lower-aligned dialogue panel with deliberate max text measure, rather than text stretched edge-to-edge.
- Existing portrait CG sources must **not be stretched or heavily cropped into broken anatomy**. Explore sane presentation for landscape using e.g. contained portrait art over a tasteful dim/blurred duplicate side extension, or precise desktop-stage composition with targeted focal points. Do not claim fully authored 16:9 images exist; use the four existing CGs as-is. If authoring separate future desktop art is helpful, record it as a future requirement, not an automatic generation request.
- Menu, Back, dialogue, choices and keys work with mouse and keyboard. A narrow desktop resize must still remain functional. CSS media conditions must not turn every landscape PC into a phone rotate warning.

## 5. Asset continuity, narrative and SDK

- Keep verified EP1 mappings, CG sha256/provenance, placeholder visibility of incomplete scenes, source/head records and existing preload+decode+crossfade (previous frame stays on failure) untouched except for UI-compatible changes.
- Validate actual source/image pixel crop using gameplay screenshots, not only theoretical cover bounds.
- Do not rewrite the plot or dialogue for UI. Keep the CG-03 story/art semantic blocker explicit and separate.
- SDK locale: inspect real `YaGames.init()` result and normalize `environment?.i18n?.lang`; local/LAN behavior must work when the SDK stub is present. Avoid unconditional SDK methods unsupported in current shell. Preserve Yandex SDK validation and save migration.
- Update `game-spec.yaml` truthful orientation/localization/responsive desktop capabilities; `portrait-first` alone is no longer the contract. Document mobile portrait vs desktop landscape support and QA browser overrides if introduced.

## 6. Deliverables

1. A small user-facing interface description and/or runtime before-after screenshots (real, not mock evidence), not just CSS changes.
2. Updated production UI modules and CSS with simple maintained structure.
3. Proper modal/menu lifecycle, keyboard/focus handling, locale strategy.
4. Automated regression tests of gestures and menu/back/save/choice input; orientation detection.
5. Real browser screenshot matrix covering portrait mobile and widescreen desktop:
   - arrival `ep1_arrival`,
   - choice branch near `ep1_gate`,
   - `ep1_kitchen`,
   - `ep1_leo_entrance`,
   - menu open, settings if added, mobile rotate prompt,
   - narrow desktop resize,
   - long RU and EN dialogue,
   - slow asset decode and failed asset (existing fallback).
6. 0 console errors/failed requests, no text clipping or unclickable choices, no overlay/tap through.
7. Preserve both `npm run dev` and `npm run dev:lan`, no heavy dependencies.

## 7. Verification, commits and stop conditions

Run at least:
- `npm test` + newly added tests;
- `npm run narrative:validate` and `npm run narrative:fixtures`;
- `npm run starter-kit:status` / `npm run starter-kit:self-test`;
- `npm run yandex:sdk:validate`;
- CEOS scoped verification plus browser QA / visual-content review where transport truly delivers current pixels.

Starter Kit semantic `package.json`/config edits require official acceptance workflow, no gate weakening. Do not run final release/media contract as a substitute for this scoped UI stage. No publishing.

Before claiming PASS, inspect screenshots from real browser of **phone portrait, phone landscape orientation overlay, and desktop widescreen**. Only if browser screenshots are truly available and checked, report runtime visual PASS; otherwise mark browser acceptance as BLOCKED/NOT_VERIFIED and explain precise missing evidence.

Keep all unrelated user files, artist source PNGs, canon references and CEOS terminal histories intact. No force-push.

After verified changes, commit/push to `main` if no conflict and report source/final HEAD, modified files, input test matrix, viewport evidence, changes to SDK locale behavior, art framing limitations and remaining semantic/asset issues.

**Do the real UI implementation; do not stop after generating a plan.** The desktop layout is a required product deliverable, not a stretch goal.
