# Codex — Stage 5: EP1 Art Direction + Four-CG Production Pilot

**Repository:** `m-amirov/Season-of-Broken-Hearts`  
**User decision:** positive feedback reported; owner authorized bounded continuation in `artifacts/concept-proof/EP1_DECISION.md`. This is **NOT** formal proof of three completed blind-playtest sessions.  
**Required source docs:**
- `docs/CONCEPT.md` — authoritative fiction canon.
- `narrative/graph.json`, `narrative/NARRATIVE_BIBLE.md`, `narrative/ROUTE_MAP.md` — implemented EP1.
- `artifacts/art-direction/ART_BIBLE.md`
- `artifacts/art-direction/VISUAL_LANGUAGE.json`
- `artifacts/art-direction/EP1_SHOT_LIST.md`
- `.codex/skills/visual-quality-gate/SKILL.md` and `docs/NARRATIVE_SCENE_VISUAL_CONTRACT.md`.

## Goal

Start controlled production-art for EP1. Establish an emotionally convincing, consistent visual identity for Nika, Matteo, Elio and Leo, **then** create and integrate only the four scoped pilot full-scene CG. Do not mass-produce EP1 remaining images, EP2–EP10, ads, key art or marketing assets.

If art-generation capabilities are missing, complete feasible art production planning/reference prompts but report `BLOCKED_ART_PRODUCTION`; never forge images or claim generated source pixels.

## Stage A — Actual repo and capability preflight

1. Check `git status`, origin main, exact HEAD, Starter Kit/CEOS versions and adoption. Respect uncommitted files and managed ownership.
2. Audit actual image-generation, asset-rights/provenance, pixel-reading, runtime screenshot and Web High/host-observed capabilities. Distinguish **tool callable**, **host trusted**, **quota available** and **review actually received pixels**. Use available approved producers only; do not invent a hidden producer or claim unavailable tools worked.
3. Confirm that `docs/CONCEPT.md` exists; if absent locally but present in origin, diagnose checkout/sparse config before work. Do not recreate its text.
4. Inspect 18 scenes and 5 placeholder IDs. Preserve narrative text, choices, route graph and working input/save behavior.

## Stage B — Style exploration and character identities

1. Create 2–3 **materially distinct, professional** visual-style explorations depicting the same test story beat; evaluate mood, characters, architecture, physical reality, composition and readability.
2. Choose a single consistent provisional style. Produce a **real contact sheet from actual candidate images** (with labels outside the art) and a concise comparison; no text-only or fictional contact sheet.
3. Create a stable main-cast reference for Nika (28), Matteo (33), Elio (30) and Leo (31); ensure facial identity, body proportions, outfit and role. Distinguish the men clearly without generic archetype duplication. Refer to `ART_BIBLE.md` for scene-appropriate wardrobe; preserve canon.
4. **Pause at a genuine art-direction approval checkpoint** if character identity or style has not been accepted by the owner. Do not claim approval merely because a generator returned images. Store candidates with source/provenance, hashes and dimension metadata. If approval cannot be obtained in this execution, report `AWAITING_ART_STYLE_APPROVAL`, and hand off preview(s) clearly.

## Stage C — Four CG only, after identity/style approval

Read `EP1_SHOT_LIST.md` and produce (or arrange production-ready accepted sources for):

- `ep1-arrival-cg`: Nika arriving with suitcase at Villa Serena; morning, exterior, Mediterranean summer.
- `ep1-matteo-gate-cg`: Nika and Matteo meet at gate. Matteo's keys and work folder, contained interpersonal tension, plausible pavement/perspective.
- `ep1-elio-kitchen-cg`: Nika and chef Elio in working kitchen, welcome and believable warmth, no unwanted physical intimacy.
- `ep1-leo-harbor-cg`: Nika and Leo meet on actual paved quay at dusk, blueprint tube with Leo, strained reunion, correct waterline.

**Critical:** Leo's connection to Aurea is not revealed in EP1; keep logos/brand on drawings out of view. The EP1 final mystery-folder scene is in the hotel office — not at the night pier. Do not silently map pilot quay art to `ep1_hook`.

Each asset: coherent single CG, realistic human scale and action, no UI/dialogue inside image, natural negative space for portrait UI, no random text or watermark.

Use at most 2 substantive candidates per asset at first pass; investigate root causes before regeneration; after 3 materially different failed attempts escalate, do not enter endless cosmetic loops. Generated work is never automatically accepted.

## Stage D — Integration and source-bound mapping

1. Once image pixels exist, add a **project-owned** versioned production asset manifest with paths and SHA-256/provenance. Keep original `assets/placeholder-*.svg` intact for unfinished scenes.
2. Update `narrative/assets.json` and specific `assetId` mappings only for accepted CG. Do not reuse a CG when scene has a different location, action, time or cast. The four pilot CG may cover only canon-consistent scenes.
3. Produce separate **authored** scene/beat contract and **runtime-exported** mapping following `docs/NARRATIVE_SCENE_VISUAL_CONTRACT.md`. Bind real scene identifiers, source hashes and asset paths. Run validation; never treat a structural match as visual pass.
4. If extending the manifest impacts Starter Kit semantic baseline or `package.json`, follow official dry-run + `--resolve-semantic` flow; do not disable or bypass CEOS.
5. Ensure preload/decode/crossfade: keep last valid frame until next decodes; bounded memory/request budget; cancel stale scene transitions; deterministic fallback for network error; no black frame under slow mobile network; reduced-motion support. Test both Back and Next during pending image requests.

## Stage E — Real acceptance matrix

For every new actual image:
- Inspect the **full source pixels** with reference sheet; verify actor identity, exact action, composition, human anatomy, hands/limbs, eye-level perspective, grounding, coherent pier/waterline, wardrobe and artistic continuity.
- Capture source-HEAD gameplay screenshots at **360×640, 390×844, 430×932** and declared desktop **1920×900**, at relevant first line, long line and choice UI; record actual crop and dialogue-safe pixels.
- Compare current scene art against narrative beat and spatial/temporal sequence; no incorrect location or character.
- Have independent pixel review of delivered image and gameplay screenshots (host-observed Web High accepted by owner as artistic-review standard where supported, but do not claim provider attestation). Ensure reviewer truly received pixels, not only filenames.
- Record `PASS/REWORK/BLOCKED` per asset per affected viewport, with hashes, grounded findings, minimal repair rationale and explicit evidence references.
- Full EP1 Art Acceptance remains **BLOCKED/PARTIAL** until nonpilot images are produced. Never promote `PARTIAL_PILOT_ACCEPTANCE` to full-game PASS.

## Automated checks

Run real available checks, e.g. `npm test`, `npm run narrative:validate`, `npm run starter-kit:status`, `npm run starter-kit:self-test`, SDK contract validators and scoped `ceos verify`. Execute browser smoke and targeted slow-image / failed-image / Back/Next / reduced-motion regression. Do not waste GitHub Actions on repeatable local Linux checks. Release gates are out of scope.

## Completion criteria

**If art style not approved:** deliver genuine style and character contact sheet, a documented recommended direction and precise `AWAITING_ART_STYLE_APPROVAL`; do not claim accepted CG.

**If art style approved and pilot integrated:** four source images with provenance and matching fixed-canon actor identities, verified map, current-HEAD runtime screenshots, independent pixel verdict, passing scoped runtime/test gates. Keep unimplemented scenes on placeholders and report `BLOCKED_ART_PRODUCTION` for complete EP1/full season.

After completing whatever stages are genuinely possible, commit and push to `main` when clean and safe; no force-push, no publication. Do not fabricate capability evidence or human tester feedback.

## Report

Source and final HEAD; approved or provisional visual direction; character reference hashes; four CG statuses and original image paths; scene → asset mapping; source/runtime pixel review and viewports; preload/crossfade performance; exact automated results; scoped art gate; blockers; and one next step for owner review.
