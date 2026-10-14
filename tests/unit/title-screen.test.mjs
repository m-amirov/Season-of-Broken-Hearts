import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { NarrativeEngine } from '../../src/narrative/engine.mjs';
import { createRenderer } from '../../src/ui/renderer-stage6.mjs';
import { createInputController } from '../../src/ui/input-controller.mjs';

const graph = JSON.parse(fs.readFileSync(new URL('../../narrative/graph.json', import.meta.url), 'utf8'));

class FakeElement {
  constructor(tag) {
    this.tagName = tag;
    this.dataset = {};
    this.attributes = {};
    this.style = { setProperty() {} };
    this.classList = { add() {}, remove() {} };
    this.listeners = new Map();
    this.children = [];
    this.hidden = false;
    this.inert = false;
  }
  append(...items) { this.children.push(...items); }
  replaceChildren(...items) { this.children = items; }
  setAttribute(key, val) { this.attributes[key] = String(val); }
  addEventListener(type, callback) { this.listeners.set(type, callback); }
  removeEventListener(type) { this.listeners.delete(type); }
  click(detail = 1) {
    this.listeners.get('click')?.({ detail, target: this, preventDefault() {}, stopPropagation() {} });
  }
}

test('real renderer shows title first and differentiates new/returning players', async t => {
  const prior = globalThis.document;
  globalThis.document = { createElement: name => new FakeElement(name) };
  t.after(() => { if (prior === undefined) delete globalThis.document; else globalThis.document = prior; });
  const root = new FakeElement('main');
  const renderer = createRenderer(root);
  const engine = new NarrativeEngine(graph);
  const assetManager = {
    sourceFor: () => '/assets/placeholder-arrival.svg',
    preloadSceneAsset: () => Promise.resolve()
  };

  let result = renderer.render({ engine, assetManager, homeOpen: true, hasResume: false });
  assert.equal(renderer.elements.home.hidden, false);
  assert.equal(renderer.elements.homeStartButton.hidden, false);
  assert.equal(renderer.elements.homeResumeButton.hidden, true);
  assert.equal(renderer.elements.homeNewGameButton.hidden, true);
  assert.equal(renderer.elements.stage.inert, true);
  assert.equal(renderer.elements.episodeIntro.hidden, true);
  assert.equal(renderer.elements.home.attributes['aria-label'], 'Главное меню');
  assert.equal(renderer.elements.homeStartButton.textContent, 'Начать историю');
  // The first asset may still be loading, but the title screen must remain usable.

  engine.setLocale('en');
  result = renderer.render({ engine, assetManager, homeOpen: true, hasResume: true });
  assert.equal(renderer.elements.homeStartButton.hidden, true);
  assert.equal(renderer.elements.homeResumeButton.hidden, false);
  assert.equal(renderer.elements.homeNewGameButton.hidden, false);
  assert.equal(renderer.elements.homeResumeButton.textContent, 'Resume');
  assert.equal(renderer.elements.home.attributes['aria-label'], 'Main menu');

  result = renderer.render({ engine, assetManager, homeOpen: false, hasResume: true, showIntro: true });
  assert.equal(renderer.elements.home.hidden, true);
  assert.equal(renderer.elements.stage.inert, true);
  assert.equal(renderer.elements.episodeIntro.hidden, false);

  engine.markEpisodeIntroSeen();
  result = renderer.render({ engine, assetManager, homeOpen: false, hasResume: true, showIntro: false });
  assert.equal(renderer.elements.home.hidden, true);
  assert.equal(renderer.elements.stage.inert, false);
  assert.equal(renderer.elements.episodeIntro.hidden, true);
});

test('settings overlay takes focus priority over title and does not enable stage advance', t => {
  const prior = globalThis.document;
  globalThis.document = { createElement: name => new FakeElement(name) };
  t.after(() => { if (prior === undefined) delete globalThis.document; else globalThis.document = prior; });
  const renderer = createRenderer(new FakeElement('main'));
  const engine = new NarrativeEngine(graph);
  const assets = { sourceFor: () => '/assets/placeholder-arrival.svg', preloadSceneAsset: () => Promise.resolve() };
  renderer.render({ engine, assetManager: assets, homeOpen: true, hasResume: false, menuOpen: true, menuView: 'settings' });
  assert.equal(renderer.elements.home.inert, true);
  assert.equal(renderer.elements.menu.hidden, false);
  assert.equal(renderer.elements.stage.inert, true);
  const menu = renderer.elements.menu;
  assert.equal(menu.attributes.role, 'dialog');
});

test('return-to-title uses a non-narrative menu action', () => {
  const home = new FakeElement('button');
  const clicks = [];
  const controller = createInputController({ menuHomeButton: home }, {
    onHome: () => clicks.push('home'),
    onAdvance: () => clicks.push('advance')
  });
  controller.setMenuOpen(true);
  home.click(1);
  assert.deepEqual(clicks, ['home']);
  controller.destroy();
});

test('startup does not fabricate a save and never starts the episode before title dismissal', () => {
  const source = fs.readFileSync(new URL('../../src/main.mjs', import.meta.url), 'utf8');
  assert.match(source, /homeOpen:\s*true/);
  assert.match(source, /const hasValidSave = Boolean\(saved && engine\.load\(saved\)\)/);
  assert.match(source, /if \(!ui\.homeOpen && engine\.needsEpisodeIntro\(\)\)/);
  assert.match(source, /if \(!ui\.homeOpen\) \{\s*storageWrite\(SAVE_KEY, engine\.save\(\)\)/s);
  assert.match(source, /homeStartButton\.addEventListener\('click', startReading\)/);
  assert.match(source, /homeResumeButton\.addEventListener\('click', startReading\)/);
});
