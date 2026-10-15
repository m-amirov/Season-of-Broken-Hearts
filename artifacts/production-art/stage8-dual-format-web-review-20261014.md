# Stage8 EP1 dual-format Web High review

- Source HEAD: `57027e2c4b2654c00350b0ebf4406d20fe8d3762`
- Review role: `ceos_art_director_web`
- Review scope: representative Arrival and Elio Kitchen portrait/desktop pairs; current mechanical manifest summary
- Mechanical context: 18/18 scenes mapped, 10 families, 17 variant files checked, three missing desktop variants
- Review verdict: `PARTIAL_CANON_READY`

## Findings

- Arrival: scoped character/location coherence pass; dialogue-panel overlap risk around the low suitcase area requires runtime verification.
- Elio Kitchen: character identity is coherent, but the portrait and desktop interiors differ enough to require a location-continuity check; the knife pose is a possible emotional-staging risk against the authored cue.
- EP1-wide canon: `NOT_VERIFIED`; only 2 of 10 families were reviewed in this bounded turn.
- Desktop artistic acceptance: `NOT_VERIFIED`.
- Runtime visual acceptance: `NOT_VERIFIED`.

## Required before final acceptance

1. Generate and mechanically verify desktop variants for `ep1-leo-harbor-cg`, `ep1-leo-night-cg`, and `ep1-hook-cg`.
2. Compare Elio Kitchen staging against the exact authored cue and verify whether the portrait/desktop kitchen differences are valid alternate angles of one location.
3. Run current-runtime pixel acceptance for all 10 families at `1920x900`, `390x844`, and `360x640`, including resize switching, stale-request protection, dialogue overlap, and no black frame.

This review is advisory Web evidence only. It does not attest generated files, mechanical integrity, or final production-art acceptance.
