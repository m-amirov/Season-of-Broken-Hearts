import graph from '../../narrative/graph.json' with { type: 'json' };
import { getDialogueLines, validateGraph } from '../../src/narrative/state.mjs';

const errors = [];
const graphReport = validateGraph(graph);
if (!graphReport.valid) errors.push(...graphReport.errors);

const hook = graph.scenes.find(scene => scene.id === 'ep1_hook');
for (const locale of graph.locales) {
  const numbers = getDialogueLines(hook, locale, { ...graph.initialState, hotelEvidence: 'numbers' });
  const staff = getDialogueLines(hook, locale, { ...graph.initialState, hotelEvidence: 'staff' });
  const numbersConditional = numbers.filter(line => line.when?.hotelEvidence === 'numbers');
  const staffConditional = staff.filter(line => line.when?.hotelEvidence === 'staff');
  if (numbersConditional.length !== 1) errors.push(`ep1_hook:${locale}:numbers-conditional-count`);
  if (staffConditional.length !== 1) errors.push(`ep1_hook:${locale}:staff-conditional-count`);
  if (numbers.some(line => line.when?.hotelEvidence === 'staff')) errors.push(`ep1_hook:${locale}:staff-line-leaked-into-numbers`);
  if (staff.some(line => line.when?.hotelEvidence === 'numbers')) errors.push(`ep1_hook:${locale}:numbers-line-leaked-into-staff`);
}

const result = {
  status: errors.length ? 'FAIL_CONDITIONAL_DIALOGUE_SCHEMA' : 'PASS_CONDITIONAL_DIALOGUE_SCHEMA',
  source: 'narrative/graph.json + src/narrative/state.mjs',
  checked: {
    scene: 'ep1_hook',
    locales: graph.locales,
    conditions: ['hotelEvidence=numbers', 'hotelEvidence=staff']
  },
  errors
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (errors.length) process.exitCode = 1;
