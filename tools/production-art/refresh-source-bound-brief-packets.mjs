import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const write = (file, value) => fs.writeFileSync(path.join(root, file), `${JSON.stringify(value, null, 2)}\n`);
const head = spawnSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).stdout.trim();
const manifest = read('artifacts/production-art/character-reference-manifest.json');
const refs = new Map(manifest.references.map(ref => [ref.id, {
  id: ref.id,
  path: ref.path,
  sha256: ref.sha256,
  width: ref.width,
  height: ref.height
}]));

function refresh(input, output, status) {
  const packet = read(input);
  const ids = new Set(packet.briefs.flatMap(brief => brief.requiredCast ?? brief.characterReferenceIds ?? []));
  packet.sourceHead = head;
  packet.sourceBasis = 'All source inputs below are hashed from the exact current committed HEAD; historical packet remains preserved.';
  packet.status = status;
  packet.recordedAt = '2026-10-20';
  packet.sourceFiles = packet.sourceFiles.filter(source => fs.existsSync(path.join(root, source.path)));
  if (!packet.sourceFiles.some(source => source.path === 'artifacts/production-art/character-reference-manifest.json'))
    packet.sourceFiles.push({path: 'artifacts/production-art/character-reference-manifest.json'});
  packet.sourceFiles = packet.sourceFiles.map(source => ({...source, sha256: sha256(source.path)}));
  packet.characterReferences = [...ids].map(id => refs.get(id)).filter(Boolean);
  packet.briefs = packet.briefs.map(brief => ({
    ...brief,
    sceneIds: brief.sceneIds ?? [brief.sceneId],
    assetId: brief.assetId ?? brief.assetIds?.[0],
    characterReferenceIds: brief.characterReferenceIds ?? brief.requiredCast,
    forbiddenProps: brief.forbiddenProps ?? brief.forbidden,
    acceptanceCriteria: brief.acceptanceCriteria ?? brief.acceptance,
    candidateNumber: brief.candidateNumber ?? 1,
    priorRejection: brief.priorRejection ?? null,
    generationAuthorized: false
  }));
  delete packet.gateResult;
  write(output, packet);
}

refresh(
  'artifacts/production-art/stage9.6/EP3_SOURCE_BOUND_ART_BRIEFS_20261020.json',
  'artifacts/production-art/stage9.6/EP3_SOURCE_BOUND_ART_BRIEFS_CURRENT_HEAD_20261020.json',
  'BRIEFS_READY_GENERATION_NOT_AUTHORIZED'
);
refresh(
  'artifacts/production-art/stage9.7/EP4_FIRST_BATCH_SOURCE_BOUND_BRIEFS_20261020.json',
  'artifacts/production-art/stage9.7/EP4_FIRST_BATCH_SOURCE_BOUND_BRIEFS_CURRENT_HEAD_20261020.json',
  'BRIEFS_READY_GENERATION_NOT_AUTHORIZED'
);
