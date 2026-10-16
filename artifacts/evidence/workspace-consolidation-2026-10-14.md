# Season of Broken Hearts — workspace consolidation

Дата: 2026-10-14 (Europe/Moscow)

## Scope and source identity

- Разрешённая область: `E:\Work\YandexGames\Novells`.
- Репозиторий: `https://github.com/m-amirov/Season-of-Broken-Hearts.git`.
- Основной Git root: `E:\Work\YandexGames\Novells\Season of Broken Hearts\Season of Broken Hearts`.
- Fresh `ceos git-preflight --fetch`: `BLOCKED_DIRTY`; local `dc5e1b301483d8ceb6c8febd082a5d6993a340ab`, `origin/main` `57027e2c4b2654c00350b0ebf4406d20fe8d3762`, local `main` behind by 52 commits, dirty. Fast-forward не выполнялся.

## Итоговая инвентаризация

| Каталог / архив | Размер | Git status | Уникальные данные | Действие |
|---|---:|---|---|---|
| `E:\Work\YandexGames\Novells\Season of Broken Hearts` | 532.93 MB | Не Git; контейнер оставшихся checkout | Содержит постоянный checkout и сохранённые worktree | A — оставить как контейнер |
| `...\Season of Broken Hearts\Season of Broken Hearts` | 230.68 MB | `main`, `dc5e1b3`; dirty: 6 tracked changes + 193 pre-existing untracked entries; после задачи добавлены `AGENTS.md` и этот отчёт | Пользовательские evidence, PNG, CEOS runs, сохранённые локальные изменения | A — постоянный checkout, сохранить |
| `...\Season of Broken Hearts-stage6-1-origin-main` | 101.66 MB | `codex/stage6-1-ui`, `d68d1c6`; 36 untracked entries; 35 commits behind `origin/main` | Playwright PNG и CEOS verification evidence | B — сохранить |
| `...\Season of Broken Hearts-stage7-2-origin-main` | 114.04 MB | `codex/stage7-2-ui-hardening`, `f4173bc`; 36 untracked entries; 11 commits behind `origin/main` | Stage 7.2 evidence, screenshots, механические проверки | B — сохранить |
| `...\Season of Broken Hearts\Season of Broken Hearts-stage7-3-recovery` | 100.29 MB | `codex/stage7-3-infrastructure-recovery`, `f557f48`; clean; 2 unique commits ahead of `origin/main` | Коммиты `232977f` и `f557f48`, Starter Kit/Yandex state и recovery evidence | B — сохранить |
| `...\Season of Broken Hearts\Season of Broken Hearts-stage7-4-final-verify` | 100.30 MB | detached `57027e2` == `origin/main`; dirty: modified `narrative/save-fixtures.json` + 14 evidence entries | Незавершённые save-fixtures и post-merge evidence | B — сохранить |
| `...\Season of Broken Hearts\Season of Broken Hearts-stage7-4-integration` | ~100.29 MB до удаления | clean; `f291902c`, без unique commits/path changes относительно `origin/main`; active process не найден | Уникальных данных не обнаружено | C — удалён через `git worktree remove` без `--force` |
| `...\Season of Broken Hearts\Season of Broken Hearts-stage7-premium-ui` | ~100.27 MB до удаления | clean; `74f9807`, без unique commits/path changes относительно `origin/main`; active process не найден | Уникальных данных не обнаружено | C — удалён через `git worktree remove` без `--force` |
| `E:\Work\YandexGames\Novells\_season-broken-hearts-init-stage-20261013` | 0.76 MB | Не Git | Init/update scaffold, `existing-target-update-report.json`, Starter Kit documents | D — сохранить до решения владельца |
| `E:\Work\YandexGames\Novells\batch2-package-source-7181c60e3e0236befe915f43e45e90241db78b32` | 616.26 MB / 1007 files | Не Git | Полный source snapshot с `artifacts`, `assets`, `docs`, `.starter-kit` | D — сохранить |
| `E:\Work\YandexGames\Novells\batch2-package-7181c60e3e0236befe915f43e45e90241db78b32.zip` | 53.94 MB | Архив | 226 files; SHA-256 `69A805A8FD6AEF7EF367433EA6B88BB3648E0F196FE61FC1672F22DB4C0DD271` | D — не удалён |
| `E:\Work\YandexGames\Novells\batch2-package-source-7181c60e3e0236befe915f43e45e90241db78b32.zip` | 597.90 MB | Архив | 1007 files; SHA-256 `B820C7C230DE7B0450959F960C44A4F7AA816A3A65ABC62050F199E42DFA2607` | D — не удалён |

Сканирование связанных имён в `Novells` после очистки обнаружило только перечисленные каталоги; соседние проекты Novells не изменялись.

## Изменения политики

- В project-owned `AGENTS.md` добавлен раздел `Workspace and worktree hygiene`.
- Создан каталог `E:\Work\YandexGames\Novells\Season of Broken Hearts\_worktrees` как единое место для будущих временных worktree.
- Managed Starter Kit файлы не изменялись.

## Безопасность и процессы

- Перед удалением для каждого кандидата проверены: путь внутри разрешённой области, linked-worktree registration, clean status, отсутствие unique commits/path changes относительно refreshed `origin/main`, отсутствие процесса с этим путём.
- На основном checkout работает текущий Codex; процессов с путями удалённых или сохранённых stage-worktree и dev-server процессов не обнаружено.
- `Remove-Item -Recurse`, `git reset --hard`, `git clean -fdx`, `git worktree remove --force`, push/merge не выполнялись.
- Уникальные данные не удалялись: dirty/untracked checkout, recovery branch, init snapshot и оба ZIP сохранены.

## Финальный барьер

- `git worktree list --porcelain`: 5 оставшихся зарегистрированных worktree — основной, stage6-1, stage7-2, stage7-3 и stage7-4-final-verify.
- `git remote -v`: подтверждён ожидаемый `origin`.
- `git branch -vv`: подтверждены branches и их HEAD; удаление worktree не удаляло branch refs.
- `git status`: основной checkout функционирует и остаётся намеренно dirty; существующие пользовательские изменения сохранены.
- Полная сборка игры не запускалась, поскольку не относится к filesystem cleanup.

Освобождено приблизительно **200.6 MB** за счёт двух удалённых чистых worktree. Утрата уникальных данных не обнаружена.

**Verdict: `PASS_WORKSPACE_CONSOLIDATION`.**
