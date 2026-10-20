# Full Season Art Production Plan — EP1–EP10

Дата фиксации: 2026-10-20. Режим: Direct Development Mode. План привязан к narrative HEAD `77a07a0952c82292446a0a4dab0af8beb29958f1`, графу `64e58add…cd8a` и manifest `f942a3bb…e86f`.

## Итог инвентаризации

| Состояние | Пары portrait+landscape | PNG |
|---|---:|---:|
| Плановое визуальное покрытие 144 сцен | 119 | 238 |
| Существующие EP1, требуют exact-HEAD recheck | 10 | 20 |
| Существующие EP2, исторически принятые и восстановленные по SHA-256 | 16 | 32 |
| EP3 `ep3_old_photo`, кандидат, ждёт независимой приёмки | 1 | 2 |
| Новые пары к созданию | 92 | 184 |

Таким образом, после reconciliation остаются ровно **92 portrait PNG и 92 landscape PNG** к созданию. EP2 покрыт `17/17` scene rows и `16/16` уникальными парами; исторические receipts остаются неизменными, а current-head episode-final acceptance всё ещё `NOT_VERIFIED`. Ещё **2 уже существующих EP3 PNG** ждут независимой Web/pixel-приёмки; они не считаются принятыми и не маппятся в runtime. Ранее созданная новая EP2-пара сохранена как superseded/unmapped duplicate и не засчитывается. 25 scene rows переиспользуют композицию внутри обоснованных visual families. Это не означает один файл на каждую сцену: authored choice/state остаётся в narrative, а новый CG создаётся только при изменении визуально значимого действия, места, состава или consent state.

## По эпизодам

| Эпизод | Сцен | Плановых пар | Уже есть/кандидаты | Новых пар | Недостаёт PNG (portrait + landscape) | Решение |
|---|---:|---:|---:|---:|---:|---|
| EP1 | 18 | 10 | 10 | 0 | 0 + 0 | переиспользовать после проверки current HEAD |
| EP2 | 17 | 16 | 16 | 0 | 0 + 0 | переиспользовать исторические 16/16 после exact SHA-256 reconciliation; не генерировать |
| EP3 | 15 | 15 | 1 кандидат | 14 | 14 + 14 | `old_photo` только на независимую приёмку; без третьего кандидата |
| EP4 | 7 | 7 | 0 | 7 | 7 + 7 | создать authored beats |
| EP5 | 8 | 8 | 0 | 8 | 8 + 8 | создать authored beats |
| EP6 | 13 | 10 | 0 | 10 | 10 + 10 | четыре route families и neutral pier sequence |
| EP7 | 19 | 15 | 0 | 15 | 15 + 15 | route beats; wrap-сцены переиспользуют композиции |
| EP8 | 19 | 15 | 0 | 15 | 15 + 15 | route beats; wrap-сцены переиспользуют композиции |
| EP9 | 19 | 15 | 0 | 15 | 15 + 15 | shared terms/forum frames, отдельные payoffs |
| EP10 | 9 | 8 | 0 | 8 | 8 + 8 | route finals, resolutions, epilogue |

## Ограничения и приоритеты

- **P0:** exact-currentness EP1; сохранение EP2; независимая очередь приёмки EP3 `old_photo` без генерации.
- **P1:** current-head revalidation EP2, затем EP3 с обновлением brief-пакета на текущий HEAD; EP2 gaps не генерируются.
- **P2:** EP4–EP5, где визуальные действия и бизнес-конфликты уже существенно различаются.
- **P3:** EP6 — route lock, consent и четыре route compositions; neutral pier frame можно переиспользовать для boundary/choice/response/transition.
- **P4:** EP7–EP10 малыми партиями по 1–2 пары, сохраняя различимость route payoffs и трёх hotel outcomes в authored state.

Переучтённые B2–B4 — только reconciliation существующих EP2 bytes, без генерации. Следующая производственная очередь: B5 — EP3 survey start (1/2), затем B6 — первые два EP4 authored beats (2/4), но только после source-bound brief gate, current-turn CEOS capability challenge и реального Terra producer route. Для EP4 подготовлен current-head brief packet; установленный generic validator пока не умеет авторизовать authored scene IDs без неподтверждённого S-numbered alias.

## Приёмка каждой пары

Нужны реальные PNG bytes в `1024×1536` и `1672×941`, отдельная landscape-композиция, source refs с SHA-256, provenance/rights запись и отсутствие baked UI, watermark, invented readable text, лишнего cast, identity drift или неавторизованного романтического контакта. Проверка включает `art-output-verify`, текущий runtime на desktop и мобильных viewport `360×640`, `390×844`, `430×932`, а также load/crossfade/fallback/back regressions.

Механическая проверка не является художественным PASS. Для каждой существенно новой композиции нужна независимая pixel-проверка; P0/P1 фактические дефекты блокируют, а P2-косметика блокирует только при заметном влиянии на читаемость, continuity или игрока.

EP2 existing bytes, receipts и evidence не изменяются. EP3 `ep3_old_photo` остаётся в текущем candidate state: portrait `93389b…ffe10`, active landscape rework `5a50ba…e71d1a`; superseded landscape `401b41…37d21` сохраняется как исторический материал. Общий verdict: **ART_PLAN_READY_NOT_ART_PASS**.
