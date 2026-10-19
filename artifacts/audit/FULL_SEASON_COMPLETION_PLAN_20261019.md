# План завершения Season of Broken Hearts — EP1–EP10

План построен по текущему аудиту `FULL_SEASON_READINESS_AUDIT_20261019`. Он не запускает production generation, не меняет игровой код и не заменяет CEOS pipeline.

## Целевое состояние

Полный сезон должен иметь executable content EP1–EP10, полный RU/EN, все четыре маршрута, явный route-lock в EP6, 7 relationship endings, 3 hotel outcomes, сохранения/загрузку всех финальных состояний, production art/runtime mapping для всех authored scenes и current-HEAD независимую acceptance evidence.

## Границы и стоп-линии

- Сохранять EP1 и уже принятый EP2; не переписывать исторические receipts/checkpoints.
- Не считать outline, architecture JSON, нулевые counters или единичный happy path доказательством реализации.
- Не создавать изображения до принятия соответствующего script/canon scope.
- Перед любой новой native generation нужен новый run-scoped CEOS capability challenge и официальный producer route; ручные/stale attestations не подходят.
- Не объявлять current-head PASS при stale sourceHead, отсутствии pixels, missing runtime mapping или непроверенном save/route path.
- Не использовать blind-playtest waiver как качество PASS: он разрешает продолжить production, но не подтверждает reader validation.
- Не запускать release build/RC ZIP до этапа 8.

## Этапы

### 1. Freeze источников и зависимостей — S

Scope: зафиксировать current HEAD, `origin/main`, dirty allowlist, narrative graph/assets/episode manifests, state schema, story promises и owner decision.

Зависит от: завершённого аудита.

Deliverables:

- exact-head inventory и SHA-256 input snapshot;
- отдельный список uncommitted parallel work без копирования/перезаписи;
- progress index для EP3–EP10.

PASS: все evidence имеют sourceHead и dependency hashes; dirty worktree классифицирован; no reset/clean/stash/switch.

CEOS: `ceos git-preflight --fetch`, `ceos context`, evidence contract. Параллельно допустима только подготовка deterministic fixtures.

### 2. Авторинг EP4–EP10 — XL, серийно по continuity

Scope: полноценные authored scene fragments, а не outline. Для каждого эпизода: сцены, exits, choices, requires/effects, state changes, RU/EN dialogue, continuity cues и payoff references.

Порядок: EP4 → EP5 → EP6 → EP7 → EP8 → EP9 → EP10. EP6 должен явно реализовать informed route-lock, EP7–EP10 — четыре route-conditioned branches и финальные conditions.

Deliverables:

- `narrative/episodes/ep-04.json` … `ep-10.json`;
- обновлённые `narrative/graph.json`/manifest через существующий graph builder;
- scene/choice ID inventory;
- authored promise/payoff references.

PASS: каждый episode fragment проходит locale/exit/guard/effect validation; все choices имеют RU/EN; нет dangling edges; route remains `none` до EP6; no route lock before the explicit EP6 choice.

CEOS: `implementation-cycle`, `narrative-continuity-engine`, project owner canon; one parent literary context by default, without parallel native writers.

Параллельно: deterministic ID/count checks, fixture preparation и read-only architecture checks. Не параллелить независимый native drafting эпизодов: continuity и state provenance shared.

### 3. Route/state/ending implementation — XL

Scope: связать EP6–EP10 content с state domains, route-lock, route-specific guards/effects, independent route, hotel state и ending resolver; расширить save migrations.

Зависит от: accepted authored EP4–EP10 и freeze state contract.

Deliverables:

- executable route graph;
- `ep6_route_choice` и explicit `routeLocked=true`;
- four reachable routes: Matteo, Leo, Elio, Independent;
- seven relationship ending IDs;
- three independent hotel outcomes;
- 21 legal ending pairs and final-state save fixtures.

PASS: route explorer reaches all 4 routes, 7 relationship endings, 3 hotel outcomes; hotel outcome does not read relationship ending and vice versa; route choice is explicit; every final state serializes/deserializes and round-trips.

CEOS: `narrative-game` validator, `route-explorer`, save tests, `narrative-continuity-engine`; no claim from architecture check alone.

Параллельно: negative tests for wrong route guards, missing knowledge antecedents and final-state corruption. Graph edits and save schema changes remain serialized.

### 4. Continuity and editorial closure — L/XL

Scope: chronology days 17–70, location transitions, character knowledge provenance, consent/boundaries, business causality, route promises, Bianca/Hotel payoffs and independent-life payoff.

Deliverables:

- route-conditioned continuity ledger;
- story promise ledger with setup/payoff/guard/status;
- bounded editorial/cold-reader packets for each completed episode.

PASS: every due promise has authored payoff or explicit intentional open end; no character acts on unvisited knowledge; refusal remains non-punitive; independent route is not a romance failure; hotel outcome is causally independent from romance ending.

CEOS: `narrative-continuity-engine`, bounded independent editorial review when required. No fabricated reader sessions.

Параллельно: deterministic state/ID checks can run while semantic review is prepared; prose repair remains in the parent context.

### 5. EP3 first, then remaining art — XL

Scope: unblock all 15 EP3 scenes first, then art for EP4–EP10 after their scripts are accepted. Every visual decision must be scene/cue justified; no automatic one-image-per-scene assumption.

Deliverables:

- source-bound art briefs;
- portrait/landscape dual-format manifests;
- real PNG output records, rights/provenance and SHA-256;
- `narrative/assets.json` mapping for every authored scene;
- current runtime capture set.

PASS: no missing asset IDs; every planned art pair has real files and dimensions; `ceos art-output-verify` passes; runtime preload/crossfade/crop is verified at mobile portrait and desktop landscape.

CEOS: `production-art`, `ceos art-brief-verify`, fresh `ceos capability-challenge` before any generation, `ceos art-output-verify`, `ceos checkpoint`, `ceos routing-trace`. EP2’s accepted bytes and receipts remain unchanged.

Параллельно: brief/provenance inventory can be prepared with route implementation once scene IDs are frozen. Generation and Web review are sequential within a bounded episode scope.

### 6. Full runtime and save QA — L/XL

Scope: EP1→EP10 transitions, preload/crossfade, Back, New Game, save/reload after every episode boundary and final state, RU/EN, portrait phone layout, desktop landscape, touch/double-input guards, focus/visibility lifecycle and performance.

Deliverables:

- current-HEAD browser/runtime evidence;
- scene/route/save matrix;
- console/request/http failure report;
- performance/load notes.

PASS: player reaches every authored scene and intended branch; no missing asset, 404, console error or state corruption; Back restores complete pre-command snapshot; New Game clears season state; RU/EN does not alter progression; all final states reload.

CEOS/skills: `web-game-playtest`, `mobile-game-ux`, `game-performance-budget`, `visual-quality-gate` screenshot barrier. No text-only or stale screenshot claim.

Параллельно: episode-local smoke can run after each mapping freeze; full-season route smoke is serial because save state crosses episode boundaries.

### 7. Independent acceptance — L/XL

Scope: current-HEAD art pixels, runtime framing, readability and narrative/editorial acceptance for changed episodes.

Deliverables:

- independent Web High receipts with actual pixel-transfer proof;
- scoped rework records if needed;
- reader/editorial result for each completed episode.

PASS: current sourceHead matches; every required cue/viewport is received and independently judged; no open P0/P1; accepted scope is not silently expanded.

CEOS: `visual-quality-gate`, `web-game-playtest`, `ceos web-preflight`, `ceos web-review-verify`, routing trace. Do not repeat EP2 acceptance unless a dependency change invalidates its receipt.

Параллельно: independent packets for separate completed episodes only if their manifests and source dependencies are immutable and Web pacing is respected.

### 8. Release audit barrier — XL, serial only

Scope: full Yandex requirements audit, current production package, final gameplay media, ZIP/SHA-256, no P0/P1 and independent release audit.

Зависит от: all episodes and all evidence gates PASS, clean/reconciled branch, owner release authorization.

PASS: `yandex-release-validation` PASS, `release-audit` PASS, valid release artifact and SHA-256; no unresolved external/platform/manual evidence.

CEOS: `yandex-release-validation`, `release-audit`, final evidence gate. Only here is release packaging allowed; no merge/push/publication is implied.

## Dependency map

```text
1 Freeze
  -> 2 Authored EP4-EP10
      -> 3 Route/state/endings
      -> 4 Continuity/editorial closure
          -> 5 EP3 + EP4-EP10 art
              -> 6 Full runtime/save QA
                  -> 7 Independent acceptance
                      -> 8 Release audit / RC barrier
```

Safe parallel work is limited to deterministic inventory, negative tests, brief/provenance preparation and episode-local QA after immutable scene/asset bindings. Narrative authoring, graph mutations, state schema changes, generation and final acceptance remain bounded and evidence-bound.

## Completion definition

План завершён только когда JSON matrix for EP1–EP10 has no `NOT_STARTED`, `BLOCKED` or `NOT_VERIFIED` in required columns, current-head evidence covers all routes/endings/hotel outcomes, and release audit independently confirms the package. До этого состояние должно оставаться `BLOCKED` или `NOT_VERIFIED`, даже если отдельные art batches и structural tests зелёные.
