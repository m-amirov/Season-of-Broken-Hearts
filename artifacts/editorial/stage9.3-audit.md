# Stage 9.3 — EP2–EP3 narrative audit (baseline)

Status: `CONFIRMED_DEFECTS_RECORDED`

Scope: EP2 and EP3 authored fragments, RU/EN player-visible dialogue, state effects, chronology, knowledge provenance, route reachability and save-relevant transitions. EP1 prose and accepted EP1 art are protected.

Baseline source: `16e53a7cd4ca3a49c515565bf2606a10911f53fd` on `codex/stage9-full-season-architecture`.

## Native evidence

- `ceos --version`: 0.5.18.
- Git preflight: `IN_SYNC`; remote `origin/codex/stage9-full-season-architecture` equals the baseline HEAD; worktree was clean before the audit run.
- `npm run narrative:validate`: PASS_DECLARED_NARRATIVE_GRAPH; 39/39 scenes reached, 3,124 validator states, 23 save fixtures. The promise warnings are expected planned/full-season gaps, not proof of literary acceptance.
- `node tools/narrative/graph-build.mjs --check`: PASS_GRAPH_BUILD_DETERMINISTIC.
- Direct `exploreGraph(graph, { maxStates: 100000 })`: 17,910 visited states, 512 terminals, 39/39 scenes, 0 dead ends, 0 graph errors, no route lock before EP6.
- Reproducible lexical baseline (the report regex counts Cyrillic/Latin alphanumeric tokens): EP1 18 scenes / 8 choices / RU 2,031 / EN 2,465; EP2 11 / 10 / 853 / 1,001; EP3 10 / 8 / 682 / 831.
- CEOS web preflight: `READY`; independent review is a separate evidence domain and not represented by this local audit.

## Scene-by-scene audit

| Scene | Current dramatic function | Confirmed defect / risk | Repair direction |
|---|---|---|---|
| `ep2_morning_brief` | Opens day 2 and introduces the request. | Nika's work is described as a list, but no task is performed. | Put a live scheduling/stock problem in her hands and let her make the first professional call. |
| `ep2_wedding_budget` | Presents open-versus-improvise budget choice. | Choice is meaningful but its consequences are mostly numeric; no immediate staff action follows. | Add a workday follow-through and expose the human cost of the reserve cut. |
| `ep2_family_rehearsal` | Shows family rehearsal and Giulia. | Giulia is mostly a reaction to Matteo; her own wedding priorities are not actionable. | Give Giulia a decision about the ceremony and a visible consequence. |
| `ep2_fake_terms` | Presents the seven-day agreement. | Only two forms of acceptance exist; there is no full contract-refusal branch. | Add a refusal branch that preserves Nika's job and professional collaboration. |
| `ep2_bianca_arrives` | Introduces Bianca and Aurea. | Business case is promising but the accepted/refused agreement state is not separated. | Keep Bianca's rational offer, with distinct entry context for refusal. |
| `ep2_bianca_professional_response` | Gives a professional response. | Short reaction only; no concrete deliverable is shown. | Tie the scene to a checkable table and Bianca's investment criteria. |
| `ep2_bianca_pushback_response` | Lets Nika challenge Bianca. | The pushback is verbal and merges immediately. | Add a document/price action and preserve Bianca's valid counterargument. |
| `ep2_public_agreement` | Asks permission for a public gesture. | `publicAgreement=declined` currently means refusal of a photo/hand gesture while `fakeDatingStatus` remains active; contract consent and physical consent are conflated. | Separate contract status from gesture status and add a visible refusal response. |
| `ep2_rehearsal_failure` | Uses a broken dessert fridge as action. | The failure is good material, but the response is almost identical across consent paths. | Make the cost of public performance and Nika's professional intervention branch-sensitive. |
| `ep2_rooftop_after` | Debriefs the day and asks for boundaries. | No explicit close of the seven-day window; accepted agreement can remain active into EP3/EP4 by state. | End the agreement on day 9 through the branch choice; preserve only separately consented future talk. |
| `ep2_transition` | Teases Aurea's land valuation. | The line assumes a uniform agreement history and jumps to a 70-day deadline without documenting the day-9 boundary. | Add conditional closure language and explicit day/location/knowledge metadata. |
| `ep3_old_photo` | Opens Leo's past. | Strong boundary line, but still mostly a symbolic photo exchange. | Add an archival task and make the photograph compete with a real work deadline. |
| `ep3_survey_start` | Offers join/decline professional survey choice. | Choice premise is clear; downstream action is too thin. | Keep both branches and give each a different work consequence. |
| `ep3_survey_join_response` | Confirms professional distance. | No concrete finding or conflict of interest is observed. | Add a site problem and force Leo to document it. |
| `ep3_survey_decline_response` | Protects Nika's distance. | Refusal is respectful but has no report-review action. | Add a delivered report and a checkable finding without requiring intimacy. |
| `ep3_eight_years` | Leo explains leaving and silence. | The key account is concentrated in one confession; responsibility is stated more than tested. | Keep the admission but make it follow distinct professional actions and lead to an action choice. |
| `ep3_accountability_choice` | Lets Nika listen or distance herself. | It lacks the required concrete-action option; `leoTruthHeard` is set identically even when she refuses the personal part. | Add listen / demand action / distance, with separate repair state. |
| `ep3_aurea_drawing` | Shows the Aurea mark. | It sets `leoAureaLinkKnown` before verification and calls an appendix a fact on every route. | Split visible lead from verified terms and make provenance explicit. |
| `ep3_matteo_confrontation` | Shares the finding with Matteo/team. | Only two choices exist and both presume the same evidence; no conditional route for unverified material. | Add verified/unverified disclosure choices and retain private-processing option. |
| `ep3_quiet_return` | Allows a non-romantic pause. | Its “after the admission” language does not fit distance/unverified routes. | Use conditional dialogue keyed to accountability/evidence. |
| `ep3_transition` | Names Aurea as the cliffhanger. | “We found the appendix” leaks knowledge on the drawing-only path. | Use terms-specific and lead-specific transition lines. |

## Remediation contract

1. Preserve EP1 scene IDs/content, EP6 as the only route lock, and separate trust, relationship, hotel evidence and knowledge domains.
2. Make the Matteo public agreement explicitly active only for the bounded EP2 window (days 2–8), close it on the day-9 transition, and never imply continuation into EP3/EP4 without a new explicit consent event.
3. Add distinct refusal and consent consequences that remain compatible with Nika's employment, professional collaboration and later romance routes.
4. Add actual work actions, staff/Julia interests, Bianca's defensible business case, Leo's survey role, evidence verification and route-conditioned dialogue.
5. Add scene chronology metadata (`day`, `location`, `presentCharacters`, `knowledgeDelta`) to revised EP2/EP3 scenes and update the season documents.
6. Add deterministic measurements and tests for branch coverage, knowledge provenance, consent closure, save v3→v4, Back, locale, New Game and no early route lock.

Independent Web High review is pending and may add or reject editorial findings. This baseline artifact is not an independent verdict.
