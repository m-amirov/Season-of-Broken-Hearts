import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const matrix = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/production-art/ep1-wardrobe-continuity-matrix.json'), 'utf8'));
const outputDir = path.join(root, 'artifacts/production-art/art-briefs/wardrobe-rework');
fs.mkdirSync(outputDir, { recursive: true });

const authored = {
  'ep1-arrival-cg': { location: 'Villa Serena stone gate and coastal road', time: 'morning, warm Mediterranean daylight', action: 'Nika closes the taxi door and stands beside her vintage suitcase and practical bag at the Villa Serena gate.' },
  'ep1-matteo-gate-cg': { location: 'Villa Serena old coastal gate and stone entrance court', time: 'morning, continuous with the arrival', action: 'Matteo offers one hand while holding a ring of keys and a closed folder; Nika meets him at a respectful professional distance.' },
  'ep1-lobby-cg': { location: 'Villa Serena old-stone lobby with arches and guest photographs', time: 'morning, continuous walk from the gate', action: 'Matteo guides Nika through the lobby and selects a key while she studies the working space.' },
  'ep1-elio-kitchen-cg': { location: 'Villa Serena working professional kitchen', time: 'late morning, hot daylight through service windows', action: 'Elio holds an upright kitchen knife like a conductor baton, argues with a saucepan and sets a cup beside Nika while cookware remains active around him.' },
  'ep1-matteo-office-cg': { location: 'Villa Serena ground-floor office with shutters and a practical work table', time: 'noon to afternoon', action: 'Matteo shows schedules, supplier papers, keys and a closed red-tabbed folder while Nika works through the hotel staffing crisis.' },
  'ep1-staff-laundry-cg': { location: 'Villa Serena laundry with folding table, baskets and shelving', time: 'afternoon', action: 'Giulia folds linen, Elio carries a shift list and two trays, and Nika listens to the staff questions beside the working machines.' },
  'ep1-harbor-afternoon-cg': { location: 'stone harbor promenade and public waterfront', time: 'after lunch, late afternoon daylight', action: 'Nika walks beside the water with an empty coffee cup while Elio speaks with her about staff and the hotel.' },
  'ep1-leo-harbor-cg': { location: 'far harbor pier with old coastal buildings and water reflections', time: 'blue hour, sun already behind the harbor roofs', action: 'Leo holds a tube of blueprints under his arm as he turns toward Nika and their restrained first meeting begins.' },
  'ep1-leo-night-cg': { location: 'night harbor pier with practical lights and open water', time: 'night, immediately following the blue-hour meeting', action: 'Leo lowers or rolls the blueprints while Nika holds a clear boundary; their physical distance remains part of the emotional action.' },
  'ep1-hook-cg': { location: "Nika's Villa Serena office and dark corridor beyond", time: 'evening/night after the harbor encounter', action: 'Nika finds a closed sealed Villa Serena folder on the desk while Matteo stands to stop her from opening the last page.' }
};

for (const family of matrix.families) {
  const scene = authored[family.assetId];
  for (const variant of ['portrait', 'landscape']) {
    const brief = {
      schemaVersion: 1,
      sourceHead: matrix.sourceHead,
      sceneId: family.sceneIds[0],
      coveredSceneIds: family.sceneIds,
      authoredSceneId: family.authoredSceneIds.join('|'),
      assetId: family.assetId,
      variant,
      targetDimensions: variant === 'portrait' ? { width: 1024, height: 1536 } : { width: 1672, height: 941 },
      nativeFallbackAllowed: variant === 'landscape',
      sourceExisting: `assets/production/cg/${family.assetId}${variant === 'portrait' && family.assetId === 'ep1-arrival-cg' ? '-v2' : ''}${variant === 'landscape' ? '-landscape' : ''}.png`,
      requiredCast: family.requiredCast,
      narrativeActions: family.requiredCast.map((character) => ({ character, action: scene.action })),
      location: scene.location,
      time: scene.time,
      characterReferences: family.requiredCast.map((character) => ({ character, ...matrix.characterReferences[character] })),
      wardrobe: family.wardrobe,
      dualFormatVerification: family.dualFormatVerification,
      sharedSceneDistinctness: family.sharedSceneDistinctness,
      forbiddenProps: ['extra characters', 'readable invented document text', 'logos', 'UI', 'dialogue', 'watermark', 'matching pale-linen duplicate silhouettes'],
      desktop: { composition: family.dualFormatVerification.landscape, framing: 'Independent wide composition; keep all faces, hands, authored props and environmental anchor readable above the dialogue-safe lower band.', requiredVisibleCast: family.requiredCast },
      portrait: { composition: family.dualFormatVerification.portrait, framing: 'Mobile-safe portrait composition; keep all faces, hands, authored props and the focal location readable above the dialogue layer.', requiredVisibleCast: family.requiredCast },
      qualityAcceptance: [
        'Character identity and age match the approved reference originals.',
        'Wardrobe fields match WARDROBE_CONTINUITY_V1 and distinguish shared-scene silhouettes.',
        'Authored actions and props remain visible and belong to the correct character.',
        'Portrait and landscape preserve the same wardrobe, cast, location, time and emotional beat.',
        'No baked text, UI, watermark, extra cast or spoiler reveal.'
      ],
      candidateNumber: 1,
      priorRejection: null,
      cue: { id: family.authoredSceneIds[0], at: [0, 0] },
      sceneContinuity: family.wardrobe.continuityNote,
      reworkReason: family.reworkReason
    };
    const file = path.join(outputDir, `${family.assetId}-${variant}.json`);
    fs.writeFileSync(file, `${JSON.stringify(brief, null, 2)}\n`);
  }
}
console.log(JSON.stringify({ status: 'BUILT_WARDROBE_REWORK_BRIEFS', files: matrix.families.length * 2, outputDir: path.relative(root, outputDir) }, null, 2));
