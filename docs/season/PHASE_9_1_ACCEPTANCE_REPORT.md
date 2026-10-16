# Phase 9.1 — Full Season Narrative Architecture

Статус: `PASS_STAGE9_NARRATIVE_ARCHITECTURE`

Дата: 2026-10-15

## Область и authority

- Рабочая ветка: `codex/stage9-full-season-architecture`.
- Подтверждённый `origin/main`: `476d71b6bf247a01fcf59617a68e58f518f50700`.
- Решение владельца: `artifacts/concept-proof/FULL_SEASON_OWNER_DECISION_2026-10-15.md`.
- Решение `CONTINUE_PRODUCTION` разрешает разработку EP2–EP10 и не разрешает публикацию, модерацию или release PASS.
- `OWNER_ACCEPTED_BLIND_PLAYTEST_RISK_2026_10_15` применён только как project-scoped исключение сроков concept proof.
- `BLIND_PLAYTEST_FORMAL_PASS = NOT_ATTESTED` и `AWAITING_BLIND_PLAYTEST` сохранены как фактические статусы. Фиктивные сессии не создавались.
- Исторический `artifacts/stage9/PHASE_9_1_BLOCKER.md` не переписан и остаётся свидетельством прежнего состояния.

## Что принято архитектурой

- Десять эпизодов охватывают дни 1–70; EP1 оставлен утверждённым и не изменён.
- EP1–EP6 образуют общее сюжетное ядро. Route-lock выполняется ровно в EP6 в сцене `ep6_route_choice`.
- Определены четыре маршрута: Маттео, Лео, Элио и независимый путь Ники.
- Определены семь личных финалов: по два для каждого романтического маршрута и независимый финал.
- Определены три независимых исхода Villa Serena: сохранение независимости, ограниченное инвестирование и продажа.
- Спецификация допускает 21 законную пару `relationship ending × hotel outcome`; условия финалов не читают результат другой системы.
- Для каждой сюжетной обещанной линии указан владелец, эпизод исполнения и требуемое runtime-доказательство. Унаследованные EP1 promises не объявлены исполненными заранее.
- Зафиксированы границы знания, причинность перемещений и профессиональные цели персонажей.
- Состояние разделено на route, trust, relationship, hotel, career, knowledge, consent/boundaries и ending domains; общий romance score не используется.

## Проверки

| Проверка | Результат |
| --- | --- |
| Machine-readable architecture contract | PASS: 10 episodes / 4 routes / 7 relationship endings / 3 hotel outcomes / 21 pairs |
| Architecture unit tests | PASS |
| Existing unit suite | PASS: 66/66 |
| Existing EP1 narrative validator | PASS_DECLARED_NARRATIVE_GRAPH; 18/18 scenes, 1/1 ending |
| Existing EP1 conditional dialogue | PASS |
| Existing EP1 wardrobe continuity | PASS |
| Starter Kit status/self-test | PASS / clean; verified during recovery checkpoint |
| EP1 mutation check | PASS by scoped diff review; no EP1 source or production CG changed |
| Full-season executable reachability | NOT YET ATTESTED; reserved for Phase 9.2 route explorer after EP2–EP10 graph integration |
| Independent human blind playtest | NOT ATTESTED by accepted owner decision; not represented as PASS |

The current EP1 validator still reports the three inherited promises as not runtime-verified. This is expected at the architecture gate and is not converted into a false full-season payoff claim.

## Artifacts

- `narrative/season-architecture.json`
- `docs/season/FULL_SEASON_BEAT_SHEET.md`
- `docs/season/EPISODE_PRODUCTION_PLAN.md`
- `docs/season/CHARACTER_ARC_MATRIX.md`
- `docs/season/FULL_SEASON_ROUTE_MAP.md`
- `docs/season/TIMELINE_AND_KNOWLEDGE_MATRIX.md`
- `docs/season/STORY_PROMISES_LEDGER.md`
- `docs/season/ENDING_REACHABILITY_SPEC.md`
- `docs/season/STATE_AND_SAVE_ARCHITECTURE.md`
- `docs/season/PRODUCTION_ART_PLAN.md`
- `tools/narrative/season-architecture-check.mjs`
- `tests/unit/season-architecture.test.mjs`

## Gate decision

`PASS_STAGE9_NARRATIVE_ARCHITECTURE`

Архитектура полного сезона достаточно конкретна для реализации и прошла структурную и continuity-проверку. Это не означает готовность EP2–EP10, engine architecture, production art, release или публикации.

Следующий разрешённый этап: `PHASE 9.2 — Narrative Engine & State Architecture`, затем Batch A EP2–EP3. `game-spec.yaml` намеренно сохраняет `implementedEpisodes: 1` и `target: ep1-vertical-slice` до фактической интеграции новых эпизодов.
