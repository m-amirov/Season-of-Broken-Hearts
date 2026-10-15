# Stage 9.4 Production Art Inventory — EP2–EP3

Статус inventory: `PASS_STAGE9_4_ART_INVENTORY_OPTIMIZED`

Source HEAD: `5ac58032d314103059977014c8168988529b9f6f`
Editorial evidence: EP2/EP3 authored hashes and canon hashes match the current checkout. The independent Stage 9.3.2 receipts cover targeted changed scopes only; they are not reused as art acceptance.

## Coverage

| Metric | Result |
|---|---:|
| EP2 scenes | 17 |
| EP3 scenes | 15 |
| Total scenes | 32 |
| Existing approved EP1 pairs reused | 0 |
| New CG families | 24 |
| New background-only families | 0 |
| Conditional variant rows | 2 (accepted hand / refused hand) |
| Shared `NO_NEW_ART` rows | 7 |
| Planned production pairs | 25 (portrait + landscape) |
| Planned PNGs | 50 |
| Production art generated | 0 — pending capability challenge |

## Method and reuse result

The actual EP1 PNGs were decoded/inspected, including the office, harbor and staff references, and their current byte hashes were compared with `narrative/assets.json`. The accepted EP1 frames do not satisfy the EP2–EP3 combinations of location, cast, day/context, wardrobe, action and plot knowledge. Placeholder SVGs were excluded. No existing asset is therefore promoted to `REUSE_APPROVED`.

All static dialogue beats with authored characters use unified full-scene CG families. No sprite renderer is introduced. The inventory intentionally groups immediate continuations where the same cast, wardrobe, location and physical setup remain truthful; it keeps the consented and refused public hand gesture as separate conditional variants because reusing one would contradict the player's choice.

## Family plan

| Family ID | Episode | Scene IDs | Format plan | Narrative purpose |
|---|---:|---|---|---|
| `ep2-office-morning-brief-cg` | 2 | `ep2_morning_brief` | pair | Establish day-2 wedding-work pressure, duplicate invoices and Giulia's presence |
| `ep2-office-budget-cg` | 2 | `ep2_wedding_budget` | pair | Make the staff-reserve choice legible through documents and distance |
| `ep2-service-inventory-cg` | 2 | `ep2_workday_inventory` | pair | Show the service corridor and labor cost behind the budget |
| `ep2-courtyard-rehearsal-cg` | 2 | `ep2_family_rehearsal` | pair | Giulia reclaims her own plan amid chairs, flowers and rain cover |
| `ep2-dining-rehearsal-response-cg` | 2 | `ep2_family_rehearsal_response` | pair | Tablet/guest-card handoff and clear passage in the dining room |
| `ep2-dining-refusal-response-cg` | 2 | `ep2_refusal_response` | pair | Refusal preserves Nika's work and removes the couple label |
| `ep2-office-fake-terms-cg` | 2 | `ep2_fake_terms` | pair | Blank terms sheet, untouched pen and explicit consent boundaries |
| `ep2-service-refusal-workday-cg` | 2 | `ep2_refusal_workday` | pair | Rain plan and Giulia's own conversation with family |
| `ep2-bianca-arrival-cg` | 2 | `ep2_refusal_bianca_arrival`, `ep2_bianca_arrives` | pair | Bianca enters as an auditor/business principal, neutral to romantic state |
| `ep2-bianca-audit-cg` | 2 | `ep2_bianca_professional_response`, `ep2_bianca_pushback_response` | pair | Laptop expense list, investment/cuts and measurable criteria |
| `ep2-public-gesture-cg` | 2 | `ep2_public_agreement`, `ep2_public_refusal` | two conditional pairs | The only state-defining physical gesture: hand accepted vs hand refused |
| `ep2-service-rehearsal-failure-cg` | 2 | `ep2_rehearsal_failure` | pair | Dessert refrigerator failure and delegated operational response |
| `ep2-rooftop-after-cg` | 2 | `ep2_rooftop_after` | pair | Agreement closes and the personal question remains open |
| `ep2-office-aurea-transition-cg` | 2 | `ep2_transition` | pair | Land value, seventy-day deadline and post-wedding business reality |
| `ep3-archive-intake-cg` | 3 | `ep3_old_photo`, `ep3_survey_start` | pair | Old photo stays a boundary while the survey is agreed professionally |
| `ep3-west-wing-survey-cg` | 3 | `ep3_survey_join_response`, `ep3_survey_site_problem` | pair | Doorway, niche and operational constraint in the west wing |
| `ep3-service-staff-walkthrough-cg` | 3 | `ep3_staff_walkthrough` | pair | Staff route turns a plan into measurable labor |
| `ep3-office-report-path-cg` | 3 | `ep3_survey_decline_response`, `ep3_report_delivery` | pair | Report-awaiting/delivered path without romanticizing the exchange |
| `ep3-office-eight-years-cg` | 3 | `ep3_eight_years`, `ep3_accountability_choice` | pair | Eight-year account and present-action accountability |
| `ep3-west-wing-aurea-drawing-cg` | 3 | `ep3_aurea_drawing` | pair | A.H. mark remains an explicitly unverified lead |
| `ep3-archive-document-check-cg` | 3 | `ep3_document_check`, `ep3_document_check_response` | pair | Incoming-mail log and non-readable appendix verification |
| `ep3-office-matteo-confrontation-cg` | 3 | `ep3_matteo_confrontation` | pair | Nika controls disclosure order with Matteo and Leo |
| `ep3-office-quiet-return-cg` | 3 | `ep3_quiet_return` | pair | Leo exits; Nika keeps the photo and work folder without forgiveness |
| `ep3-office-aurea-transition-cg` | 3 | `ep3_transition` | pair | Bianca, Aurea record and west-wing light establish the next question |

Machine-readable scene/family mapping, reasons and source hashes are in [`ART_REUSE_MATRIX.json`](./ART_REUSE_MATRIX.json).

## Recovery optimization decision

The inventory remains at 24 visual families and 25 dual-format pairs after a
fresh current-HEAD review. Seven immediate continuation rows reuse an already
planned family; the two public-gesture states remain separate conditional
pairs because they encode opposite physical actions. No EP1 pair is reused:
the checked EP1 compositions do not simultaneously match the EP2–EP3 cast,
wardrobe, time, location and authored action. This is the smallest truthful
scope without replacing authored full-scene beats with sprites or changing the
accepted script.

## Protected invariants

- EP1 production PNGs and their runtime mappings are immutable in this stage.
- Bianca must read as a calm business principal; no villain styling or emotional shorthand.
- Giulia remains an active, competent worker and decision-maker, not decorative family furniture.
- Leo keeps the approved architectural field-work silhouette and does not become a second Matteo.
- No image may show verified Aurea terms before the authored document-check state.
- No image may show accepted touch when the player chose refusal.
- Portrait and landscape are separate compositions; neither is a crop or stretch of the other.
- No baked dialogue, UI, logos, watermarks, readable invented documents or extra cast.
