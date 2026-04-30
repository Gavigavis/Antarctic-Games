#!/usr/bin/env node

const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const http = require("http");
const https = require("https");

const GAMES_DIR = path.resolve(__dirname, "..", "games");
const CDN_CACHE_DIR = path.resolve(__dirname, "..", "games-cdn-assets");
const MAX_CONCURRENT = 10;
const RETRY_COUNT = 2;
const RETRY_DELAY_MS = 1000;

const CDN_DOMAINS = new Set([
  "cdn.jsdelivr.net",
  "rawcdn.githack.com",
  "cdn.onesignal.com",
  "www.googletagmanager.com",
  "api.adinplay.com",
  "cdn-cgi.cloudflare.com",
]);

const SKIP_PATTERNS = [
  /googletagmanager\.com\/gtag\/js/i,
  /googletagmanager\.com\/config/i,
  /cdn\.onesignal\.com/i,
  /adinplay\.com/i,
  /cloudflare-static\/email-decode/i,
  /gtag\(/i,
  /window\.dataLayer/i,
];

function download(url, retries = RETRY_COUNT) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === "https:" ? https : http;
    const req = client.get(url, { redirect: "manual", timeout: 30000 }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).toString();
        return download(redirectUrl, retries - 1)
          .then(resolve)
          .catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    });
    req.on("error", (err) => {
      if (retries > 0) {
        setTimeout(() => download(url, retries - 1).then(resolve).catch(reject), RETRY_DELAY_MS);
      } else {
        reject(err);
      }
    });
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error(`Timeout downloading ${url}`));
    });
  });
}

function semaphore(limit) {
  let pending = 0;
  const waiting = [];
  return {
    async acquire() {
      if (pending < limit) {
        pending++;
        return;
      }
      await new Promise((resolve) => waiting.push(resolve));
    },
    release() {
      pending--;
      if (waiting.length > 0) {
        pending++;
        waiting.shift()();
      }
    }
  };
}

function shouldSkipUrl(url) {
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(url)) return true;
  }
  return false;
}

function extractBaseHref(html) {
  const match = html.match(/<base\s+href=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function extractResourceUrls(html, baseUrl) {
  const urls = [];
  const seen = new Set();

  const patterns = [
    /<script[^>]+src=["']([^"']+)["']/gi,
    /<link[^>]+href=["']([^"']+)["']/gi,
    /<img[^>]+src=["']([^"']+)["']/gi,
    /<video[^>]+src=["']([^"']+)["']/gi,
    /<audio[^>]+src=["']([^"']+)["']/gi,
    /<source[^>]+src=["']([^"']+)["']/gi,
    /<embed[^>]+src=["']([^"']+)["']/gi,
    /<iframe[^>]+src=["']([^"']+)["']/gi,
  ];

  for (const regex of patterns) {
    let match;
    while ((match = regex.exec(html)) !== null) {
      const url = match[1];
      if (/^(?:data|blob|javascript):/i.test(url)) continue;
      if (/^\/\//.test(url)) {
        const fullUrl = "https:" + url;
        if (!seen.has(fullUrl)) { urls.push(fullUrl); seen.add(fullUrl); }
        continue;
      }
      try {
        const resolved = new URL(url, baseUrl || "http://localhost/").toString();
        if (!seen.has(resolved)) { urls.push(resolved); seen.add(resolved); }
      } catch {
        // skip invalid URLs
      }
    }
  }

  // Catch-all: find any CDN URLs in the HTML (JS strings, etc.)
  const cdnDomainsPattern = Array.from(CDN_DOMAINS).map(d => d.replace('.', '\\.')).join('|');
  const cdnUrlPattern = new RegExp(
    '(?:' + cdnDomainsPattern + ')(?:/[^"\'\\s]*)',
    'gi'
  );
  let match;
  while ((match = cdnUrlPattern.exec(html)) !== null) {
    const url = "https://" + match[0];
    if (!seen.has(url)) { urls.push(url); seen.add(url); }
  }

  return urls;
}

function urlToFilePath(url, baseCdnUrl) {
  try {
    const parsed = new URL(url);
    const baseParsed = new URL(baseCdnUrl);
    const relativePath = parsed.pathname.replace(baseParsed.pathname, "").replace(/^\//, "");
    const hash = require("crypto").createHash("md5").update(url).digest("hex");
    const ext = path.extname(parsed.pathname) || ".bin";
    return path.join(hash + ext);
  } catch {
    const hash = require("crypto").createHash("md5").update(url).digest("hex");
    return path.join(hash + ".bin");
  }
}

function filePathToUrl(filePath, baseCdnUrl) {
  const ext = path.extname(filePath);
  const baseParsed = new URL(baseCdnUrl);
  return baseParsed.origin + baseParsed.pathname + filePath;
}

async function processGameFile(gameFilePath) {
  const html = await fsp.readFile(gameFilePath, "utf8");
  const baseHref = extractBaseHref(html);
  const localBasePath = `./_cdn/`;
  const isAlreadyLocalized = baseHref === "./_cdn/";

  const resolveBase = baseHref || "http://localhost/";
  let resources = extractResourceUrls(html, resolveBase);
  resources = resources.filter((url) => {
    if (shouldSkipUrl(url)) return false;
    const parsed = new URL(url);
    return CDN_DOMAINS.has(parsed.hostname);
  });

  if (resources.length === 0 && !isAlreadyLocalized) {
    return { file: gameFilePath, status: "no-cdn-resources", resources: [] };
  }

  if (resources.length === 0 && isAlreadyLocalized) {
    return { file: gameFilePath, status: "already-localized", resources: [] };
  }

  const cacheDir = path.join(CDN_CACHE_DIR, path.dirname(gameFilePath).replace(GAMES_DIR, ""));
  await fsp.mkdir(cacheDir, { recursive: true });

  const downloaded = new Map();
  const sem = semaphore(MAX_CONCURRENT);

  await Promise.all(
    resources.map(async (url) => {
      await sem.acquire();
      try {
        const fileName = urlToFilePath(url, resolveBase);
        const filePath = path.join(cacheDir, fileName);
        if (fs.existsSync(filePath)) {
          downloaded.set(url, fileName);
          return;
        }
        const data = await download(url);
        await fsp.writeFile(filePath, data);
        downloaded.set(url, fileName);
      } catch (err) {
        console.error(`  [WARN] Failed to download: ${url} - ${err.message}`);
      } finally {
        sem.release();
      }
    })
  );

  let newHtml = html;

  // Add or rewrite base href to local path
  if (baseHref) {
    newHtml = newHtml.replace(
      /<base\s+href=["'][^"']*["']\s*>+/gi,
      `<base href="${localBasePath}">`
    );
  } else {
    newHtml = newHtml.replace(/<head>/i, `<head>\n  <base href="${localBasePath}">`);
  }

  // Rewrite CDN URLs to local paths
  for (const [cdnUrl, localFile] of downloaded) {
    const localUrl = localBasePath + localFile;
    const escapedUrl = cdnUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const globalRegex = new RegExp(escapedUrl, "g");
    newHtml = newHtml.replace(globalRegex, localUrl);
  }

  if (newHtml !== html) {
    await fsp.writeFile(gameFilePath, newHtml, "utf8");
  }

  return {
    file: gameFilePath,
    status: "done",
    resources: [...downloaded.keys()],
    totalDownloaded: downloaded.size
  };
}

async function findGameFiles(dir) {
  const files = [];
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findGameFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }
  return files;
}

async function main() {
  console.log("=== CDN Asset Localizer ===");
  console.log(`Games directory: ${GAMES_DIR}`);
  console.log(`Cache directory: ${CDN_CACHE_DIR}`);
  console.log("");

  await fsp.mkdir(CDN_CACHE_DIR, { recursive: true });

  const gameFiles = await findGameFiles(GAMES_DIR);
  console.log(`Found ${gameFiles.length} game HTML files\n`);

  let totalDownloaded = 0;
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const gameFile of gameFiles) {
    try {
      const result = await processGameFile(gameFile);
      processed++;

      if (result.status === "no-base-href" || result.status === "no-cdn-resources" || result.status === "already-localized") {
        skipped++;
        continue;
      }

      if (result.totalDownloaded > 0) {
        totalDownloaded += result.totalDownloaded;
        const relPath = path.relative(GAMES_DIR, gameFile);
        console.log(`  [OK] ${relPath} - ${result.totalDownloaded} assets downloaded`);
      }
    } catch (err) {
      errors++;
      console.error(`  [ERROR] ${gameFile} - ${err.message}`);
    }
  }

  console.log("");
  console.log(`=== Summary ===`);
  console.log(`Processed: ${processed}`);
  console.log(`Skipped (no CDN): ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total assets downloaded: ${totalDownloaded}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
