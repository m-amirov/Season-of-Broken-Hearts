# Stage 9.4 — native image dimensions contract correction

**Decision:** `PASS_STAGE9_4_DIMENSION_SPEC_RECONCILIATION` (specification only).
**Scope:** EP2–EP3 production art; never retroactive art acceptance.
**Canonical project config:** `config/production-art-dimensions.json`.

## Root cause

The Stage 9.4 production manifest mistakenly made the aspirational
`1920×1080` CEOS desktop CG **target** a mandatory exact PNG raster. CEOS
`docs/NARRATIVE_DUAL_FORMAT_ART.md` instead accepts desktop CGs from
`1280×720` near 16:9 and separately states `1920×1080` as the target.
All ten accepted EP1 desktop CGs recorded in
`stage8-wardrobe-rework-dual-format-manifest-final.json` use `1672×941`.
The actual S19 native landscape candidate was also `1672×941` and
incorrectly failed a checker invoked with `--width 1920 --height 1080`.

The original rejection was a real result **against that older contract**;
do not edit or relabel the immutable failure evidence.

## Correct requirements

| Surface | Dimension | Verification |
| --- | --- | --- |
| Portrait native PNG | 1024×1536 | exact `art-output-verify --width 1024 --height 1536` |
| Independent landscape native PNG | 1672×941 (near 16:9) | exact `art-output-verify --width 1672 --height 941` |
| CEOS landscape admissible minimum | 1280×720 near 16:9 | upstream dual-format standard; not a replacement for our declared exact source dimensions |
| Desktop runtime viewport | 1920×1080 and other requested captures | browser screenshot/viewpoint validation, not PNG pixel-size matching |

Never crop/resize/stretch portrait into landscape. Do not alter CEOS's decoder,
pixel tests, SHA checks, source integrity, review severity or acceptance gates.

## S19 recovery steps (not yet performed here)

1. Confirm the original generated landscape PNG still exists at the
   host-reported path in
   `S19-batch1-native-generation-ledger.json`.
2. Read its actual PNG bytes, dimensions and SHA-256. Expected SHA-256:
   `17b0e45c73865b7f12cd79c29b68340653870ce0f519c0b593b1ba66a4338299`.
   If missing, changed or corrupted, fail closed — do not invent replacement evidence.
3. Preserve the original failed receipt:
   `receipts/S19-ep2-office-morning-brief-landscape-candidate1-failure.json`.
4. Run a **fresh** `ceos art-output-verify --project . --file <preserved-file>
   --kind background --width 1672 --height 941 --receipt <new-S19-recheck-receipt.json> --json`.
5. Only after a genuine `PASS_ART_OUTPUT_MECHANICAL`, copy the exact verified
   native PNG into the project, bind its SHA-256 and dimensions in the live
   asset manifest, and check the separately preserved portrait.
6. Do not claim a completed pair, integrated runtime image, or
   `NARRATIVE_ART_ACCEPTANCE_V2` PASS until the remaining respective gates
   and actual pixel reviews succeed.

The earlier blocked production-art run and receipts remain historical.
A new or properly resumed run must follow CEOS checkpoints and producer
budgets as actually supported. This spec correction requires no new Image Gen
call. It does not authorize a reset of generation/rework budgets.

## Changed scope

- `config/production-art-dimensions.json`: project-owned dimensions and gate commands
- `artifacts/production-art/stage9.4/PRODUCTION_ASSET_MANIFEST.json`: current native contract; historical S19 rejection retained
- `artifacts/production-art/stage9.4/SOURCE_BOUND_ART_BRIEFS.json`: source PNG vs runtime viewport clarified
- `artifacts/production-art/stage9.4/WEB_HIGH_V2_ACCEPTANCE.json`: outstanding check refers to corrected project spec
- `docs/season/PRODUCTION_ART_PLAN.md`, `PROJECT_RULES.md`: authoring and engineering guidance
- `tests/unit/production-art-dimensions.test.mjs`: regression assertions

**Remaining blockers:** S19 landscape requires a new actual-byte gate;
the 25 planned dual-format pairs are not all generated/accepted; zero Stage
9.4 runtime screenshot or independent Web High V2 pixel acceptance has been
obtained. PR #6 remains Draft; no merge/publication.
