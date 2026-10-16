# Stage 9.3 remediation packet

Target: EP2–EP3 literary hardening before production art.

In scope: `narrative/episodes/ep-02.json`, `narrative/episodes/ep-03.json`, the matching timeline/arc/promise documentation, focused narrative tests and measurement evidence.

Out of scope: EP1 prose and accepted EP1 CG, EP4–EP10 authored content, image generation, publication, deployment, release packaging and unrelated worktrees.

Confirmed defects to repair:

- `EP2-CONSENT-01` (P1): contract consent, public gesture consent and refusal are conflated at `ep2_public_agreement`; refusing a photo writes `publicAgreement=declined` while leaving `fakeDatingStatus=active`.
- `EP2-BOUNDARY-02` (P1): no explicit seven-day agreement close exists, so the state can imply continuation across EP3 and the day-17–23 wedding block.
- `EP2-AGENCY-03` (P1): refusal of the agreement has no authored consequence path; the current graph only accepts two agreement variants.
- `EP2-DEPTH-04` (P1): work competence, live wedding preparation, Giulia's independent goal, staff impact and the cost of performance are asserted in compact exposition rather than dramatized actions.
- `EP3-PROVENANCE-05` (P1): `ep3_aurea_drawing`, `ep3_matteo_confrontation` and `ep3_transition` can speak as if the appendix was verified on routes that only observed a drawing.
- `EP3-ACCOUNTABILITY-06` (P1): the accountability choice lacks a concrete-action branch and marks `leoTruthHeard` even when Nika keeps the personal part closed.
- `EP3-DEPTH-07` (P1): Leo's explanation is concentrated in one confession scene; the survey does not yet create a professional conflict with observable consequences.
- `CONTINUITY-METADATA-08` (P2): revised EP2/EP3 transitions lack the calendar/location/presence/knowledge metadata required by the season continuity contract.

Acceptance: no unresolved P1 in the listed scenes; all new state keys are used by reachable dialogue or tests; EP1 is byte/content stable; the graph remains reachable and route-neutral before EP6; the independent review is separately recorded.

Non-goals: inflate word count without a scene change, alter the season's route architecture, create or regenerate images, or retroactively excuse Leo's decision to leave.
