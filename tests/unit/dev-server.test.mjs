import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { parseOptions } from '../../tools/dev-server.mjs';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const serverScript = path.join(root, 'tools', 'dev-server.mjs');

test('dev server options default to 127.0.0.1:4173 and accept HOST/PORT overrides', () => {
  assert.deepEqual(parseOptions([], {}), { host: '127.0.0.1', port: 4173 });
  assert.deepEqual(parseOptions([], { HOST: '0.0.0.0', PORT: '4317' }), { host: '0.0.0.0', port: 4317 });
  assert.deepEqual(parseOptions(['--host', '0.0.0.0'], { HOST: '127.0.0.1', PORT: '4318' }), { host: '0.0.0.0', port: 4318 });
});

function startServer({ host, envHost, port = 0 } = {}) {
  const args = [serverScript];
  if (host) args.push('--host', host);
  const child = spawn(process.execPath, args, {
    cwd: root,
    env: {
      ...process.env,
      HOST: envHost ?? '',
      PORT: String(port)
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGKILL');
      reject(new Error(`dev-server did not announce readiness\nstdout: ${stdout}\nstderr: ${stderr}`));
    }, 5000);

    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error); else resolve(result);
    };

    child.stdout.on('data', chunk => {
      stdout += chunk;
      const match = stdout.match(/Local:\s+http:\/\/[^:]+:(\d+)\//);
      if (match) finish(null, { child, port: Number(match[1]), getOutput: () => ({ stdout, stderr }) });
    });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.once('error', error => finish(error));
    child.once('exit', (code, signal) => {
      if (!settled) finish(new Error(`dev-server exited before readiness: code=${code}, signal=${signal}\n${stdout}\n${stderr}`));
    });
  });
}

async function stopServer(server) {
  if (server.child.exitCode !== null || server.child.signalCode !== null) return;
  await new Promise(resolve => {
    const timer = setTimeout(() => {
      server.child.kill('SIGKILL');
      resolve();
    }, 1000);
    server.child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
    server.child.kill('SIGTERM');
  });
}

async function fetchText(server, pathname, init) {
  const response = await fetch(`http://127.0.0.1:${server.port}${pathname}`, init);
  return { response, body: await response.text() };
}

function rawRequest(server, pathname, method = 'GET') {
  return new Promise((resolve, reject) => {
    const request = http.request({
      hostname: '127.0.0.1',
      port: server.port,
      method,
      path: pathname,
      headers: { Connection: 'close' }
    }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({
        status: response.statusCode,
        headers: response.headers,
        body: Buffer.concat(chunks).toString('utf8')
      }));
    });
    request.once('error', reject);
    request.end();
  });
}

test('dev server keeps the default local binding and serves the root', async t => {
  const server = await startServer();
  t.after(() => stopServer(server));

  const rootResponse = await fetchText(server, '/');
  assert.equal(rootResponse.response.status, 200);
  assert.match(rootResponse.body, /Сезон разбитых сердец/);
  assert.doesNotMatch(server.getOutput().stdout, /LAN access enabled/);
});

test('dev server accepts --host 0.0.0.0 and prints LAN instructions', async t => {
  const server = await startServer({ host: '0.0.0.0' });
  t.after(() => stopServer(server));

  const response = await fetchText(server, '/');
  const output = server.getOutput();
  assert.equal(response.response.status, 200);
  assert.match(output.stdout, /Local:\s+http:\/\/127\.0\.0\.1:\d+\//);
  assert.match(output.stdout, /LAN access enabled\./);
});

test('HOST environment variable enables LAN binding', async t => {
  const server = await startServer({ envHost: '0.0.0.0' });
  t.after(() => stopServer(server));

  assert.equal((await fetchText(server, '/favicon.svg')).response.status, 200);
  assert.match(server.getOutput().stdout, /LAN access enabled\./);
});

test('runtime allowlist serves EP1 public closure only', async t => {
  const server = await startServer();
  t.after(() => stopServer(server));

  const paths = [
    '/',
    '/index.html',
    '/favicon.svg',
    '/sdk.js',
    '/src/main.mjs',
    '/src/styles.css',
    '/narrative/graph.json',
    '/narrative/assets.json',
    '/assets/placeholder-arrival.svg',
    '/assets/placeholder-villa.svg',
    '/assets/placeholder-kitchen.svg',
    '/assets/placeholder-harbor.svg',
    '/assets/placeholder-night.svg'
  ];
  for (const pathname of paths) {
    const { response } = await fetchText(server, pathname);
    assert.equal(response.status, 200, pathname);
  }

  const graph = JSON.parse((await fetchText(server, '/narrative/graph.json')).body);
  assert.equal(graph.scenes[0].id, 'ep1_arrival');
  assert.match((await fetchText(server, '/sdk.js')).body, /YaGames/);
});

test('dev server blocks service files, URL-encoded traversal and malformed requests', async t => {
  const server = await startServer();
  t.after(() => stopServer(server));

  for (const pathname of [
    '/package.json',
    '/tools/dev-server.mjs',
    '/docs/CONCEPT.md',
    '/tests/unit/engine.test.mjs',
    '/artifacts/evidence/final-gameplay-videos.json',
    '/.git/config',
    '/.codex/skills/implementation-cycle/SKILL.md',
    '/narrative/episode-1.md',
    '/..%2fpackage.json',
    '/%2e%2e%2fpackage.json',
    '/src/%2e%2e%2fpackage.json',
    '/src%5c..%5cpackage.json'
  ]) {
    const { response } = await fetchText(server, pathname);
    assert.ok([403, 404].includes(response.status), `${pathname}: ${response.status}`);
  }

  assert.equal((await rawRequest(server, '/')).status, 200);
  assert.equal((await rawRequest(server, '/', 'HEAD')).status, 200);
  assert.equal((await rawRequest(server, '/', 'POST')).status, 405);
  assert.equal((await rawRequest(server, '/%E0%A4%A')).status, 400);
});

test('dev server rejects symlink escapes from the allowlisted asset tree', async t => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'season-broken-hearts-dev-server-'));
  const secretFile = path.join(temporaryDirectory, 'secret.svg');
  const link = path.join(root, 'assets', '__dev_server_symlink_escape_test__.svg');
  await writeFile(secretFile, 'secret outside the project root', 'utf8');
  await symlink(secretFile, link, 'file');
  t.after(async () => {
    await rm(link, { force: true });
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  const server = await startServer();
  t.after(() => stopServer(server));
  const { response } = await fetchText(server, '/assets/__dev_server_symlink_escape_test__.svg');
  assert.equal(response.status, 403);
});

test('dev server reports an occupied port and exits non-zero', async t => {
  const server = await startServer();
  t.after(() => stopServer(server));

  const child = spawn(process.execPath, [serverScript], {
    cwd: root,
    env: { ...process.env, HOST: '', PORT: String(server.port) },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  const result = await new Promise(resolve => child.once('close', (code, signal) => resolve({ code, signal })));
  assert.notEqual(result.code, 0);
  assert.match(output, /already in use|EADDRINUSE|занят/i);
});
