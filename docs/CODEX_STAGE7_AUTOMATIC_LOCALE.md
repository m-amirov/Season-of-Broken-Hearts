# Stage 7 — automatic platform locale

The game does not expose a RU/EN selector. After `YaGames.init()` resolves,
the runtime reads `ysdk.environment.i18n.lang` and normalizes `ru*` to `ru`;
`en*` and every unsupported language use the English fallback. Local
development uses `navigator.language` with the same normalization.

The locale stored in a save remains part of the migration-compatible schema,
but never overrides the platform locale for the current launch. Save loading
therefore restores the cursor, decisions, history and reader progress while
the current SDK/browser language controls all rendered copy.
