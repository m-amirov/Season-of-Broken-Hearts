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
    dispatch(type, event = {}) {
      listeners.get(type)?.({ currentTarget: this, preventDefault() {}, ...event });
    },
    click(detail = 1) {
      this.dispatch('click', { detail });
    }
  };
}

function fakeEventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, handler) { listeners.set(type, handler); },
    removeEventListener(type) { listeners.delete(type); },
    dispatch(type, event = {}) {
      listeners.get(type)?.({ preventDefault() {}, ...event });
    }
  };
}

test('EP1 CG mappings are scoped and unfinished scenes remain placeholders', () => {
  const graph = JSON.parse(fs.readFileSync(new URL('../../narrative/graph.json', import.meta.url), 'utf8'));
  const accepted = new Set([
    'ep1_arrival',
    'ep1_gate',
    'ep1_matteo_formal_response',
    'ep1_matteo_direct_response',
    'ep1_kitchen',
    'ep1_elio_humor_response',
    'ep1_elio_boundary_response',
    'ep1_leo_entrance'
  ]);
  for (const scene of graph.scenes) {
    const asset = manifest.assets[scene.assetId];
    assert.ok(asset, `missing manifest entry for ${scene.id}`);
    if (accepted.has(scene.id)) {
      assert.equal(asset.kind, 'production-cg');
      assert.match(asset.src, /^\/assets\/production\/cg\/.+\.png$/);
      assert.match(asset.sha256, /^[a-f0-9]{64}$/);
      assert.deepEqual(asset.dimensions, { width: 1024, height: 1536 });
    } else {
      assert.equal(asset.kind, 'placeholder');
      assert.match(asset.src, /^\/assets\/.+\.svg$/);
    }
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

test('one pointer gesture owns its click and fast repeat cannot cross a rerender lock', () => {
  const next = fakeButton();
  const choice = fakeButton('leo_distance');
  const calls = [];
  const controller = createInputController({ nextButton: next }, {
    onAdvance: () => calls.push('advance'),
    onChoose: id => calls.push(`choose:${id}`)
  });
  controller.bindChoiceButtons([choice]);

  choice.dispatch('pointerdown', { pointerId: 7, pointerType: 'touch' });
  choice.dispatch('pointerup', { pointerId: 7, pointerType: 'touch' });
  choice.click(1);
  choice.click(2);
  next.click(1);
  assert.deepEqual(calls, ['choose:leo_distance']);

  controller.unlock();
  next.click(1);
  assert.deepEqual(calls, ['choose:leo_distance', 'advance']);
  controller.destroy();
});

test('pointerup outside the pressed button releases ownership for the next button', () => {
  const gestureTarget = fakeEventTarget();
  const firstChoice = fakeButton('matteo_formal');
  const secondChoice = fakeButton('matteo_direct');
  const calls = [];
  const controller = createInputController({ gestureTarget }, {
    onChoose: id => calls.push(`choose:${id}`)
  });
  controller.bindChoiceButtons([firstChoice, secondChoice]);

  firstChoice.dispatch('pointerdown', { pointerId: 21, pointerType: 'touch' });
  gestureTarget.dispatch('pointerup', { pointerId: 21, pointerType: 'touch' });
  secondChoice.click(1);

  assert.deepEqual(calls, ['choose:matteo_direct']);
  controller.destroy();
});

test('pointercancel outside the pressed button releases ownership', () => {
  const gestureTarget = fakeEventTarget();
  const choice = fakeButton('leo_hear');
  const calls = [];
  const controller = createInputController({ gestureTarget }, {
    onChoose: id => calls.push(`choose:${id}`)
  });
  controller.bindChoiceButtons([choice]);

  choice.dispatch('pointerdown', { pointerId: 22, pointerType: 'touch' });
  gestureTarget.dispatch('pointercancel', { pointerId: 22, pointerType: 'touch' });
  choice.click(1);

  assert.deepEqual(calls, ['choose:leo_hear']);
  controller.destroy();
});

test('stage tap owns one pointer gesture and advances exactly once', () => {
  const stage = fakeButton();
  const calls = [];
  const controller = createInputController({ advanceSurface: stage }, {
    onAdvance: () => calls.push('advance')
  });

  stage.dispatch('pointerdown', { pointerId: 31, pointerType: 'touch', isPrimary: true, clientX: 20, clientY: 20 });
  stage.dispatch('pointerup', { pointerId: 31, pointerType: 'touch', isPrimary: true, clientX: 20, clientY: 20 });
  assert.deepEqual(calls, []);
  stage.click(1);
  stage.click(2);

  assert.deepEqual(calls, ['advance']);
  controller.destroy();
});

test('stage does not advance from drags, long presses, menu modal or choice controls', () => {
  const stage = fakeButton();
  const choice = fakeButton('matteo_formal');
  const gestureTarget = fakeEventTarget();
  const calls = [];
  const controller = createInputController({ advanceSurface: stage, gestureTarget }, {
    onAdvance: () => calls.push('advance'),
    onChoose: id => calls.push(`choose:${id}`)
  });
  controller.bindChoiceButtons([choice]);

  stage.dispatch('pointerdown', { pointerId: 32, pointerType: 'touch', isPrimary: true, clientX: 10, clientY: 10 });
  stage.dispatch('pointermove', { pointerId: 32, pointerType: 'touch', isPrimary: true, clientX: 40, clientY: 10 });
  stage.dispatch('pointerup', { pointerId: 32, pointerType: 'touch', isPrimary: true, clientX: 40, clientY: 10 });
  stage.click(1);

  stage.dispatch('pointerdown', { pointerId: 33, pointerType: 'touch', isPrimary: true, clientX: 10, clientY: 10 });
  stage.dispatch('pointerup', { pointerId: 33, pointerType: 'touch', isPrimary: true, clientX: 10, clientY: 10, duration: 900 });
  stage.click(1);

  controller.setMenuOpen(true);
  stage.click(1);
  controller.setMenuOpen(false);
  choice.click(1);

  assert.deepEqual(calls, ['choose:matteo_formal']);
  controller.destroy();
});


test('cinematic reader has an independent episode slide and a borderless dialogue layer', () => {
  const style = fs.readFileSync(new URL('../../src/styles.css', import.meta.url), 'utf8');
  const renderer = fs.readFileSync(new URL('../../src/ui/renderer-stage6.mjs', import.meta.url), 'utf8');
  assert.match(style, /\.reader-sheet\s*\{[^}]*border:\s*0;/s);
  assert.match(style, /\.reader-sheet\s*\{[^}]*background:\s*transparent;/s);
  assert.match(style, /\.episode-intro\s*\{/);
  assert.match(renderer, /chapter\.title/);
  assert.match(renderer, /sceneTitle\.hidden = true/);
  assert.match(renderer, /advanceHint\.hidden = choiceButtons\.length > 0 \|\| complete \|\| !engine\.showTutorialHint\(\)/);
});
