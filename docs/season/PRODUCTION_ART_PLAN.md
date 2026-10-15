# Production Art Plan — EP2–EP10

Статус: planning only. EP1 production CG остаются принятыми и не
пересоздаются. Ни один новый PNG не генерируется в Phase 9.1.

## Art gates and order

For every new scene family:

1. accept the corresponding authored script batch and scene contract;
2. freeze location, time of day, wardrobe, character identity and focal point;
3. create a source-bound brief with portrait 2:3 and desktop 16:9 composition
   where the runtime requires both formats;
4. verify provenance and file dimensions mechanically;
5. integrate into a clean runtime and capture current-HEAD pixels;
6. run the independent visual acceptance under `NARRATIVE_ART_ACCEPTANCE_V2`;
7. accept, rework or block the family without calling mechanical output PASS a
   substitute for visual acceptance.

Native image generation is not invoked until a fresh CEOS capability challenge
attests the current run and the applicable script batch has passed narrative
acceptance. No asset budget is reset by this plan.

## Reuse and new visual families

| Family | Episodes | Reuse | New requirement |
|---|---|---|---|
| Villa daylight / office | EP2–EP10 | EP1 location canon and palette | new business documents must read in runtime UI |
| Wedding preparation | EP2, EP4 | Villa architecture | formal wardrobe continuity for Nika/Matteo/family |
| Bianca / investor meeting | EP2, EP6, EP9 | character identity reference | Bianca must read as a business principal, not villain styling |
| Leo survey / archive | EP3, EP7–EP9 | harbor/stone canon | drawings and tools must support plot, not become decorative mystery |
| Staff pressure / service corridor | EP4, EP5, EP8–EP9 | staff wardrobe rules | multiple staff positions remain distinguishable |
| Night kitchen / Elio route | EP5, EP7–EP10 | kitchen location canon | warmth without turning work into generic romance backdrop |
| Matteo route | EP7–EP10 | shared Villa locations | ledger, delegation and public forum stage each need distinct framing |
| Leo route | EP7–EP10 | archive/old port | route-specific spatial continuity and heritage evidence |
| Independent route | EP7–EP10 | event locations | Nika is visually active, not a spectator to other routes |
| Anniversary / departure | EP9–EP10 | Villa and harbor | celebratory image must retain financial tension and aftermath |

## Scene-family inventory target

The first art brief set should cover approximately 18–24 unique narrative
families, not one CG per line. Exact count is frozen after script batches:

- 5 common business/location families;
- 3 wedding/investor families;
- 3 Leo survey/archive families;
- 3 Elio kitchen/service families;
- 4 route-specific intimate/future families;
- 2 anniversary/departure families.

Any scene that can be conveyed by the approved location background and dialogue
does not receive a new CG by default. Any new CG must have a visible narrative
function and a matching runtime cue.

## Wardrobe continuity

Use the existing EP1 identity and wardrobe matrix as immutable reference. Add
families only for the defined timeline: `wedding-prep`, `wedding-formal`,
`survey-day`, `kitchen-service`, `route-date`, `business-meeting`,
`anniversary`, `departure`, `epilogue`. A route may vary styling inside a
family, but cannot jump from service shift to formal anniversary without a
transition scene and authored time passage.

## Provenance and acceptance records

Each asset record must include source brief ID, route/scene IDs, creator/tool
route, rights status, source hash, dimensions, format pair, integration path,
runtime screenshot hashes and visual verdict. Missing pixels, stale screenshots
or an unverified producer route are `BLOCKED`, not `PASS`.
