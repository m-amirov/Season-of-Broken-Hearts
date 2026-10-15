# Narrative dual-format art project contract

This is the Starter Kit boundary for the CEOS
`docs/NARRATIVE_DUAL_FORMAT_ART.md` production gate. It applies only when a
project-owned `narrative-game` profile is explicitly enabled.

Each unique production CG family may be reused by neighboring scenes when the
authored location, cast, time and action remain the same. The family must still
declare two independently composed, persisted variants:

- `portrait`: mobile composition, target `1024x1536` and near `2:3`;
- `desktop`: wide composition, target `1920x1080` and near `16:9`.

The desktop image is not a stretch, crop, blurred side fill or mobile screenshot.
Both variants must preserve identity, authored action, location, time and
important props while allowing intentional framing changes and dialogue-safe
negative space.

## Project-owned handoff manifest

The project keeps a separate manifest, for example
`artifacts/production-art/ep1-dual-format.json`:

```json
{
  "schemaVersion": 1,
  "profile": "narrative-game",
  "sourceHead": "<40-character-current-head>",
  "episode": 1,
  "sceneAssets": { "ep1_arrival": "ep1-arrival" },
  "assets": {
    "ep1-arrival": {
      "portrait": {
        "path": "assets/production/cg/ep1-arrival-portrait.png",
        "sha256": "<actual-file-sha256>",
        "width": 1024,
        "height": 1536
      },
      "desktop": {
        "path": "assets/production/cg/ep1-arrival-desktop.png",
        "sha256": "<actual-file-sha256>",
        "width": 1920,
        "height": 1080
      }
    }
  }
}
```

Do not list a path for an absent file. Keep missing work in the production plan
as `PENDING_GENERATION`; the handoff and CEOS production gate must remain
blocked until the real file exists and its current-HEAD checksum is recorded.

The Starter Kit check is intentionally declarative. It verifies scene coverage
and the presence of both format declarations, then reports
`visualAcceptance: NOT_VERIFIED`. CEOS owns confined file access, PNG decoding,
dimensions/aspect ratios, SHA-256 equality, variant independence, and the
mechanical/artistic acceptance boundary. A mechanical pass is never an art
acceptance pass.

## Runtime contract

The runtime may use a legacy portrait fallback only while coverage is explicitly
incomplete. A complete implementation selects a variant from measured viewport
aspect ratio, preloads and decodes it, preserves the last valid frame while
resizing, ignores stale requests, crossfades only after decode, avoids black
frames, and leaves scene/route/save state independent from the asset name.

Acceptance requires current-runtime portrait and desktop captures, independent
review of both compositions, and the existing Yandex/mobile evidence gates.
The dual-format rule is not enabled for generic or unrelated game profiles.
