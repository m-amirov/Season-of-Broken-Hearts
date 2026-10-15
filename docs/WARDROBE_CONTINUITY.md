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
