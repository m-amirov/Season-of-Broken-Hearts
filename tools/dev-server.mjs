import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 4173);
const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml'
};

const localSdk = `window.YaGames = window.YaGames || { init: () => Promise.resolve({ local: true }) };`;

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const resolved = path.resolve(root, relative);
  return resolved === root || resolved.startsWith(`${root}${path.sep}`) ? resolved : null;
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end();
      return;
    }
    if (request.url?.split('?')[0] === '/sdk.js') {
      response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
      if (request.method === 'GET') response.end(localSdk); else response.end();
      return;
    }
    const target = safePath(request.url || '/');
    if (!target) { response.writeHead(403); response.end('Forbidden'); return; }
    const details = await stat(target);
    if (!details.isFile()) { response.writeHead(404); response.end('Not found'); return; }
    response.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    if (request.method === 'HEAD') { response.end(); return; }
    createReadStream(target).pipe(response);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Season of Broken Hearts dev server: http://127.0.0.1:${port}`);
});

process.on('SIGINT', () => server.close(() => process.exit(0)));
