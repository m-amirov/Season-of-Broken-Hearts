# Wardrobe continuity contract

`WARDROBE_CONTINUITY_V1` is a mandatory project rule for all production art in
the `narrative-game` profile. It is enforced by
`tools/narrative/wardrobe-continuity-check.mjs`, not treated as an optional art
note.

## Character identity

Each recurring character has an independent palette, silhouette, formality and
signature props in `config/wardrobe-rules.json`. Nika and Matteo must never read
as two versions of the same pale linen uniform: Nika uses relaxed, soft,
understated Mediterranean separates, while Matteo uses darker, structured,
controlled masculine tailoring. Elio's kitchen identity is a white apron or
white chef uniform with clear kitchen action and props. Leo uses a quieter,
architectural field-work silhouette and remains distinct from Matteo.

## Scene logic

Every CG family declares wardrobe for every involved character, its accessories
and props, and an explicit continuity type: `new-outfit`, `same-outfit`, or
`variant-of-previous`. Adjacent cues may retain clothing when no time break is
authored. A new location, time of day, temperature/atmosphere, social context or
long duration requires a justified change or visible variation.

Shared-scene contrast is mandatory in colour, cut, texture and costume role.
Portrait and landscape versions preserve the same wardrobe facts and props while
using independent safe compositions. The two formats are not allowed to drift
into different character identities or scene meanings.

## Authoring requirement

The source of truth for EP1 is
`artifacts/production-art/ep1-wardrobe-continuity-matrix.json`. New episodes
must add the same declarations to their production-art brief before generation.
The validator is part of `npm run narrative:validate`; missing declarations are
a hard failure.

## New production: independent wardrobe pixel acceptance

`WARDROBE_VISUAL_ACCEPTANCE_V1` is a **separate, fail-closed gate** on real
original PNGs and desktop/mobile runtime pixels. Static
`WARDROBE_CONTINUITY_V1` remains mandatory: it checks briefs, **not** what
Terra actually drew. Do not count a generated or mechanically verified PNG as
artistically accepted without independent pixel evidence.

For each new production art pair, prepare a project-relative packet containing
the existing DEV Web High `request` (`schemaVersion`, `sceneId`,
`sourceHead`, `context`, and image refs/paths/SHA-256), plus:

- `ruleId: "WARDROBE_VISUAL_ACCEPTANCE_V1"` and `schemaVersion: 1`;
- `requiredCast`, e.g. `["nika", "giulia"]`;
- `evidenceRoles`: `portraitOriginal`, `portraitRuntime`,
  `landscapeOriginal`, `landscapeRuntime`, and
  `characterReferences` mapping each cast ID to an attached canonical reference
  ref (DEV transport accepts that attachment as `kind: "original"`);
- `adjacentScenes` with `sceneId`, `transition` (`continuous`,
  `time-break`, or `context-change`), `characters`, a
  `evidenceRef` when `continuous`, and an explicit `reason` for a break.

All pixel refs must be unique and physically attached to the same DEV reviewer
turn (max 10 images). If more comparisons are needed, split into separate
independent scoped reviews; never silently declare unobserved neighbors PASS.
Adjacent scenes in which the same character continues without a real time break
must preserve the outfit unless an authored change explains it. A legitimate
staff uniform or same-day outfit repeat **is not a defect**.

Append the instructions produced by
`buildWardrobeWebReviewAddendum(packet)` from
`tools/production-art/wardrobe-visual-gate.mjs` to
`packet.request.context` **before** the DEV Web High call. The independent
reviewer should supply `wardrobeAssessments` in its single JSON response:
for each cast member, concrete portrait/landscape observations, comparison
against the attached canonical reference, cross-format assessment, adjacency
and repetition reasoning, four explicit status fields, and refs to the pixels
actually received. Copy neither the owner's opinion nor brief text into those
observations. These are extra fields in the raw reviewer response; the standard
DEV acceptance receipt still carries its existing V2 fields.

After DEV returns a receipt and raw response, run:

```sh
npm run wardrobe:visual:verify -- --project . --packet artifacts/evidence/<packet>.json --receipt artifacts/evidence/<web-receipt>.json --raw artifacts/evidence/<web-raw>.txt
```

The gate binds the raw reviewer response to the Web receipt's response hash;
rechecks all image bytes, refs, canonical references, exact project Git HEAD,
all four image roles, independent cast-level observations and evidence linking.
Any missing evidence or material identity/wardrobe inconsistency is
`NOT_VERIFIED_WARDROBE_VISUAL_ACCEPTANCE`, not a fabricated PASS. Always
run the existing CEOS `web-review-verify` independently as well; this gate
adds wardrobe-specific checks and does not replace provenance/transport trust.

### Severity and production policy

Treat a wrong person, wrong apparent age, wrong canonical hair/face, or a
costume that contradicts an essential continuity beat as P0/P1 when it
materially affects the player. Report minor color/texture preferences as
advisory P2/P3. Screen any repeated outfit against day, shift, weather, location
and role before requesting another costly Terra generation.

Existing accepted EP1/EP2 receipts and canonical images remain immutable;
the new gate applies prospectively to new production reviews. It does not
retroactively invalidate prior Web acceptance, nor does a local-only test
constitute actual Web High delivery.
