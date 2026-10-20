# S32 DEV Web High transport trace

- Project HEAD: `1a9685a4a943b6c2d3efcb57db58e4972a99cae5`
- Provider: `codex-chatgpt-web-dev`
- Model: `chatgpt-web/gpt-6-sol`
- Reasoning: `high`
- Mode: `browser-only`
- `stableBridgeUsed`: `false`
- Transport trace: `devweb_5de9b3bee85b45c1b8fe417e867612f7`
- DEV diagnostics directory: `C:\Users\user\.codex-chatgpt-web-dev\runtime\dev-chat\diagnostics\devweb_5de9b3bee85b45c1b8fe417e867612f7-10b5aa10`
- Minimal authenticated DEV probe: `WEB HIGH DEV READY`; trace `9170d9175aa6`; diagnostics `C:\Users\user\.codex-chatgpt-web-dev\runtime\dev-chat\diagnostics\browser-turns\9170d9175aa6-77020a3f`
- Legacy bridge check: `127.0.0.1:17841` had no listener; no request was sent through it.
- DEV profile: authenticated browser-only request delivered and returned; local tools were disabled for the Web reviewer.
- Model routing: requested and received `chatgpt-web/gpt-6-sol` with high reasoning; no downgrade.
- Attachment delivery: 7 submitted, 7 accepted, `actualPixelsReceived=true`.
- Receipt: `artifacts/evidence/web-high-control/S32_CANONICAL_RUNTIME_WEB_REVIEW_RECEIPT_20261020.json`
- Raw response: `artifacts/evidence/web-high-control/S32_CANONICAL_RUNTIME_WEB_REVIEW_RAW_20261020.txt`
- Runtime QA: `artifacts/evidence/web-high-control/S32_CURRENT_HEAD_RUNTIME_QA_20261020.json`
- Verification: `ceos web-review-verify --kind production-art --phase acceptance --visual --assurance visual-content` returned `PASS`.

## Root cause

The recurring `fetch failed` was the legacy Web preflight path trying to reach the configured stable/legacy bridge at `http://127.0.0.1:17841/healthz`; the port had no listener. The production descriptor was also incorrectly pointing at the DEV launcher descriptor. The actual authenticated DEV browser-only path was healthy and delivered the minimal probe and the pixel review, so this was a transport/configuration failure, not a S32 art or model-routing failure.

## Repair boundary

`C:\Users\user\.codex-chatgpt-web\config.json` now points `browserHostDescriptorPath` at the stable descriptor path instead of the DEV descriptor. No secret, accepted PNG, historical receipt, release setting, bridge process or external service was modified. The current S32 review explicitly used DEV browser-only and did not use the legacy bridge.
