# Batch A — EP2–EP3 Narrative Production

Статус: `PASS_STAGE9_EPISODE_BATCH` для authored narrative/runtime batch; независимая editorial receipt заблокирована инфраструктурой review и не подменяется этим отчётом.

Дата: 2026-10-15

## Coverage

- EP2: 11 scenes, 10 choices, days 2–9. The voluntary seven-day public arrangement and Bianca's professional role are explicit; public gestures require a current consent choice.
- EP3: 10 scenes, 8 choices, days 10–16. Leo's eight-year account, accountability choice, Aurea connection and evidence handling are separate decisions.
- Total graph after build: 39 scenes (EP1 18 + EP2 11 + EP3 10), 2 intermediate episode-end nodes plus the final Batch A ending, 18 new choices.
- Every authored scene contains RU and EN dialogue with equal line counts. No route is selected or locked in EP2–EP3.
- Bianca is represented as a business character with terms, evidence and professional boundaries, not as a romantic antagonist.

## Causality and consequences

- EP2 budget handling changes `staffTrust`, `fundingEvidence` and `hotelEvidence` before the public arrangement.
- Agreement terms, public consent, boundary clarity and future talk are separate state keys; romance is not inferred from a public performance.
- EP3 survey participation, accountability, evidence publication and privacy produce distinct state consequences.
- `leoAureaLinkKnown` is established through the scene choice in EP3 and is not available in earlier scenes.
- All four routes remain unavailable until the planned EP6 route-lock; current Batch A terminals report `route=none`.

## Verification

| Check | Result |
| --- | --- |
| Source fragments | PASS: `narrative/episodes/ep-02.json`, `ep-03.json` |
| Deterministic graph build | PASS_GRAPH_BUILD_DETERMINISTIC |
| Batch A scene reachability | PASS: 21/21 new scenes visited |
| RU/EN authored parity | PASS: every new scene has both locales and equal line counts |
| Runtime continuation | PASS: EP1→EP2→EP3 via `continueEpisode()` |
| Save/load at EP3 terminal | PASS |
| Route-lock timing | PASS: route remains `none`, `routeLocked=false` |
| Existing tests | PASS: 72/72 |
| Narrative validation | PASS_DECLARED_NARRATIVE_GRAPH with inherited planned-promise warnings |
| Production CG | NOT STARTED by design; no placeholder PNGs or false art PASS |
| Asset mapping/runtime visual readiness | BLOCKED until 21 source-bound EP2–EP3 asset IDs are produced and admitted; no placeholder mapping added |
| Web High editorial review | `BLOCKED_STAGE9_WEB_TRANSPORT`: two bounded attempts disconnected before confirmation; no independent PASS claimed |

The inherited promises `matteo-negotiation-documents`, `elio-restaurant-departure` and `season-hotel-outcome` remain planned for later episodes and are not falsely marked fulfilled by Batch A.

## Gate boundary

This batch is authored and engine-integrated. Native structural review is recorded separately; it is not a substitute for the blocked Web editorial receipt or human blind playtest. This is not a full-season acceptance, not a production-art acceptance, and not a publication or Yandex submission authorization. New visual assets require the separate source-bound art brief, current CEOS capability challenge and later V2 acceptance.
