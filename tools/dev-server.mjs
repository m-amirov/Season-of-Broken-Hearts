import { createReadStream } from 'node:fs';
import { lstat, realpath, stat } from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FILE = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(FILE), '..');
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 4173;
const SOURCE_EXTENSIONS = new Set(['.css', '.js', '.mjs']);
const ASSET_EXTENSIONS = new Set(['.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp', '.woff2']);
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2'
};

const localSdk = `window.YaGames = window.YaGames || { init: () => Promise.resolve({ local: true }) };`;

function parsePort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`PORT must be an integer between 0 and 65535; received ${JSON.stringify(value)}`);
  }
  return port;
}

export function parseOptions(argv = process.argv.slice(2), env = process.env) {
  let host = String(env.HOST || DEFAULT_HOST).trim() || DEFAULT_HOST;
  let hostFromCli = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--host') {
      const value = argv[++index];
      if (!value || value.startsWith('--')) throw new Error('--host requires a value');
      host = value;
      hostFromCli = true;
    } else if (argument.startsWith('--host=')) {
      host = argument.slice('--host='.length);
      hostFromCli = true;
      if (!host) throw new Error('--host requires a value');
    } else if (argument === '--help' || argument === '-h') {
      return { help: true };
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }

  return {
    host: hostFromCli ? host.trim() : host,
    port: parsePort(env.PORT || DEFAULT_PORT)
  };
}

function isPrivateIPv4(address) {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some(octet => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;
  return octets[0] === 10
    || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
    || (octets[0] === 192 && octets[1] === 168);
}

export function discoverLanIPv4(networkInterfaces = os.networkInterfaces()) {
  const addresses = Object.values(networkInterfaces)
    .flatMap(entries => entries ?? [])
    .filter(entry => entry && !entry.internal && (entry.family === 'IPv4' || entry.family === 4))
    .map(entry => entry.address)
    .filter(address => typeof address === 'string');
  return addresses.find(isPrivateIPv4) ?? addresses[0] ?? null;
}

function isWithin(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

function isSafeSegment(segment) {
  return Boolean(segment)
    && segment !== '.'
    && segment !== '..'
    && !segment.startsWith('.')
    && !segment.includes('\\')
    && !segment.includes('\0');
}

export function parseRequestPath(rawUrl) {
  if (typeof rawUrl !== 'string' || rawUrl.length === 0 || rawUrl === '*' || !rawUrl.startsWith('/')) {
    return { status: 400, message: 'Bad request target' };
  }

  const rawPath = rawUrl.split('?')[0];
  let decoded;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return { status: 400, message: 'Bad request target' };
  }

  if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes('\\') || decoded.includes('\0')) {
    return { status: 403, message: 'Forbidden' };
  }

  const segments = decoded.slice(1).split('/');
  if (decoded !== '/' && segments.some(segment => !isSafeSegment(segment))) {
    return { status: 403, message: 'Forbidden' };
  }

  return { relative: decoded === '/' ? 'index.html' : segments.join('/') };
}

function routePolicy(root, relative) {
  const exactFiles = new Set(['favicon.svg', 'index.html', 'narrative/assets.json', 'narrative/graph.json']);
  if (exactFiles.has(relative)) {
    return { kind: 'exact', base: path.dirname(path.join(root, relative)) };
  }

  if (relative.startsWith('src/')) {
    return SOURCE_EXTENSIONS.has(path.extname(relative).toLowerCase())
      ? { kind: 'directory', base: path.join(root, 'src') }
      : null;
  }
  if (relative.startsWith('assets/')) {
    return ASSET_EXTENSIONS.has(path.extname(relative).toLowerCase())
      ? { kind: 'directory', base: path.join(root, 'assets') }
      : null;
  }
  return null;
}

async function resolvePublicFile(root, rootReal, relative) {
  const policy = routePolicy(root, relative);
  if (!policy) return { status: 403, message: 'Forbidden' };

  const target = path.resolve(root, relative);
  let targetReal;
  try {
    const linkDetails = await lstat(target);
    if (linkDetails.isSymbolicLink()) return { status: 403, message: 'Forbidden' };
    targetReal = await realpath(target);
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') return { status: 404, message: 'Not found' };
    if (error?.code === 'EACCES' || error?.code === 'EPERM') return { status: 403, message: 'Forbidden' };
    throw error;
  }

  let allowedBaseReal;
  try {
    allowedBaseReal = await realpath(policy.base);
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') return { status: 404, message: 'Not found' };
    throw error;
  }

  if (!isWithin(rootReal, targetReal) || !isWithin(allowedBaseReal, targetReal)) {
    return { status: 403, message: 'Forbidden' };
  }

  const extension = path.extname(targetReal).toLowerCase();
  if (policy.kind === 'exact' && targetReal !== path.resolve(root, relative)) {
    return { status: 403, message: 'Forbidden' };
  }
  if (policy.kind === 'directory' && !SOURCE_EXTENSIONS.has(extension) && !ASSET_EXTENSIONS.has(extension)) {
    return { status: 403, message: 'Forbidden' };
  }

  const details = await stat(targetReal);
  if (!details.isFile()) return { status: 404, message: 'Not found' };
  return { file: targetReal, size: details.size, contentType: MIME_TYPES[extension] || 'application/octet-stream' };
}

function sendText(response, status, message, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', ...headers });
  response.end(message);
}

export function createRequestHandler({ root = PROJECT_ROOT } = {}) {
  const absoluteRoot = path.resolve(root);
  const rootRealPromise = realpath(absoluteRoot);

  return async (request, response) => {
    try {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        sendText(response, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
        return;
      }

      const parsed = parseRequestPath(request.url || '');
      if (parsed.status) {
        sendText(response, parsed.status, parsed.message);
        return;
      }

      if (parsed.relative === 'sdk.js') {
        response.writeHead(200, {
          'Cache-Control': 'no-store',
          'Content-Type': 'text/javascript; charset=utf-8',
          'Content-Length': Buffer.byteLength(localSdk)
        });
        if (request.method === 'HEAD') response.end(); else response.end(localSdk);
        return;
      }

      const rootReal = await rootRealPromise;
      const result = await resolvePublicFile(absoluteRoot, rootReal, parsed.relative);
      if (result.status) {
        sendText(response, result.status, result.message);
        return;
      }

      response.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Length': result.size,
        'Content-Type': result.contentType
      });
      if (request.method === 'HEAD') {
        response.end();
        return;
      }

      const stream = createReadStream(result.file);
      stream.on('error', error => {
        if (!response.headersSent) sendText(response, error.code === 'EACCES' ? 403 : 404, 'Not found');
        else response.destroy(error);
      });
      stream.pipe(response);
    } catch (error) {
      if (!response.headersSent) sendText(response, error?.code === 'EACCES' ? 403 : 404, 'Not found');
      else response.destroy(error);
    }
  };
}

function listen(server, port, host) {
  return new Promise((resolve, reject) => {
    const onListening = () => {
      server.off('error', onError);
      resolve();
    };
    const onError = error => {
      server.off('listening', onListening);
      reject(error);
    };
    server.once('listening', onListening);
    server.once('error', onError);
    server.listen({ host, port });
  });
}

function displayHost(host) {
  return host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;
}

function localDisplayHost(host) {
  if (host === '0.0.0.0') return '127.0.0.1';
  if (host === '::') return '::1';
  return host;
}

function announce({ host, port, logger }) {
  logger.log('Season of Broken Hearts');
  logger.log('');
  logger.log(`Local:   http://${displayHost(localDisplayHost(host))}:${port}/`);
  if (host === '0.0.0.0') {
    const lanIPv4 = discoverLanIPv4();
    logger.log(lanIPv4
      ? `Network: http://${lanIPv4}:${port}/`
      : 'Network: unavailable (no non-internal IPv4 detected).');
    logger.log('');
    logger.log('LAN access enabled.');
  }
}

export async function startDevServer({ host = DEFAULT_HOST, port = DEFAULT_PORT, root = PROJECT_ROOT, logger = console, announceAddresses = false } = {}) {
  const absoluteRoot = path.resolve(root);
  await realpath(absoluteRoot);
  const server = http.createServer(createRequestHandler({ root: absoluteRoot }));
  try {
    await listen(server, port, host);
  } catch (error) {
    server.close();
    throw error;
  }

  const address = server.address();
  const actualPort = typeof address === 'object' && address ? address.port : port;
  if (announceAddresses) announce({ host, port: actualPort, logger });
  return { server, host, port: actualPort };
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === FILE;
}

async function main() {
  let options;
  try {
    options = parseOptions();
    if (options.help) {
      console.log('Usage: npm run dev -- [--host <host>]');
      console.log('Defaults: HOST=127.0.0.1 PORT=4173');
      return;
    }
    const started = await startDevServer({ ...options, announceAddresses: true });
    const shutdown = () => started.server.close(() => process.exit(0));
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  } catch (error) {
    if (error?.code === 'EADDRINUSE') {
      console.error(`Unable to start dev server: port ${options?.port ?? process.env.PORT ?? DEFAULT_PORT} is already in use.`);
    } else {
      console.error(`Unable to start dev server: ${error instanceof Error ? error.message : String(error)}`);
    }
    process.exitCode = 1;
  }
}

if (isMainModule()) void main();
