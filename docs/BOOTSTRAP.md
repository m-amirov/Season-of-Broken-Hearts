# Bootstrap CEOS + Starter Kit (Windows / Codex)

**Статус:** инструкции по локальной установке. Наличие этого файла НЕ означает, что установка уже выполнена на ПК или в проекте. Перед стартом проверить реальные версии, пути, конфликты и результаты команд.

## Проверенные источники на 2026-10-13

- Starter Kit: https://github.com/m-amirov/starter-kit-yandex-games
  - пакет VERSION: `0.5.12`
  - `main` commit: `a9acd7e8ab344af1c13e2ecb0807678cf52edf37`
  - штатная инициализация: `node tools/starter-kit/init-project.mjs --target <game-dir> --profile new-project`
- CEOS: https://github.com/m-amirov/codex-engineering-system
  - package version: `0.5.12`
  - `main` commit: `8276dac7d310797dacdba30c697834a03e5417ea`
  - Windows installer: `scripts/install-global.ps1 -Web auto`
  - подключение: `ceos adopt --project <game-dir> --profile yandex-games`

Проверять версии на реальном checkout перед установкой. SHA — зафиксированные текущие версии для воспроизводимости, не требование игнорировать новые патчи.

## Порядок в Codex с локальным Windows shell

1. Найти на ПК реальную рабочую копию `m-amirov/Season-of-Broken-Hearts`. Если нет — `git clone https://github.com/m-amirov/Season-of-Broken-Hearts.git` в согласованный рабочий каталог. Не предполагать путь.
2. Убедиться, что `docs/CONCEPT.md` на месте, `git status --short` известен. Не терять чужие незакоммиченные файлы.
3. Найти имеющийся локальный checkout Starter Kit; при отсутствии — клонировать **в отдельный рабочий каталог вне игры**. Проверить `VERSION`.
4. Из корня Starter Kit выполнить `node tools/starter-kit/init-project.mjs --target "<absolute-game-path>" --profile new-project --dry-run`, изучить JSON и конфликты. **Не применять режим mature-project к новой игре.**
5. После безопасного dry-run запустить тот же `init-project.mjs` без `--dry-run`. Применить только штатные стартовые seed/managed-файлы. Не заменять `docs/CONCEPT.md` и другие project-owned документы.
6. Проверить `node tools/starter-kit/status.mjs --target "<absolute-game-path>"`, запустить Starter Kit self-tests; синхронизировать project-owned `game-spec.yaml`, `PROJECT_RULES.md` и README с концепцией **после** init. Не вносить изменения в managed baseline вручную.
7. Проверить глобальную команду `ceos version`. Если версия не `0.5.12` (либо реально требуемая более новая проверенная) — найти/клонировать CEOS в отдельную папку, проверить `package.json`, запустить штатный `.\scripts\install-global.ps1 -Web auto` в Windows PowerShell. Инсталлятор npm pack изолирует исполняемый пакет от source worktree. Проверить `ceos version`, `ceos global-status`. Если Web routing не готов, фиксировать точный BLOCKED, не выдавать за READY.
8. Из проекта: `ceos adopt --project "<absolute-game-path>" --dry-run --json`, затем `ceos adopt --project "<absolute-game-path>" --profile yandex-games`. Проверить `ceos capabilities --project "<absolute-game-path>" --json` и `ceos doctor`/доступные проверки текущей версии.
9. По документации `docs/NARRATIVE_GAME_PROFILE.md` из Starter Kit включить **локальный** optional profile `narrative-game` в `config/narrative-game.local.json`, но только после создания реального экспортируемого `modelPath` и `savesPath`; не создавать фиктивные данные ради искусственного PASS. Проверка: `node tools/narrative/narrative-game-check.mjs --project . --profile config/narrative-game.local.json --require-enabled`. `promisesPath` подключить к фактическому ledger, а не к примерному шаблону.
10. Перезапустить Codex после глобальной установки CEOS, чтобы новые hooks/маршруты вступили в силу. Повторить проверки в новой сессии.
11. Закоммитить изменения в проект и push в `main`, если нет чужих незакоммиченных правок и запрета на запись. Отчёт — команды, версии, SHA, реальные результаты, список созданных файлов и **отдельно** блокеры.

## Важные границы

- **CEOS — глобальная установка в Windows/Codex + проектный adopt, а не копирование CEOS в репозиторий.**
- **Starter Kit — инициализация целевого проекта, а не копирование всего исходного репозитория и не подмена managed-файлов вручную.**
- Предназначенный для новелл `narrative-game` optional profile не заменяет live runtime QA, тесты сохранений и реальную проверку семантики.
- Для **первой версии**: RU/EN, портретный приоритет, Back/сохранения, бесплатная основная история, без внутренней валюты или платных романтических выборов.
- Сначала concept proof и вертикальный срез; нельзя массово производить 10 эпизодов или десятки изображений, пока не пройден proof.
- Визуальные проверки на реальных скриншотах, art-output integrity и evidence gates обязательны там, где применимы; отчёт `PASS` без фактической проверки недопустим.
- Не расходовать GitHub Actions на повторяющиеся Linux проверки, когда те же команды можно исполнить локально.
