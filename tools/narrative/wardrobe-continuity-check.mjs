import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function validateWardrobeContinuity({ rules, matrix, assets }) {
  const errors = [];
  if (rules?.enforcement !== 'mandatory') errors.push('RULES_NOT_MANDATORY');
  if (rules?.ruleId !== matrix?.ruleId) errors.push('RULE_ID_MISMATCH');
  const families = Array.isArray(matrix?.families) ? matrix.families : [];
  if (families.length !== 10) errors.push(`EXPECTED_10_FAMILIES:${families.length}`);
  const expectedScenes = new Set(Array.from({ length: 18 }, (_, i) => `S${String(i + 1).padStart(2, '0')}`));
  const coveredScenes = new Set();
  const productionAssets = assets?.assets ?? {};
  for (const family of families) {
    if (!family.assetId || !productionAssets[family.assetId]) errors.push(`MISSING_ASSET:${family.assetId}`);
    for (const sceneId of family.sceneIds ?? []) coveredScenes.add(sceneId);
    const wardrobe = family.wardrobe ?? {};
    for (const key of ['continuityType', 'continuityNote']) {
      if (!wardrobe[key]) errors.push(`MISSING_WARDROBE_FIELD:${family.assetId}:${key}`);
    }
    for (const character of family.requiredCast ?? []) {
      const entry = wardrobe[character];
      for (const key of ['outfit', 'palette', 'silhouette', 'accessoriesProps']) {
        if (!entry?.[key] || (Array.isArray(entry[key]) && entry[key].length === 0)) {
          errors.push(`MISSING_WARDROBE_FIELD:${family.assetId}:${character}.${key}`);
        }
      }
    }
    if (!family.sharedSceneDistinctness?.paletteContrast || !family.sharedSceneDistinctness?.silhouetteContrast) {
      errors.push(`MISSING_SHARED_SCENE_CONTRAST:${family.assetId}`);
    }
    const dual = family.dualFormatVerification;
    if (!dual?.portrait || !dual?.landscape || !Array.isArray(dual?.invariants) || dual.invariants.length === 0) {
      errors.push(`MISSING_DUAL_FORMAT_WARDROBE_CHECK:${family.assetId}`);
    }
  }
  if (coveredScenes.size !== 18 || [...expectedScenes].some((scene) => !coveredScenes.has(scene))) {
    errors.push(`SCENE_COVERAGE_NOT_18_OF_18:${coveredScenes.size}`);
  }
  const result = {
    status: errors.length ? 'FAIL_WARDROBE_CONTINUITY_RULES' : 'PASS_WARDROBE_CONTINUITY_RULES',
    ruleId: rules?.ruleId,
    families: families.length,
    sceneCoverage: coveredScenes.size,
    errors
  };
  if (errors.length) {
    const error = new Error(JSON.stringify(result));
    error.result = result;
    throw error;
  }
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const project = process.cwd();
  const readJson = (file) => JSON.parse(fs.readFileSync(path.resolve(project, file), 'utf8'));
  const result = validateWardrobeContinuity({
    rules: readJson('config/wardrobe-rules.json'),
    matrix: readJson('artifacts/production-art/ep1-wardrobe-continuity-matrix.json'),
    assets: readJson('narrative/assets.json')
  });
  console.log(JSON.stringify(result, null, 2));
}
