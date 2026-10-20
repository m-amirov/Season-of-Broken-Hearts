# Full-season blind playtest plan — 2026-10-20

Статус: **PLAN_READY_NOT_RUN / NOT_ATTESTED**. План привязан к текущему narrative graph, но не подменяет реальное чтение автоматическими route/count результатами.

## Обязательное покрытие

- 4 route legs: Matteo, Leo, Elio, Independent; route lock проверяется в EP6.
- 7 relationship finals: `matteo-hope`, `matteo-goodbye`, `leo-second-chance`, `leo-echo`, `elio-table-for-two`, `elio-separate-kitchens`, `nika-own-way`.
- 3 hotel outcomes: `independence`, `limited-investment`, `sale`.
- Continuity checkpoints: EP2 agreement closure, EP3 reveal, EP6 route lock, EP9 public forum, EP10 resolution; отдельно проверяются load/back/new-game и RU/EN.

Минимум — 3 независимых blind readers и 14 scenario legs. Каждый leg стартует из свежего save и сохраняет build/source SHA, locale, наблюдения и фактически достигнутые `endingId`/`hotelOutcome`. Читателю не сообщается «правильный» маршрут и его не ведут к нужному выбору.

## Что оценивается

Continuity знаний, времени, consent и business causality; различимость голосов и отношений; понятность последствий выбора; темп EP2/EP3/EP6/EP9/EP10; самостоятельность семи финалов и причинность трёх hotel outcomes. P0/P1 дефекты отделяются от косметических P2/P3 и не запускают бесконечный цикл косметических переделок.

Механические тесты и route explorers могут подтвердить достижимость узлов, но не являются human observation или blind-playtest PASS.
