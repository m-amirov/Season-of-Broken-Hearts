import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const modulePath = fileURLToPath(import.meta.url);

export function validateSeasonArchitecture(contract) {
  const errors = [];
  const routes = Array.isArray(contract?.routes) ? contract.routes : [];
  const relationshipEndings = Array.isArray(contract?.relationshipEndings) ? contract.relationshipEndings : [];
  const hotelOutcomes = Array.isArray(contract?.hotelOutcomes) ? contract.hotelOutcomes : [];
  const timeline = Array.isArray(contract?.timeline) ? contract.timeline : [];
  const promises = Array.isArray(contract?.promises) ? contract.promises : [];
  const ids = values => new Set(values.map(value => value?.id));

  if (contract?.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (contract?.season?.episodeCount !== 10) errors.push('episodeCount must be 10');
  if (contract?.season?.routeLockEpisode !== 6) errors.push('routeLockEpisode must be 6');
  if (routes.length !== 4 || ids(routes).size !== 4) errors.push('exactly four unique routes are required');
  if (JSON.stringify([...ids(routes)].sort()) !== JSON.stringify(['elio', 'independent', 'leo', 'matteo'])) errors.push('route IDs are incomplete');
  if (relationshipEndings.length !== 7 || ids(relationshipEndings).size !== 7) errors.push('exactly seven unique relationship endings are required');
  if (hotelOutcomes.length !== 3 || ids(hotelOutcomes).size !== 3) errors.push('exactly three unique hotel outcomes are required');
  if (contract?.season?.expectedLegalEndingPairs !== 21) errors.push('expected legal ending pairs must be 21');
  if (contract?.routeLock?.sceneId !== 'ep6_route_choice' || contract?.routeLock?.allRoutesReachable !== true) errors.push('route-lock contract is incomplete');

  const routeEndingCounts = Object.fromEntries(routes.map(route => [route.id, 0]));
  for (const ending of relationshipEndings) {
    if (!(ending.route in routeEndingCounts)) errors.push(`ending ${ending.id} has unknown route`);
    else routeEndingCounts[ending.route] += 1;
    if (typeof ending.condition !== 'string' || !ending.condition.includes(`route=${ending.route}`)) errors.push(`ending ${ending.id} is not route-guarded`);
    if (ending.condition.includes('hotelOutcome')) errors.push(`relationship ending ${ending.id} couples to hotelOutcome`);
  }
  if (JSON.stringify(routeEndingCounts) !== JSON.stringify({ matteo: 2, leo: 2, elio: 2, independent: 1 })) errors.push('relationship ending distribution is invalid');
  for (const outcome of hotelOutcomes) {
    if (typeof outcome.condition !== 'string' || outcome.condition.includes('endingId')) errors.push(`hotel outcome ${outcome.id} couples to endingId`);
  }

  const episodeNumbers = timeline.map(item => item?.episode);
  if (JSON.stringify(episodeNumbers) !== JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])) errors.push('timeline must cover episodes 1 through 10 in order');
  for (let index = 1; index < timeline.length; index += 1) {
    if (timeline[index].days[0] <= timeline[index - 1].days[1]) errors.push(`timeline overlaps at episode ${timeline[index].episode}`);
  }
  if (timeline[0]?.days?.[0] !== 1 || timeline.at(-1)?.days?.[1] !== 70) errors.push('timeline must span days 1 through 70');

  const requiredPromises = ['matteo-negotiation-documents', 'elio-restaurant-departure', 'season-hotel-outcome'];
  for (const id of requiredPromises) if (!ids(promises).has(id)) errors.push(`required promise missing: ${id}`);
  const requiredInvariants = contract?.validationContract?.requiredInvariants ?? [];
  for (const invariant of ['route-lock-is-explicit', 'hotel-outcome-does-not-read-relationship-ending', 'relationship-ending-does-not-read-hotel-outcome', 'back-restores-complete-state']) {
    if (!requiredInvariants.includes(invariant)) errors.push(`required invariant missing: ${invariant}`);
  }
  return {
    valid: errors.length === 0,
    errors,
    coverage: {
      episodes: timeline.length,
      routes: routes.length,
      relationshipEndings: relationshipEndings.length,
      hotelOutcomes: hotelOutcomes.length,
      expectedEndingPairs: contract?.season?.expectedLegalEndingPairs ?? null,
      promises: promises.length
    }
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  const contractPath = path.join(root, 'narrative', 'season-architecture.json');
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  const report = validateSeasonArchitecture(contract);
  console.log(JSON.stringify({ status: report.valid ? 'PASS_STAGE9_NARRATIVE_ARCHITECTURE_CONTRACT' : 'FAIL_STAGE9_NARRATIVE_ARCHITECTURE_CONTRACT', ...report }, null, 2));
  if (!report.valid) process.exitCode = 1;
}
