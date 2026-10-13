import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { createInputController } from '../../src/ui/input-controller.mjs';

const manifest = JSON.parse(fs.readFileSync(new URL('../../narrative/assets.json', import.meta.url), 'utf8'));

function fakeButton(choiceId = undefined) {
  const listeners = new Map();
  return {
    dataset: choiceId ? { choiceId } : {},
    disabled: false,
    addEventListener(type, handler) { listeners.set(type, handler); },
    removeEventListener(type) { listeners.delete(type); },
    click() { listeners.get('click')?.({ currentTarget: this, preventDefault() {} }); }
  };
}

test('every EP1 scene asset resolves to a named placeholder', () => {
  const graph = JSON.parse(fs.readFileSync(new URL('../../narrative/graph.json', import.meta.url), 'utf8'));
  for (const scene of graph.scenes) {
    assert.equal(manifest.assets[scene.assetId].kind, 'placeholder');
    assert.match(manifest.assets[scene.assetId].src, /^\/assets\/.+\.svg$/);
  }
});

test('choice input owns the gesture and cannot fall through to advance', () => {
  const next = fakeButton();
  const choice = fakeButton('matteo_formal');
  const calls = [];
  const controller = createInputController({ nextButton: next }, {
    onAdvance: () => calls.push('advance'),
    onChoose: id => calls.push(`choose:${id}`)
  });
  controller.bindChoiceButtons([choice]);

  choice.click();
  next.click();
  assert.deepEqual(calls, ['choose:matteo_formal']);

  controller.unlock();
  next.click();
  assert.deepEqual(calls, ['choose:matteo_formal', 'advance']);
  controller.destroy();
});
