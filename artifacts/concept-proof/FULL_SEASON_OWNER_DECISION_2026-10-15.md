# Owner Decision — Full Season Production Without Pre-production Blind Playtest

**Decision date:** 2026-10-15
**Decision owner:** project owner (explicit user instruction: «принимаем риск»).
**Decision:** `CONTINUE_PRODUCTION` — full-season narrative/content development for EP2–EP10 is authorized.
**Exception code:** `OWNER_ACCEPTED_BLIND_PLAYTEST_RISK_2026_10_15`.
**Scope:** Season of Broken Hearts / production planning, writing, integration, and review of the remaining season; **not** publication, Yandex submission or a release-quality PASS.

## Evidence and risk

- Earlier decision: `artifacts/concept-proof/EP1_DECISION.md` (2026-10-13)
  authorized only a bounded EP1 art pilot. It remains a truthful historical
  record; this later owner decision **supersedes its production scope**.
- `artifacts/concept-proof/EP1_OBSERVATIONS.md` still has no completed
  independent human-reader sessions. Do not backfill any fictional results.
- `BLIND_PLAYTEST_FORMAL_PASS = NOT_ATTESTED`.
- `AWAITING_BLIND_PLAYTEST` is the truthful evidence state.
- Passing unit tests, runtime QA, Web High art acceptance, Codex reviews and
  positive informal feedback do not equal a three-person blind playtest.
- The owner explicitly accepts the product risk that reader comprehension,
  engagement, onboarding, branch value and desire to continue may be weaker
  than predicted. This decision is a **waiver of the pre-production timing
  requirement**, not proof that the risk is absent.

## Deliberate exception to the project production barrier

For **this project only**, the product owner authorizes proceeding with EP2–EP10
without first collecting the three independent EP1 blind-playtest records
otherwise required by
`.starter-kit/core/CONCEPT_PROOF_GATE.md` and
`config/skill-policy.json`.

Apply the project-owned authority order described in
`docs/SKILL_PRECEDENCE.md`: explicit project-owner decisions in
`AGENTS.md`, `PROJECT_RULES.md`, and `config/skill-policy.json`
control this specific risk waiver. **Do not modify** the Starter Kit managed
file or general product quality standards.

For Phase 9.1 and subsequent full-season work:

- Treat this document as the current, explicit `CONTINUE_PRODUCTION` owner
  decision for EP2–EP10.
- **Do not return `BLOCKED_STAGE9_CONCEPT_PROOF` solely because no human
  sessions are recorded or the older EP1-only decision has a smaller scope.**
- Treat the missing blind playtest as a disclosed `ACCEPTED_OWNER_RISK`;
  it is not a successful blind-playtest gate.
- Still block work for *actual* contradictions, technical failures, missing
  required production capabilities/evidence, or a later `STOP_PROJECT`.
- Preserve source canon, EP1 production art, existing passes, and unrelated
  dirty worktrees.
- Continue with Phase 9.1 full-season architecture, Phase 9.2 engine/state
  architecture, and bounded episode batches with independent narrative and
  runtime validation. No fake P0/P1 resolution or artificial reader receipts.

## Controls that are NOT waived

- Narrative coherence, knowledge provenance, character agency, route and
  ending reachability, save migrations, RU/EN localization and actual runtime QA.
- CEOS integrity, actual model/tool routing and image-generation gate when
  generation really takes place.
- Independent current-pixel art acceptance under
  `NARRATIVE_ART_ACCEPTANCE_V2`.
- Starter Kit managed file integrity, rights/provenance and Yandex technical
  requirements.
- Final release evidence, required media, build/ZIP validation, moderation,
  publication, or any other Yandex Games platform gate.
- An explicit new owner decision would be needed for publication/submission.

## Recommended risk mitigation (not a prerequisite to Phase 9.1)

Invite independent readers when feasible, record actual sessions honestly, and
consider usability/reader-comprehension findings during EP2–EP10 development.
Do not force a retroactive `BLIND_PLAYTEST_FORMAL_PASS` for this waived
pre-production gate. If real user evidence later reveals a serious problem,
revisit narrative design before investing in more production assets.

## Supersession and authority

- Supersedes `EP1_DECISION.md` **only regarding authorization scope and
  the pre-mass-production blind-playtest condition**.
- Historical results/records stay immutable and retain their own truth.
- Does **not** silently change `game-spec.yaml` from the truthful
  EP1-target/implementedEpisodes=1 until content is actually integrated.
- Is binding for Stage 9 planning as of 2026-10-15, unless the owner
  issues a later decision.
