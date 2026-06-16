#!/usr/bin/env node
/**
 * Sync Appwrite project ID into appwrite.json and .env.local.
 *
 * Usage:
 *   node scripts/link-appwrite-project.mjs <projectId>
 *   APPWRITE_PROJECT_ID=abc123 node scripts/link-appwrite-project.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const projectId = process.argv[2] ?? process.env.APPWRITE_PROJECT_ID;

if (!projectId || projectId === 'YOUR_PROJECT_ID') {
  console.error('Usage: node scripts/link-appwrite-project.mjs <projectId>');
  console.error('Get the ID from Appwrite Console → Project Settings → Project ID');
  process.exit(1);
}

// Update appwrite.json
const jsonPath = resolve(ROOT, 'appwrite.json');
const schema = JSON.parse(readFileSync(jsonPath, 'utf8'));
schema.projectId = projectId;
writeFileSync(jsonPath, JSON.stringify(schema, null, 2) + '\n');
console.log(`✓ appwrite.json → projectId = ${projectId}`);

// Update .env.local
const envPath = resolve(ROOT, '.env.local');
const examplePath = resolve(ROOT, '.env.example');
if (!existsSync(envPath) && existsSync(examplePath)) {
  writeFileSync(envPath, readFileSync(examplePath, 'utf8'));
}

if (existsSync(envPath)) {
  let env = readFileSync(envPath, 'utf8');
  if (/NEXT_PUBLIC_APPWRITE_PROJECT_ID=.*/m.test(env)) {
    env = env.replace(
      /NEXT_PUBLIC_APPWRITE_PROJECT_ID=.*/m,
      `NEXT_PUBLIC_APPWRITE_PROJECT_ID=${projectId}`,
    );
  } else {
    env += `\nNEXT_PUBLIC_APPWRITE_PROJECT_ID=${projectId}\n`;
  }
  if (!/NEXT_PUBLIC_APPWRITE_ENDPOINT=.*/m.test(env)) {
    env = `NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1\n` + env;
  }
  writeFileSync(envPath, env);
  console.log(`✓ .env.local → NEXT_PUBLIC_APPWRITE_PROJECT_ID = ${projectId}`);
} else {
  console.log('⚠ .env.local not found — create it and set NEXT_PUBLIC_APPWRITE_PROJECT_ID');
}

// Point CLI at this project
try {
  execSync(
    `npx appwrite client -e https://syd.cloud.appwrite.io/v1 -p ${projectId}`,
    { cwd: ROOT, stdio: 'pipe' },
  );
  console.log(`✓ Appwrite CLI → project ${projectId}`);
} catch {
  console.log('⚠ Could not set CLI project — run after login:');
  console.log(`  npx appwrite client -e https://syd.cloud.appwrite.io/v1 -p ${projectId}`);
}

console.log('\nNext steps:');
console.log('  1. Add APPWRITE_API_KEY to .env.local');
console.log('  2. npx appwrite login');
console.log('  3. npm run appwrite:push');
console.log('  4. npm run appwrite:deploy');
