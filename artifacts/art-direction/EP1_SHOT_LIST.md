# EP1 — Production Art Pilot / Shot List v0.1

**Source:** `narrative/graph.json` at 2026-10-13, 18 scenes / 4 choice points / 8 choice options.  
**Scope:** four pilot CG plus approved character reference sheets; other art remains placeholder until a separate batch.  
**Status:** `PLANNED_NOT_GENERATED`. All scene-to-asset mappings below are desired targets, **not implemented runtime mappings**.

## 0. Before any CG

1. Read `ART_BIBLE.md` and `VISUAL_LANGUAGE.json`.
2. Draft one cohesive **location continuity map** covering gate → lobby/office → kitchen/service → waterfront/quay → evening office.
3. Explore up to 2–3 art styles in a tiny contact sheet, choose exactly one direction and record owner/independent review.
4. Produce main cast reference sheets for Nika, Matteo, Elio, Leo in one consistent style; provide front/3⁄4/profile, expressive closeup and EP1 outfit, identity labels *outside images*, provenance and sha.
5. Obtain explicit visual-reference approval; do not independently invent canonical irreversible attributes such as exact hair color if source canon does not provide them.

## 1. Bounded pilot assets

| ID | Intended runtime beat | Cast | Location/time | Canonical action and essential prop | Why this shot |
|---|---|---|---|---|---|
| `ep1-arrival-cg` | `ep1_arrival` | Ника | Villa Serena exterior; morning | Nika just left taxi at gate with luggage; sea/stone/lime setting | Establish character, location and restrained sadness |
| `ep1-matteo-gate-cg` | `ep1_gate`, `ep1_matteo_formal_response`, `ep1_matteo_direct_response` | Ника, Маттео | Hotel gate; morning | Matteo holds keys and document folder, Nika is working professional; distinct postures | First romantic dynamic; both standing naturally on paving |
| `ep1-elio-kitchen-cg` | `ep1_kitchen`, `ep1_elio_humor_response`, `ep1_elio_boundary_response` | Ника, Элио | Working kitchen; same day | Elio offers welcome with coffee/tea, kitchen in real use; closeness voluntary | Contrast warmth/humor with Matteo; keep room geometry plausible |
| `ep1-leo-harbor-cg` | `ep1_leo_entrance` | Ника, Лео | Far quay at dusk | Leo holds blueprint tube under elbow; mutual surprise, physical pier and water boundary clear | Prior intimacy + eight years of unresolved history; no Aurea mark revealed |

### Nonpilot distinct locations / shots: plan only

| Visual family | Primary scenes | Canonical setting | Priority after pilot |
|---|---|---|---|
| `ep1-lobby` | `ep1_matteo_welcome` | Cool interior, stone, guest photos | B |
| `ep1-matteo-office` | `ep1_work_briefing`, `ep1_hotel_crisis`, `ep1_hotel_numbers_response` | Financial papers, booking table, red folder; exact shown evidence matches route | B |
| `ep1-staff-laundry` | `ep1_hotel_staff_response` | Laundry and staff meeting with Giulia | B |
| `ep1-harbor-afternoon` | `ep1_harbor_walk` | Elio/Nika by the waterfront after lunch | B |
| `ep1-leo-night` | `ep1_leo_choice`, `ep1_leo_hear_response`, `ep1_leo_distance_response` | Quay after dusk; Leo and Nika optional conversation; refusal composition must not imply unwanted intimacy | B |
| `ep1-last-page` | `ep1_hook` | Nika in hotel office / dark corridor, sealed mystery folder and Matteo warning; no harbor art | B |

**Critical: `ep1_hook` currently uses `night` placeholder; never substitute Leo quay artwork for night office.** Planned changes to the asset IDs / mapping must follow actual dialogue and `narrative/graph.json` with no silent plot modification.

## 2. Shot-specific composition notes

- **Arrival:** Nika's suitcase and gate anchor location. Her face visible; leave room for UI. Avoid introducing a readable/incorrect Italian town name or hotel facade wholly different from later gate/lobby.
- **Gate:** 2 people both identifiable and of plausible scale, both feet/ground contact or intentional mid-thigh crop. Keys/folder belong to Matteo, not Nika unless later text explicitly says otherwise. Keep hands plausible.
- **Kitchen:** Elio clearly a working cook; no random flambé or extra cooking actions. No food held in impossible ways. Respect boundary choice later: the image must not pre-impose intimacy inconsistent with either option.
- **Quay:** Architect blueprint tube, facial tension, visible paved pier waterline; no floating feet or waist submerged in ocean; Nika/Leo not already embracing.

## 3. Delivery contracts

Each generated image/variant has a separate record of prompt, reference IDs, generator or source, permission/provenance, content checksum, dimensions, source scene(s), beat, review decisions and asset version.

- Human figures: no malformed hands/legs, proportion drift, inconsistent hair/eyes, erroneous age.
- Full-scene CG with consistent people/place perspective rather than unrelated sprite compositions.
- Prefer one well-chosen portrait CG with proper framing for mobile. Separate mobile source composition only for proven viewport clipping; do not distort characters or mask source failures with CSS.
- Actual device crop: 360×640, 390×844, 430×932; desktop 1920×900 only as supported by the runtime. Test gameplay UI with longest RU and EN lines, choices visible, Back and Next accessible.
- Production graphics should be credited/licensed appropriately, no watermarks/gibberish embedded lettering.
- Pilot acceptance: four CG independently checked at full source pixels and current-HEAD runtime screens, all causal scene mappings valid, actual screenshots hashed, no critical defects, one small bounded repair pass as needed.
- Preload/slow network: decoded next frame replaces last; no black flash/race/regression. `prefers-reduced-motion` respected.
- Contact sheet: must contain actual reviewed images side by side, not a text-only checklist. Until it exists, mark `NOT_YET_PRODUCED`.

## 4. Scope control

**Do not** generate EP2–EP10 art, marketing covers, audio, currency UI, backgrounds for the full season, or art for the six nonpilot scene families as part of the first pilot. Once the four shots are accepted, schedule second EP1 batch.

**Do not claim:** an approved art bible means pixels exist, source references were delivered, Web High was run, or Concept Proof human-sessions are verified.

**Gate:** `PILOT_ART_REVIEW_READY` only after true production images integrated and screenshot evidence created. If art generation/review capability absent, report `BLOCKED_ART_PRODUCTION` precisely and stop at documented Art Bible/reference design.
