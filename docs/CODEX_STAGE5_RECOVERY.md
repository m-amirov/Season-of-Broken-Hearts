# Codex — Stage 5 recovery: source reconciliation and real character references

**Repository:** https://github.com/m-amirov/Season-of-Broken-Hearts  
**Confirmed upstream `main` during diagnosis:** `1404abbcea3f8b1c0dabb3cd02b5af46e4ec35ba`.  
**Confirmed Stage 5 task document:** `docs/CODEX_STAGE5_ART_PILOT.md` was added by `dfdcdef772445c56e6f2de1efb6c32f426b70cb2`.  
**Context:** Codex reported `BLOCKED_PRE_GENERATION`, missing Stage 5 document and missing four real character-reference raster files. GitHub now confirms the document *exists* on main; raster reference images have not been generated.

## Part A — reconcile the actual local checkout, do not reset

In the existing local game checkout, execute:

```powershell
git rev-parse --show-toplevel
git remote -v
git branch --show-current
git status --short
git rev-parse HEAD
git fetch origin main
git rev-parse origin/main
git ls-tree -r --name-only origin/main -- docs/CODEX_STAGE5_ART_PILOT.md
git show origin/main:docs/CODEX_STAGE5_ART_PILOT.md
git log origin/main --oneline -- docs/CODEX_STAGE5_ART_PILOT.md
```

Expected: remote URL is `m-amirov/Season-of-Broken-Hearts`, and `origin/main` contains the Stage 5 task (commit `dfdcdef7...`). If it does not, **do not declare the file missing from GitHub**: print actual remote, branch, SHA, and fetch diagnostics. Diagnose multiple worktrees, detached checkout, stale `origin`, clone confusion and sparse checkout.

If `main` is behind and there are no conflicts or local edits, use `git pull --ff-only origin main`. Preserve/commit unrelated local files first. Do not `reset --hard`, force-push or overwrite the user's `GENERATION_BLOCKER.md`, existing character anchors or untracked artifacts.

If the file exists at `origin/main` but not in worktree, diagnose sparse-checkout/skip-worktree and restore **only that file** safely, after preserving any local content.

## Part B — unblock generation honestly

1. Read `artifacts/art-direction/ART_BIBLE.md`, `VISUAL_LANGUAGE.json`, `EP1_SHOT_LIST.md`, `docs/CODEX_STAGE5_ART_PILOT.md` and the locally reported `artifacts/production-art/GENERATION_BLOCKER.md`. Preserve already drafted character anchors.
2. Confirm which **real image generation tool** is callable in this Codex session, whether it can produce bytes, and exactly how CEOS expects source images to be registered. Do not assume a description or named tool implies callable producer.
3. If generator **is** available and authorized, first generate a bounded **style exploration** comparing 2–3 candidate treatments for the same beat, with actual image pixels and a real contact sheet; select a provisional direction. Then generate **four separate image files**, one per character, following established anchors and the chosen style:
   - `nika-reference.png` — Nika Vorontsova, 28, event planner, pragmatic light summer outfit, expressive but guarded; no childish stylization.
   - `matteo-reference.png` — Matteo Ricci, 33, controlled but tired boutique-hotel owner, believable business-casual summer clothing, no tuxedo.
   - `elio-reference.png` — Elio Benedetti, 30, working chef, humane and witty, realistic work apron/kitchen attire.
   - `leo-reference.png` — Leonardo Vitale, 31, architect, clean visual distinction from Matteo, practical summer clothing, blueprint tube only where context justifies it.
4. Prefer one identity per separate image with readable full face, three-quarter view and enough body to check proportions; include optional front/profile crops or separate sheets only if source-quality warrants. Use **one consistent 2D semi-realistic painterly style** across the four and do not quietly change already approved canonical visual attributes. No captions/UI/watermarks baked into images.
5. Do not fabricate image paths, dimensions, pixels, checksums, approval or provenance. File names are suggestions: use CEOS’s actual schema and preserve image bytes, dimensions, SHA-256, source producer, reference IDs and licensing/provenance. A contact sheet alone does not fulfill four distinct per-character reference inputs unless separately exported and validated.
6. If the generator **is not callable**, stop **only the image-production stage** and report `BLOCKED_IMAGE_PRODUCER_UNAVAILABLE`. Create four detailed *project-owned* generation prompts (without pretending images exist) and request actual reference PNG/JPEG/WebP files from the owner via another generation-capable environment. Their files can later be added to the local checkout and registered in CEOS. Do not bypass `CANON_READY`.

## Part C — do not skip approval or the pilot boundary

- The first reference candidates are not final until owner approval; record `AWAITING_ART_STYLE_APPROVAL` and provide real previews.
- Only after style/identities are approved produce the scoped four pilot CG described in `EP1_SHOT_LIST.md`.
- Validate actual source pixels *and* current-HEAD gameplay screenshots. Distinguish artist/metadata review from verified image ingestion, layout and pixel-level acceptance.
- Do not start mass art, EP2–EP10, marketing assets or release packaging.
- If narrative, Starter Kit semantic files, or CEOS acceptance metadata changed, run proper scoped checks and official semantic acceptance, not gate suppression.

## Final report

Actual local root, `origin` URL, `HEAD` and `origin/main`; exact cause of missing document report; whether Stage 5 doc was retrieved; list of real character-reference files with dimensions/hashes **or** explicit absent-producer blocker; chosen/proposed art style; artifacts and review state; next owner action.

Do not mark `PRODUCTION_ART_PASS` on the basis of prose documents or a completed preflight.
