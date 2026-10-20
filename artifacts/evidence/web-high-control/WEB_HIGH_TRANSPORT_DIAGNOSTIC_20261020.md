# Web High transport diagnostic — 2026-10-20

## Scope

- Project HEAD: `1a9685a4a943b6c2d3efcb57db58e4972a99cae5`
- Branch: `codex/stage9-full-season-architecture`
- Mode: direct development; no CEOS run/checkpoint or mass acceptance started.
- Image generation: not invoked.

## Transport findings

### Legacy bridge

- `ceos web-preflight --project . --json`: `UNAVAILABLE`, reason `fetch failed`.
- Health URL: `http://127.0.0.1:17841/healthz`.
- Fresh socket check: no listener on TCP `17841`.
- Production `status --json`: Responses proxy unreachable.
- Root cause: the configured legacy route checks a local bridge that is not running. The production profile was also incorrectly bound to the DEV launcher descriptor, so it could report the DEV browser host as production while the legacy bridge remained absent.

### DEV browser-only

- Profile: `C:\Users\user\.codex-chatgpt-web-dev`.
- Release: `6.1.11`; mode `browser-only`; purpose `dev-harness`.
- Launcher: running, PID `9336`, descriptor profile `development`.
- `MCP runtime`: not required; local tools disabled by design.
- `browser check` with the DEV home: authenticated ChatGPT surface reachable.
- Fresh minimal request: `WEB HIGH DEV READY`; model `chatgpt-web/gpt-6-sol`, High reasoning, trace `9170d9175aa6`.
- Minimal-request diagnostics: `C:\Users\user\.codex-chatgpt-web-dev\runtime\dev-chat\diagnostics\browser-turns\9170d9175aa6-77020a3f`.
- Launcher log: `C:\Users\user\.codex-chatgpt-web-dev\launcher\logs\launcher.jsonl`; the current turns show `authenticated`, `tab_completed` and `turn_ended: completed`.

## Applied repair

Changed the production profile descriptor from the DEV descriptor to its isolated production path:

- `C:\Users\user\.codex-chatgpt-web\config.json`
- `browserHostDescriptorPath = C:\Users\user\.codex-chatgpt-web\runtime\launcher-browser.json`

The stable descriptor is currently absent, so production status now fails closed instead of claiming the DEV host. No secrets, routes, publication settings or external services were changed. The DEV profile remains isolated and functional.

## S32 control review

The first pixel turn delivered all five PNGs but was correctly rejected as `NOT_VERIFIED` because the model emitted unsupported `impactCode: CHARACTER_IDENTITY_CONTINUITY`; its raw response is preserved. A single narrow retry specified the allowed impact code and produced a valid receipt:

- Provider: `codex-chatgpt-web-dev`; stable bridge: `false`.
- Model: `chatgpt-web/gpt-6-sol`; reasoning: `high`.
- Source HEAD: exact current HEAD above.
- `submitted: true`; `attachmentAccepted: true`; `actualPixelsReceived: true`.
- Receipt status: `REWORK`, not PASS.
- Findings: two open P1 `WRONG_CHARACTER` findings, one for each submitted S32 variant.
- Web trace: `devweb_3117df6e65ff49288f9ae2adcb321424`.
- Trace directory: `C:\Users\user\.codex-chatgpt-web-dev\runtime\dev-chat\diagnostics\devweb_3117df6e65ff49288f9ae2adcb321424-7e181a13`.
- `ceos web-review-verify`: `WEB_REVIEW_NOT_VERIFIED` because the receipt is an honest `REWORK` with unresolved observations; this is expected and is not a PASS.

Pixel observation: the submitted portrait and landscape show a substantially younger dark-haired woman without the approved Giulia silver strands and mature facial structure. The historical accepted portrait and landscape visibly preserve Giulia's approximately 49-year-old appearance, silver-gray strands and mature face. The service-corridor action and three-person staging remain understandable, so the evidence supports a targeted Giulia identity repair or use of the already mapped historical pair; wholesale scene regeneration is not established.

## Evidence files

- `S32_GIULIA_PIXEL_REVIEW_REQUEST_20261020.json`
- `S32_GIULIA_PIXEL_REVIEW_REQUEST_20261020_RETRY.json`
- `S32_GIULIA_PIXEL_REVIEW_RAW_20261020.txt` — first response, `NOT_VERIFIED` schema rejection.
- `S32_GIULIA_PIXEL_REVIEW_RAW_20261020_RETRY.txt` — raw response for the valid retry.
- `S32_GIULIA_PIXEL_REVIEW_RECEIPT_20261020_RETRY.json` — immutable `REWORK` receipt with five image hashes and `actualPixelsReceived:true`.

No mass acceptance was started. No image was regenerated or replaced.
