#!/usr/bin/env node
/**
 * Pre-flight checks before `appwrite push` / `appwrite deploy`.
 * Run: npm run appwrite:check
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const checks = [];
let failed = 0;

function pass(msg) { checks.push({ ok: true, msg }); }
function fail(msg) { checks.push({ ok: false, msg }); failed++; }

// ── Appwrite CLI ─────────────────────────────────────────────────────────────
try {
  const ver = execSync('npx appwrite --version 2>/dev/null', { cwd: ROOT, encoding: 'utf8' })
    .split('\n')[0].trim();
  pass(`Appwrite CLI installed (${ver})`);
} catch {
  fail('Appwrite CLI not found — run: npm install');
}

// ── appwrite.json ────────────────────────────────────────────────────────────
const appwriteJsonPath = resolve(ROOT, 'appwrite.json');
if (!existsSync(appwriteJsonPath)) {
  fail('appwrite.json missing');
} else {
  try {
    const schema = JSON.parse(readFileSync(appwriteJsonPath, 'utf8'));
    if (!schema.projectId || schema.projectId === 'YOUR_PROJECT_ID') {
      fail('appwrite.json projectId is still YOUR_PROJECT_ID — link your project (see docs/APPWRITE-SETUP.md §2)');
    } else {
      pass(`appwrite.json projectId = ${schema.projectId}`);
    }
    const fnCount = schema.functions?.length ?? 0;
    const bucketCount = schema.buckets?.length ?? 0;
    pass(`Schema: ${schema.collections?.length ?? 0} collections, ${bucketCount} buckets, ${fnCount} functions`);
  } catch (e) {
    fail(`appwrite.json parse error: ${e.message}`);
  }
}

// ── .env.local ───────────────────────────────────────────────────────────────
const envPath = resolve(ROOT, '.env.local');
if (!existsSync(envPath)) {
  fail('.env.local missing — copy from .env.example');
} else {
  const env = readFileSync(envPath, 'utf8');
  if (!env.includes('NEXT_PUBLIC_APPWRITE_ENDPOINT=')) {
    fail('.env.local missing NEXT_PUBLIC_APPWRITE_ENDPOINT');
  } else {
    pass('NEXT_PUBLIC_APPWRITE_ENDPOINT set');
  }
  if (env.includes('NEXT_PUBLIC_APPWRITE_PROJECT_ID=YOUR_PROJECT_ID') ||
      !/NEXT_PUBLIC_APPWRITE_PROJECT_ID=\S+/.test(env)) {
    fail('.env.local project ID not set — paste your Appwrite project ID');
  } else {
    const m = env.match(/NEXT_PUBLIC_APPWRITE_PROJECT_ID=(\S+)/);
    pass(`NEXT_PUBLIC_APPWRITE_PROJECT_ID = ${m?.[1]}`);
  }
  if (!/^APPWRITE_API_KEY=\S+/m.test(env)) {
    fail('APPWRITE_API_KEY not set in .env.local (needed for generate-audio + function env)');
  } else {
    pass('APPWRITE_API_KEY present');
  }
}

// ── Function syntax ──────────────────────────────────────────────────────────
const fns = [
  'appwrite/functions/set-pin/src/main.js',
  'appwrite/functions/login-with-pin/src/main.js',
  'appwrite/functions/asr-recognize/src/main.js',
];
for (const f of fns) {
  try {
    execSync(`node --check ${f}`, { cwd: ROOT, stdio: 'pipe' });
    pass(`Syntax OK: ${f}`);
  } catch {
    fail(`Syntax error: ${f}`);
  }
}

// ── CLI login & project link ───────────────────────────────────────────────────
try {
  execSync('npx appwrite account get', { cwd: ROOT, stdio: 'pipe' });
  pass('Appwrite CLI logged in');
} catch {
  fail('Not logged in — run: npx appwrite login');
}

// ── Report ───────────────────────────────────────────────────────────────────
console.log('\nAksharvan Appwrite setup check\n');
for (const c of checks) {
  console.log(c.ok ? `  ✓ ${c.msg}` : `  ✗ ${c.msg}`);
}
console.log('');
if (failed === 0) {
  console.log('All checks passed. Next: npm run appwrite:push && npm run appwrite:deploy\n');
  process.exit(0);
} else {
  console.log(`${failed} issue(s) remaining. See docs/APPWRITE-SETUP.md\n`);
  process.exit(1);
}
