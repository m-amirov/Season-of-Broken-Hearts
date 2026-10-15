import fs from 'node:fs';
import path from 'node:path';
import { buildGraph } from '../../src/narrative/graph-builder.mjs';

const root = process.cwd();
const manifestPath = path.join(root, 'narrative', 'episodes', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const basePath = path.join(root, manifest.baseGraph);
const outputPath = path.join(root, manifest.outputGraph);
const baseGraph = JSON.parse(fs.readFileSync(basePath, 'utf8'));
const fragments = manifest.fragments.map(entry => JSON.parse(fs.readFileSync(path.join(root, entry.path), 'utf8')));
const graph = buildGraph(baseGraph, fragments);
const serialized = `${JSON.stringify(graph, null, 2)}\n`;

if (process.argv.includes('--check')) {
  const current = fs.readFileSync(outputPath, 'utf8');
  const matches = current === serialized;
  console.log(JSON.stringify({ status: matches ? 'PASS_GRAPH_BUILD_DETERMINISTIC' : 'GRAPH_BUILD_OUT_OF_DATE', episodes: manifest.authoredEpisodes, output: manifest.outputGraph }, null, 2));
  if (!matches) process.exitCode = 1;
} else {
  fs.writeFileSync(outputPath, serialized, 'utf8');
  console.log(JSON.stringify({ status: 'GRAPH_BUILT', episodes: manifest.authoredEpisodes, scenes: graph.scenes.length, output: manifest.outputGraph }, null, 2));
}
