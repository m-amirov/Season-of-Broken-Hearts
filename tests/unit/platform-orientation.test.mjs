import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { createRenderer } from '../../src/ui/renderer-stage6.mjs';

const source = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

class FakeElement {
  constructor(tag) {
    this.tagName = tag;
    this.className = '';
    this.dataset = {};
    this.attributes = {};
    this.style = { setProperty() {} };
    this.classList = { add() {}, remove() {} };
    this.children = [];
    this.hidden = false;
    this.inert = false;
  }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
}

function allChildren(root) {
  return [root, ...root.children.flatMap(allChildren)];
}

test('reader does not create an in-game rotate-device overlay', t => {
  const previousDocument = globalThis.document;
  globalThis.document = { createElement: name => new FakeElement(name) };
  t.after(() => {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  });
  const root = new FakeElement('main');
  const reader = createRenderer(root);
  const nodes = allChildren(root);
  assert.equal(nodes.some(node => node.className === 'orientation-lock'), false);
  assert.equal('orientationLock' in reader.elements, false);
  assert.ok(nodes.some(node => node.className === 'reader-stage'));
  assert.ok(nodes.some(node => node.className === 'home-screen'));
});

test('no mobile landscape guard, content blocker, or orientation event listener remains', () => {
  const main = source('../../src/main.mjs');
  const css = source('../../src/styles.css');
  const renderer = source('../../src/ui/renderer-stage6.mjs');
  assert.doesNotMatch(main, /updateOrientationGuard|touch-landscape|orientationchange/);
  assert.doesNotMatch(renderer, /orientationLock|orientation-lock|rotateTitle|rotateText|Rotate your device|Поверните устройство/);
  assert.doesNotMatch(css, /\.orientation-lock|\.orientation-icon|\.orientation-title|\.orientation-text|touch-landscape/);
  assert.match(css, /@media \(min-width: 701px\)/);
  assert.match(css, /@media \(max-width: 700px\)/);
});

test('mobile portrait is declarative platform configuration, not a runtime lock', () => {
  const spec = source('../../game-spec.yaml');
  assert.match(spec, /mobile:\s*portrait-only/);
  assert.match(spec, /desktop:\s*landscape/);
  assert.match(spec, /Yandex Games Console/i);
  assert.doesNotMatch(source('../../src/main.mjs'), /screen\.orientation\.lock/);
});
