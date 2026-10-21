# EP3 survey batch transport diagnostics — 2026-10-21

## Preserved provenance rejection

The first aggregate DEV Web High request was intentionally not retried as-is. The real CLI response was:

```json
{
  "schemaVersion": 1,
  "status": "BLOCKED",
  "failureType": "PROVENANCE_FAILURE",
  "sceneId": null,
  "sourceHead": "b0495d2683b65120c42071272b6a320406d21c2d",
  "transport": {
    "status": "BLOCKED",
    "provider": "codex-chatgpt-web-dev",
    "releaseVersion": "6.1.11",
    "mode": "browser-only",
    "model": "chatgpt-web/gpt-6-sol",
    "reasoning": "high",
    "stableBridgeUsed": false,
    "actualProjectHead": "b0495d2683b65120c42071272b6a320406d21c2d",
    "classification": "PROVENANCE_FAILURE",
    "detail": "sceneId is required",
    "attempts": 0
  }
}
```

The request was corrected to one `sceneId` per review. The three corrected requests completed with actual pixels, `attachmentAccepted=true`, and `PASS`; their receipts, raw responses and transport trace IDs are listed in the aggregate acceptance receipt.

## Preserved immutable-run write rejection

The generation run remains intentionally unmodified at `INTEGRATED` / `VISUAL_VERIFIED` next stage. A post-generation checkpoint/routing-trace attempt was rejected by the run integrity guard because the source-bound packet changed after the generation checkpoint:

`CEOS_ERROR: Run integrity check failed: artifact changed after checkpoint INVENTORIED: E:\Work\YandexGames\Novells\Season of Broken Hearts\_worktrees\stage9-full-season-architecture\artifacts\production-art\stage9.6\EP3_SOURCE_BOUND_ART_BRIEFS_CURRENT_HEAD_20261020.json`

No stale checkpoint or routing trace was forged. Current-head runtime QA and the independent DEV Web High receipts are stored separately and reference `b0495d2683b65120c42071272b6a320406d21c2d`.
