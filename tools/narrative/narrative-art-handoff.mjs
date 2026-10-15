/**
 * Project-owned narrative art handoff contract.
 *
 * This check validates that a narrative project declares both format variants
 * for every episode scene before handing the manifest to CEOS. It deliberately
 * does not read image bytes, decode PNGs, or claim visual acceptance; CEOS
 * production-art owns those checks and the final artistic gate.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SHA = /^[a-f0-9]{64}$/i;
const HEAD = /^[a-f0-9]{40}$/i;
const FORMATS = ['portrait', 'desktop'];

const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const validId = value => typeof value === 'string' && /^[A-Za-z0-9_.:-]+$/.test(value);

function readConfined(root, relative) {
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative) ||
      /^[A-Za-z]:[\\/]/.test(relative) || relative.includes('\\') ||
      relative.split('/').some(segment => !segment || segment === '.' || segment === '..')) {
    throw new Error('Unsafe narrative art handoff path');
  }
  const realRoot = fs.realpathSync(root);
  const actual = fs.realpathSync(path.resolve(realRoot, relative));
  if (!actual.startsWith(realRoot + path.sep) || !fs.statSync(actual).isFile()) {
    throw new Error('Narrative art handoff path escapes project or is missing');
  }
  return actual;
}

function variantDescriptor(value, assetId, format, errors) {
  if (!record(value)) {
    errors.push({ code: 'ART_VARIANT_DECLARATION_MISSING', scope: `${assetId}:${format}` });
    return;
  }
  if (typeof value.path !== 'string' || !value.path || path.isAbsolute(value.path) ||
      /^[A-Za-z]:[\\/]/.test(value.path) || value.path.includes('\\') ||
      value.path.split('/').some(segment => !segment || segment === '.' || segment === '..')) {
    errors.push({ code: 'ART_VARIANT_PATH_INVALID', scope: `${assetId}:${format}` });
  }
  if (!SHA.test(value.sha256 ?? '')) {
    errors.push({ code: 'ART_VARIANT_SHA256_INVALID', scope: `${assetId}:${format}` });
  }
  if (!Number.isSafeInteger(value.width) || !Number.isSafeInteger(value.height) ||
      value.width <= 0 || value.height <= 0) {
    errors.push({ code: 'ART_VARIANT_DIMENSIONS_INVALID', scope: `${assetId}:${format}` });
  }
}

/**
 * Validate only the project-to-CEOS declaration boundary.
 * `currentHead` is supplied by the caller so stale manifests fail closed.
 */
export function verifyNarrativeArtHandoff(model, manifest, { currentHead } = {}) {
  const errors = [];
  const fail = (code, scope = '') => errors.push({ code, scope });
  if (!record(manifest) || manifest.schemaVersion !== 1 ||
      manifest.profile !== 'narrative-game' || !Number.isSafeInteger(manifest.episode) ||
      manifest.episode < 1 || !record(manifest.sceneAssets) || !record(manifest.assets)) {
    return {
      status: 'BLOCKED_DUAL_FORMAT_HANDOFF',
      errors: [{ code: 'ART_HANDOFF_SCHEMA', scope: 'root' }],
      visualAcceptance: 'NOT_VERIFIED'
    };
  }
  if (!HEAD.test(manifest.sourceHead ?? '') || (currentHead && manifest.sourceHead !== currentHead)) {
    fail('ART_SOURCE_HEAD_MISMATCH', 'manifest');
  }
  const scenes = Array.isArray(model?.scenes)
    ? model.scenes.filter(scene => scene?.episode === manifest.episode)
    : [];
  if (!scenes.length) fail('ART_EPISODE_SCENES_MISSING', `episode:${manifest.episode}`);
  const used = new Set();
  for (const scene of scenes) {
    const assetId = manifest.sceneAssets[scene.id];
    if (!validId(assetId)) {
      fail('ART_SCENE_UNMAPPED', scene.id);
      continue;
    }
    used.add(assetId);
  }
  for (const assetId of used) {
    const asset = manifest.assets[assetId];
    if (!record(asset)) {
      fail('ART_ASSET_UNDECLARED', assetId);
      continue;
    }
    for (const format of FORMATS) variantDescriptor(asset[format], assetId, format, errors);
    if (asset.portrait?.path && asset.desktop?.path && asset.portrait.path === asset.desktop.path) {
      fail('ART_VARIANTS_MUST_HAVE_SEPARATE_PATHS', assetId);
    }
  }
  return {
    status: errors.length ? 'BLOCKED_DUAL_FORMAT_HANDOFF' : 'PASS_DUAL_FORMAT_HANDOFF_DECLARED',
    errors,
    requiredScenes: scenes.length,
    mappedScenes: scenes.length - errors.filter(error => error.code === 'ART_SCENE_UNMAPPED').length,
    uniqueAssets: used.size,
    formatsChecked: used.size * FORMATS.length,
    visualAcceptance: 'NOT_VERIFIED',
    disclaimer: 'Declaration only. CEOS verifies confined files, PNG bytes, dimensions, hashes and independent pixel acceptance.'
  };
}

export function runNarrativeArtHandoff(root, profile, manifestPath, options = {}) {
  if (profile?.schemaVersion !== 1 || profile?.profile !== 'narrative-game' || typeof profile?.enabled !== 'boolean') {
    return { status: 'BLOCKED_DUAL_FORMAT_HANDOFF', errors: [{ code: 'BAD_PROFILE', scope: 'profile' }] };
  }
  if (!profile.enabled) return { status: 'SKIPPED_OPT_IN_PROFILE', errors: [], reason: 'narrative-game is disabled' };
  const model = JSON.parse(fs.readFileSync(readConfined(root, profile.modelPath), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(readConfined(root, manifestPath), 'utf8'));
  return verifyNarrativeArtHandoff(model, manifest, options);
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? null : process.argv[index + 1];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const root = path.resolve(option('--project') || process.cwd());
    const profilePath = option('--profile') || 'config/optional-profiles/narrative-game.json';
    const profile = JSON.parse(fs.readFileSync(readConfined(root, profilePath), 'utf8'));
    const manifestPath = option('--manifest') || profile.dualFormatManifestPath;
    if (!manifestPath) throw new Error('Missing --manifest or profile.dualFormatManifestPath');
    const result = runNarrativeArtHandoff(root, profile, manifestPath, {
      currentHead: option('--source-head') || undefined
    });
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    if (result.status === 'BLOCKED_DUAL_FORMAT_HANDOFF') process.exitCode = 2;
  } catch (error) {
    process.stderr.write(`NARRATIVE_ART_HANDOFF_ERROR: ${error.message}\n`);
    process.exitCode = 2;
  }
}
