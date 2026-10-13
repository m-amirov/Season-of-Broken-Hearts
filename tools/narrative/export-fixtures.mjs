import { writeFile } from 'node:fs/promises';
import graph from '../../narrative/graph.json' with { type: 'json' };
import { NarrativeEngine } from '../../src/narrative/engine.mjs';

function saveSample(engine, samples) {
  const snapshot = engine.snapshot();
  const sample = {
    schemaVersion: 1,
    sceneId: snapshot.cursor.sceneId,
    state: snapshot.state,
    locale: snapshot.locale,
    dialogueIndex: snapshot.cursor.dialogueIndex
  };
  const fingerprint = JSON.stringify([sample.sceneId, sample.state, sample.locale, sample.dialogueIndex]);
  if (!samples.some(existing => JSON.stringify([existing.sceneId, existing.state, existing.locale, existing.dialogueIndex]) === fingerprint)) {
    samples.push(sample);
  }
}

function advanceToChoice(engine) {
  while (!engine.choices().length && !engine.isEnding()) engine.advance();
}

function collectPath(choiceIndexes, samples) {
  const engine = new NarrativeEngine(graph);
  advanceToChoice(engine);
  saveSample(engine, samples);
  for (const choiceIndex of choiceIndexes) {
    const choices = engine.choices();
    if (!choices.length) break;
    engine.choose(choices[Math.min(choiceIndex, choices.length - 1)].id);
    saveSample(engine, samples);
    advanceToChoice(engine);
    saveSample(engine, samples);
  }
}

const samples = [];
collectPath([0, 0, 0, 0], samples);
collectPath([1, 1, 1, 1], samples);
collectPath([0, 1, 0, 1], samples);

await writeFile('narrative/save-fixtures.json', `${JSON.stringify({ schemaVersion: 1, samples }, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ status: 'EXPORTED_FROM_RUNTIME_ENGINE', samples: samples.length, source: 'narrative/graph.json' }, null, 2));
