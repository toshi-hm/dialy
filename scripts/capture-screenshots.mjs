/**
 * VRT用スクリーンショットキャプチャスクリプト
 * Chrome DevTools Protocol (CDP) を使用してStorybookのストーリーをキャプチャ
 * 出力先: storybook-screenshots/<story-id>.png
 *
 * 前提: Chrome/Chromium がインストール済みであること
 *       storybook-static/ が build-storybook で生成済みであること
 */

import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const STORYBOOK_STATIC = join(ROOT, 'storybook-static');
const OUT_DIR = join(ROOT, 'storybook-screenshots');
const SERVER_PORT = 6006;
const CDP_PORT = 9222;
const CAPTURE_TIMEOUT = 15000;
const NAVIGATION_TIMEOUT = 10000;
const RENDER_WAIT = 800;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.mjs': 'text/javascript',
  '.cjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json',
};

function startStaticServer(staticDir, port) {
  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      try {
        let urlPath = decodeURIComponent(req.url.split('?')[0]);
        if (urlPath === '/') urlPath = '/index.html';
        const filePath = join(staticDir, urlPath);
        if (!filePath.startsWith(staticDir)) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }
        const content = await readFile(filePath);
        const ext = extname(filePath).toLowerCase();
        const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mimeType });
        res.end(content);
      } catch {
        try {
          const content = await readFile(join(staticDir, 'index.html'));
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
        } catch {
          res.writeHead(404);
          res.end('Not found');
        }
      }
    });
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => {
      console.log(`[server] Started at http://localhost:${port}`);
      resolve(server);
    });
  });
}

function getStories() {
  const indexPath = join(STORYBOOK_STATIC, 'index.json');
  if (!existsSync(indexPath)) {
    throw new Error(
      `storybook-static/index.json not found.\nRun: pnpm build-storybook`,
    );
  }
  const index = JSON.parse(readFileSync(indexPath, 'utf-8'));
  const entries = index.entries || index.stories || {};
  return Object.values(entries).filter(
    (e) => !e.type || e.type === 'story',
  );
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean);
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  throw new Error(
    'Chrome not found. Install Chrome or set CHROME_PATH environment variable.',
  );
}

function createCDPClient(ws) {
  let nextId = 1;
  const pending = new Map();
  const handlers = new Map();

  ws.onmessage = ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.id !== undefined && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    } else if (msg.method && handlers.has(msg.method)) {
      for (const h of handlers.get(msg.method)) h(msg.params);
    }
  };

  return {
    send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    },
    on(event, handler) {
      if (!handlers.has(event)) handlers.set(event, []);
      handlers.get(event).push(handler);
    },
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForCDP(port, timeout = 15000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    try {
      const res = await fetch(`http://localhost:${port}/json/version`);
      if (res.ok) return;
    } catch {}
    await sleep(200);
  }
  throw new Error('Chrome CDP did not become ready in time');
}

async function captureStory(cdpPort, servPort, story) {
  const newTabRes = await fetch(`http://localhost:${cdpPort}/json/new?about:blank`);
  const tab = await newTabRes.json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error('WebSocket connection failed'));
    setTimeout(() => reject(new Error('WebSocket open timeout')), 5000);
  });

  const cdp = createCDPClient(ws);

  try {
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const storyUrl = `http://localhost:${servPort}/iframe.html?id=${story.id}&viewMode=story`;

    await Promise.race([
      new Promise((resolve) => {
        cdp.on('Page.loadEventFired', resolve);
        cdp.send('Page.navigate', { url: storyUrl });
      }),
      sleep(NAVIGATION_TIMEOUT),
    ]);

    await sleep(RENDER_WAIT);

    await cdp.send('Runtime.evaluate', {
      expression: `
        const s = document.createElement('style');
        s.textContent = [
          '*, *::before, *::after {',
          '  animation: none !important;',
          '  animation-duration: 0s !important;',
          '  transition: none !important;',
          '  transition-duration: 0s !important;',
          '}',
        ].join('');
        document.head && document.head.appendChild(s);
      `,
    });

    await sleep(200);

    const { data } = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });

    return Buffer.from(data, 'base64');
  } finally {
    ws.close();
    await fetch(`http://localhost:${cdpPort}/json/close/${tab.id}`).catch(() => {});
  }
}

async function main() {
  let server = null;
  let chrome = null;

  try {
    if (!existsSync(STORYBOOK_STATIC)) {
      throw new Error(
        `storybook-static/ not found. Run: pnpm build-storybook`,
      );
    }

    await mkdir(OUT_DIR, { recursive: true });

    server = await startStaticServer(STORYBOOK_STATIC, SERVER_PORT);

    const stories = getStories();
    console.log(`[storybook] Found ${stories.length} stories`);
    if (stories.length === 0) {
      console.log('[storybook] No stories to capture. Exiting.');
      return;
    }

    const chromePath = findChrome();
    console.log(`[chrome] Using: ${chromePath}`);

    chrome = spawn(
      chromePath,
      [
        `--remote-debugging-port=${CDP_PORT}`,
        '--headless=new',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-networking',
        '--disable-extensions',
        `--window-size=1280,800`,
        'about:blank',
      ],
      { stdio: 'ignore' },
    );

    chrome.on('error', (err) => {
      throw new Error(`Chrome launch error: ${err.message}`);
    });

    await waitForCDP(CDP_PORT);
    console.log('[chrome] CDP ready');

    let ok = 0;
    let ng = 0;

    for (const story of stories) {
      const label = `${story.title || ''}/${story.name || story.id}`;
      try {
        const png = await Promise.race([
          captureStory(CDP_PORT, SERVER_PORT, story),
          sleep(CAPTURE_TIMEOUT).then(() => {
            throw new Error('Capture timeout');
          }),
        ]);
        const outPath = join(OUT_DIR, `${story.id}.png`);
        await writeFile(outPath, png);
        console.log(`  ✓ ${label}`);
        ok++;
      } catch (e) {
        console.error(`  ✗ ${label}: ${e.message}`);
        ng++;
      }
    }

    console.log(`\n[done] ${ok} captured, ${ng} failed`);
    if (ok === 0) {
      throw new Error('No screenshots were captured. Check Chrome and Storybook setup.');
    }
  } finally {
    if (server) server.close();
    if (chrome) {
      chrome.kill('SIGTERM');
      await sleep(500);
      chrome.kill('SIGKILL');
    }
  }
}

main().catch((err) => {
  console.error('[fatal]', err.message);
  process.exit(1);
});
