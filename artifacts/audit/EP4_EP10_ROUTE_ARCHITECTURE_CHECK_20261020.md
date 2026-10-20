# EP4–EP10 route architecture check — 2026-10-20

## Verdict

`BLOCKED_NOT_IMPLEMENTED`.

The architecture contract is internally shaped for 10 episodes, four routes, seven relationship endings, three hotel outcomes and 21 legal ending pairs. The executable graph contains no EP4–EP10 scenes, so the contract is not yet a playable route architecture.

## Evidence

- Current source freeze: `a6fec5488f26ae58a8775f07b0b49a95cb893cf4`.
- `narrative/graph.json`: 50 scenes total — EP1 18, EP2 17, EP3 15, EP4–EP10 0.
- Current graph has 44 choices and no `route` or `routeLocked` effects.
- `narrative/episodes/manifest.json` lists EP2–EP3 as authored and EP4–EP10 as planned.
- Architecture promise ledger references 22 scene IDs; 16 are absent from the current graph, including `ep4_cut_list`, `ep5_elio_offer`, `ep6_terms_read`, `ep9_public_forum` and the EP10 final/payoff scenes.
- `season-architecture.json` itself declares `sourceHead=476d71b6`, which is the architecture contract's historical reference and does not match the current local source freeze; it is therefore treated as a plan input, not current executable evidence.

## Route findings

| Contract | Current evidence | Status |
|---|---|---|
| EP6 explicit route lock | `ep6_route_choice` absent; no route effects | NOT_STARTED |
| Matteo / Leo / Elio / Independent paths | No executable EP4–EP10 scenes | NOT_STARTED |
| 7 relationship endings | Definitions only in architecture JSON | NOT_STARTED |
| 3 hotel outcomes | Conditions/payoffs only in architecture JSON | NOT_STARTED |
| 21 legal ending pairs | No executable ending resolver or final fixtures | NOT_VERIFIED |
| Pre-EP6 route invariant | Current EP1–EP3 graph keeps route open | PASS_SCOPED |
| State-domain separation | Declared in architecture; future runtime effects absent | PASS_SCOPED |

## Required continuation

1. Author and validate EP4–EP5 shared-core scenes in RU/EN.
2. Implement the informed EP6 route choice and save/state effects.
3. Author and connect EP7–EP10 route-conditioned scenes and payoff IDs.
4. Run route exploration and final-state save round trips only after the executable graph exists.

No source, runtime, narrative, EP2 evidence or image files were changed by this check.
