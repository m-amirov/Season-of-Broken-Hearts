import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { materializeProducerOutput } from '../../tools/production-art/materialize-producer-output.mjs';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

function tempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'stage9-producer-output-'));
}

test('materializes an external native output before the output gate without overwriting', () => {
  const root = tempProject();
  const source = path.join(root, 'native', 'exec-output.png');
  const destination = path.join(root, 'assets', 'production', 'cg', 'scene.png');
  fs.mkdirSync(path.dirname(source), { recursive: true });
  fs.writeFileSync(source, tinyPng);

  const result = materializeProducerOutput({
    projectRoot: root,
    source,
    destination
  });

  assert.equal(result.status, 'PASS_ART_OUTPUT_MATERIALIZED');
  assert.equal(fs.readFileSync(destination).equals(tinyPng), true);
  assert.equal(result.destination, path.relative(root, destination).replaceAll(path.sep, '/'));
  assert.equal(result.sourceExists, true);
});

test('classifies a missing native output as transport failure and creates no target', () => {
  const root = tempProject();
  const source = path.join(root, 'native', 'missing.png');
  const destination = path.join(root, 'assets', 'production', 'cg', 'scene.png');

  assert.throws(
    () => materializeProducerOutput({ projectRoot: root, source, destination }),
    error => error.code === 'ART_FILE_NOT_FOUND' && error.status === 'BLOCKED_ART_OUTPUT'
  );
  assert.equal(fs.existsSync(destination), false);
});

test('refuses to replace an existing project-owned output', () => {
  const root = tempProject();
  const source = path.join(root, 'native', 'exec-output.png');
  const destination = path.join(root, 'assets', 'production', 'cg', 'scene.png');
  fs.mkdirSync(path.dirname(source), { recursive: true });
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(source, tinyPng);
  fs.writeFileSync(destination, Buffer.from('existing'));

  assert.throws(
    () => materializeProducerOutput({ projectRoot: root, source, destination }),
    error => error.code === 'ART_FILE_EXISTS' && error.status === 'BLOCKED_ART_OUTPUT'
  );
  assert.equal(fs.readFileSync(destination, 'utf8'), 'existing');
});

test('rejects a destination outside the project root', () => {
  const root = tempProject();
  const source = path.join(root, 'native', 'exec-output.png');
  fs.mkdirSync(path.dirname(source), { recursive: true });
  fs.writeFileSync(source, tinyPng);

  assert.throws(
    () => materializeProducerOutput({ projectRoot: root, source, destination: path.join(root, '..', 'escape.png') }),
    error => error.code === 'ART_DESTINATION_OUTSIDE_PROJECT' && error.status === 'BLOCKED_ART_OUTPUT'
  );
});
