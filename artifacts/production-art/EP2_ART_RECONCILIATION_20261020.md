# EP2 art reconciliation — 2026-10-20

Реконсиляция подтверждает, что исторический `16/16` был реальным полным EP2: 17 scene rows, 16 уникальных portrait/landscape pairs и 32 PNG. Две Bianca-сцены используют одну и ту же пару.

Расхождение было учётным: полный manifest и runtime mapping находились в параллельной ветке `work-e02f7c47` на source HEAD `44b8260…`, а текущая ветка имела только 11 уникальных пар и не содержала пять перенесённых пар. Текущий `narrative/episodes/ep-02.json` совпадает по SHA-256, но `narrative/graph.json` и manifest имеют другие current-head SHA-256, поэтому историческая episode-final acceptance не переобъявляется как текущий PASS.

В текущий worktree перенесены только уже существующие байты пяти исторически принятых пар и добавлены их пять runtime entries. Каждый PNG проверен по SHA-256 из исторического dual-format manifest; оригиналы в параллельном worktree и historical receipts не изменены. Ранее созданная новая пара `ep2-rehearsal-failure-cg` сохранена, но не маппится и не засчитывается: её заменяет исторически принятая `ep2-service-rehearsal-failure-cg`.

Итог текущего учёта EP2: `17/17` scene rows mapped, `16/16` unique pixel pairs present, `0` missing EP2 PNG для создания. Current-head independent revalidation и episode-final acceptance остаются `NOT_VERIFIED`.

Полная машинная сверка, хэши и ссылки на manifests/receipts находятся в [EP2_ART_RECONCILIATION_20261020.json](EP2_ART_RECONCILIATION_20261020.json).
