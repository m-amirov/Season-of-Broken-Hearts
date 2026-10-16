import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyEffects, canEnter, createInitialState, getDialogueLines } from '../../src/narrative/state.mjs';
import { exploreGraph } from '../../src/narrative/route-explorer.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const graph = JSON.parse(fs.readFileSync(path.join(root, 'narrative/graph.json'), 'utf8'));
const outputDir = path.join(root, 'artifacts/editorial');
const targetEpisodes = [2, 3];
const maxStates = 1_000_000;
const wordsPerMinute = 180;
const secondsPerChoice = 3;
const secondsPerSceneTransition = 1.5;

function wordCount(text) {
  return (String(text).match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) ?? []).length;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function range(values) {
  return { min: values.reduce((min, value) => Math.min(min, value), Infinity), max: values.reduce((max, value) => Math.max(max, value), -Infinity) };
}

function minutes(seconds) {
  return Number((seconds / 60).toFixed(1));
}

function estimate(words, scenes, choices) {
  const lexicalSeconds = words / wordsPerMinute * 60;
  const interactionSeconds = choices * secondsPerChoice + Math.max(0, scenes - 1) * secondsPerSceneTransition;
  return {
    lexicalSeconds: Number(lexicalSeconds.toFixed(1)),
    lexicalMinutes: minutes(lexicalSeconds),
    withInteractionsSeconds: Number((lexicalSeconds + interactionSeconds).toFixed(1)),
    withInteractionsMinutes: minutes(lexicalSeconds + interactionSeconds)
  };
}

function emptyMetrics() {
  return { ruWords: 0, enWords: 0, scenes: 0, choices: 0 };
}

function addSceneMetrics(metrics, scene, state) {
  const next = { ...metrics, scenes: metrics.scenes + 1 };
  for (const locale of ['ru', 'en']) {
    const words = getDialogueLines(scene, locale, state).reduce((total, line) => total + wordCount(line.text), 0);
    next[`${locale}Words`] += words;
  }
  return next;
}

function recordPath(records, episode, metrics) {
  if (!targetEpisodes.includes(episode)) return;
  records[episode].push({
    ...metrics,
    ruEstimate: estimate(metrics.ruWords, metrics.scenes, metrics.choices),
    enEstimate: estimate(metrics.enWords, metrics.scenes, metrics.choices)
  });
}

function collectReachablePassages() {
  const sceneById = new Map(graph.scenes.map(scene => [scene.id, scene]));
  const records = { 2: [], 3: [] };
  const queue = [{ sceneId: graph.start, state: createInitialState(graph), activeEpisode: null, metrics: emptyMetrics() }];
  let cursor = 0;
  let visitedStates = 0;
  let truncated = false;

  while (cursor < queue.length) {
    if (visitedStates >= maxStates) {
      truncated = true;
      break;
    }
    const node = queue[cursor++];
    visitedStates += 1;
    const scene = sceneById.get(node.sceneId);
    if (!scene) throw new Error(`Missing scene ${node.sceneId}`);

    const episodeChanged = node.activeEpisode !== null && node.activeEpisode !== scene.episode;
    if (episodeChanged) recordPath(records, node.activeEpisode, node.metrics);
    const activeEpisode = scene.episode;
    const metrics = targetEpisodes.includes(activeEpisode)
      ? addSceneMetrics(episodeChanged ? emptyMetrics() : node.metrics, scene, node.state)
      : emptyMetrics();
    const choices = (scene.choices ?? []).filter(choice => canEnter(choice, node.state));
    if (choices.length) {
      for (const choice of choices) {
        const choiceMetrics = targetEpisodes.includes(activeEpisode)
          ? { ...metrics, choices: metrics.choices + 1 }
          : metrics;
        queue.push({
          sceneId: choice.to,
          state: applyEffects(node.state, choice.effects, graph.stateSchema),
          activeEpisode,
          metrics: choiceMetrics
        });
      }
      continue;
    }
    if (scene.episodeEnd === true) {
      if (!scene.next) throw new Error(`Episode end ${scene.id} has no next scene`);
      queue.push({ sceneId: scene.next, state: node.state, activeEpisode, metrics });
      continue;
    }
    if (scene.ending === true) {
      recordPath(records, activeEpisode, metrics);
      continue;
    }
    if (scene.next) queue.push({ sceneId: scene.next, state: node.state, activeEpisode, metrics });
  }

  return { records, visitedStates, truncated };
}

function sourceCorpus(episode) {
  const seen = { ru: new Set(), en: new Set() };
  for (const scene of graph.scenes.filter(scene => scene.episode === episode)) {
    for (const locale of ['ru', 'en']) {
      for (const line of scene.dialogue[locale] ?? []) seen[locale].add(`${line.speaker ?? ''}|${line.text}`);
    }
  }
  return {
    scenes: graph.scenes.filter(scene => scene.episode === episode).length,
    choices: graph.scenes.filter(scene => scene.episode === episode).reduce((sum, scene) => sum + (scene.choices?.length ?? 0), 0),
    uniqueRuWords: [...seen.ru].reduce((sum, line) => sum + wordCount(line.split('|').slice(1).join('|')), 0),
    uniqueEnWords: [...seen.en].reduce((sum, line) => sum + wordCount(line.split('|').slice(1).join('|')), 0)
  };
}

function summarize(records) {
  const summarizeLocale = locale => {
    const wordKey = `${locale}Words`;
    const values = records.map(record => record[wordKey]);
    const sceneValues = records.map(record => record.scenes);
    const choiceValues = records.map(record => record.choices);
    const estimated = records.map(record => record[`${locale}Estimate`]);
    const wordRange = range(values);
    const sceneRange = range(sceneValues);
    const choiceRange = range(choiceValues);
    const lexicalMinutes = estimated.map(item => item.lexicalMinutes);
    const interactionMinutes = estimated.map(item => item.withInteractionsMinutes);
    const lexicalRange = range(lexicalMinutes);
    const interactionRange = range(interactionMinutes);
    return {
      words: { ...wordRange, median: median(values) },
      scenes: { ...sceneRange, median: median(sceneValues) },
      choices: { ...choiceRange, median: median(choiceValues) },
      readingWithoutInteractionsMinutes: {
        ...lexicalRange,
        median: median(lexicalMinutes)
      },
      estimatedWithInteractionsMinutes: {
        ...interactionRange,
        median: median(interactionMinutes)
      }
    };
  };
  return { ru: summarizeLocale('ru'), en: summarizeLocale('en') };
}

function consequenceChoices(episode) {
  const significantKeys = new Set([
    'publicAgreement', 'fakeDatingStatus', 'matteoPublicGesture', 'biancaTrust',
    'staffTrust', 'leoAccountability', 'leoEvidence', 'ep3SurveyChoice',
    'ep3SurveyAction', 'fundingEvidence'
  ]);
  return graph.scenes.filter(scene => scene.episode === episode).flatMap(scene => (scene.choices ?? [])
    .filter(choice => Object.keys(choice.effects ?? {}).some(key => significantKeys.has(key)))
    .map(choice => ({ sceneId: scene.id, choiceId: choice.id, effects: choice.effects })));
}

const routeReport = exploreGraph(graph, { maxStates });
const passageReport = collectReachablePassages();
if (passageReport.truncated) throw new Error(`Literary passage exploration exceeded ${maxStates} states`);

const report = {
  schemaVersion: 1,
  generatedFrom: 'narrative/graph.json',
  assumptions: {
    wordsPerMinute,
    secondsPerChoice,
    secondsPerSceneTransition,
    note: 'Reading time is a transparent lexical estimate; interaction time is not a measured playtest.'
  },
  routeExplorer: {
    maxStates,
    valid: routeReport.valid,
    visitedStates: routeReport.visitedStates,
    terminals: routeReport.terminals.length,
    visitedScenes: routeReport.visitedScenes.size,
    deadEnds: routeReport.deadEnds,
    errors: routeReport.errors,
    truncated: routeReport.truncated
  },
  episodePassages: {},
  editorialNotes: [
    'EP2 agreement consent and public gesture consent are separate state domains.',
    'EP2 refusal preserves work, pay, professional access and the EP3 transition.',
    'EP2 agreement closes on day 9; EP4 requires fresh consent for any later public gesture.',
    'EP3 distinguishes an unverified Aurea drawing lead from a checked attachment.',
    'EP6 remains the only planned route-lock; EP2 and EP3 outcomes are route-neutral.'
  ],
  openPromises: [
    { id: 'matteo-negotiation-documents', status: 'reinforced; payoff planned for EP6+' },
    { id: 'bianca-not-villain', status: 'reinforced; payoff planned for EP6+' },
    { id: 'leo-aurea-link', status: 'reinforced with verified/unverified provenance; payoff planned for EP6+' },
    { id: 'nika-career-recovery', status: 'reinforced through EP2 work choices; payoff planned for EP5+' }
  ]
};

for (const episode of targetEpisodes) {
  const records = passageReport.records[episode];
  report.episodePassages[episode] = {
    sourceCorpus: sourceCorpus(episode),
    reachablePassages: records.length,
    summary: summarize(records),
    significantConsequenceChoices: consequenceChoices(episode)
  };
}

const md = [
  '# Stage 9.3 literary completeness report',
  '',
  `Generated from narrative/graph.json; route explorer max states: ${maxStates}.`,
  '',
  `Reading estimate: ${wordsPerMinute} words/minute; +${secondsPerChoice}s per choice and +${secondsPerSceneTransition}s per scene transition for the interaction estimate.`,
  '',
  `Route explorer: ${routeReport.valid ? 'PASS' : 'FAIL'}; ${routeReport.visitedStates} states; ${routeReport.terminals.length} terminals; ${routeReport.visitedScenes.size} scenes; dead ends: ${routeReport.deadEnds.length}; truncated: ${routeReport.truncated}.`,
  '',
  '| Episode | Source scenes | Source choices | Unique RU words | Unique EN words | Reachable passages | RU words min/median/max | EN words min/median/max | RU reading min/median/max | EN reading min/median/max |',
  '|---:|---:|---:|---:|---:|---:|---|---|---|---|',
  ...targetEpisodes.map(episode => {
    const item = report.episodePassages[episode];
    const ru = item.summary.ru;
    const en = item.summary.en;
    return `| EP${episode} | ${item.sourceCorpus.scenes} | ${item.sourceCorpus.choices} | ${item.sourceCorpus.uniqueRuWords} | ${item.sourceCorpus.uniqueEnWords} | ${item.reachablePassages} | ${ru.words.min}/${ru.words.median}/${ru.words.max} | ${en.words.min}/${en.words.median}/${en.words.max} | ${ru.readingWithoutInteractionsMinutes.min}/${ru.readingWithoutInteractionsMinutes.median}/${ru.readingWithoutInteractionsMinutes.max} min | ${en.readingWithoutInteractionsMinutes.min}/${en.readingWithoutInteractionsMinutes.median}/${en.readingWithoutInteractionsMinutes.max} min |`;
  }),
  '',
  'The “with interactions” estimate is available in the JSON alongside the lexical estimate; neither replaces a blind timed playtest.',
  '',
  '## Significant consequence coverage',
  '',
  ...targetEpisodes.map(episode => `- EP${episode}: ${report.episodePassages[episode].significantConsequenceChoices.length} choices write meaningful trust, consent, evidence or work-state consequences.`),
  '',
  '## Editorial notes',
  '',
  ...report.editorialNotes.map(note => `- ${note}`),
  '',
  '## Unfilled season promises',
  '',
  ...report.openPromises.map(item => `- \`${item.id}\`: ${item.status}`)
].join('\n');

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'stage9.3-literary-report.json'), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(path.join(outputDir, 'stage9.3-literary-report.md'), `${md}\n`);
console.log(JSON.stringify({ ok: true, report: 'artifacts/editorial/stage9.3-literary-report.json', routeExplorer: report.routeExplorer, episodes: Object.fromEntries(targetEpisodes.map(episode => [episode, { passages: report.episodePassages[episode].reachablePassages, ru: report.episodePassages[episode].summary.ru, en: report.episodePassages[episode].summary.en }])) }, null, 2));
