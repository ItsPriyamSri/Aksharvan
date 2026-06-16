#!/usr/bin/env node
/**
 * Provision Appwrite resources via API key (no CLI login required).
 * Run: npm run appwrite:provision
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Client, Storage, Databases, Permission, Role } from 'node-appwrite';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCHEMA = JSON.parse(readFileSync(resolve(ROOT, 'appwrite.json'), 'utf8'));

function loadEnv() {
  const path = resolve(ROOT, '.env.local');
  if (!existsSync(path)) throw new Error('.env.local not found');
  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split('\n')
      .filter((l) => l && !l.startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i), l.slice(i + 1)];
      }),
  );
}

async function ensureBucket(storage, bucket) {
  try {
    await storage.getBucket(bucket.$id);
    console.log(`  ✓ bucket exists: ${bucket.$id}`);
    return;
  } catch {
    /* create */
  }
  const perms = (bucket.$permissions ?? []).map((p) => {
    if (p === 'read("any")') return Permission.read(Role.any());
    return p;
  });
  await storage.createBucket(
    bucket.$id,
    bucket.name,
    perms,
    false, // fileSecurity
    bucket.enabled,
    bucket.maximumFileSize,
    bucket.allowedFileExtensions,
    bucket.compression === 'gzip' ? 'gzip' : 'none',
    bucket.encryption,
    bucket.antivirus,
  );
  console.log(`  + created bucket: ${bucket.$id}`);
}

async function ensureDatabase(databases, db) {
  try {
    await databases.get(db.$id);
    console.log(`  ✓ database exists: ${db.$id}`);
  } catch {
    await databases.create(db.$id, db.name);
    console.log(`  + created database: ${db.$id}`);
  }
}

async function ensureCollection(databases, col) {
  try {
    await databases.getCollection(col.databaseId, col.$id);
    console.log(`  ✓ collection exists: ${col.$id}`);
  } catch {
    await databases.createCollection(
      col.databaseId,
      col.$id,
      col.name,
      [],
      col.documentSecurity,
    );
    console.log(`  + created collection: ${col.$id}`);
  }

  for (const attr of col.attributes ?? []) {
    try {
      if (attr.type === 'string') {
        await databases.createStringAttribute(
          col.databaseId, col.$id, attr.key, attr.size, attr.required, attr.default, attr.array,
        );
        console.log(`    + attr ${col.$id}.${attr.key}`);
      } else if (attr.type === 'integer') {
        await databases.createIntegerAttribute(
          col.databaseId, col.$id, attr.key, attr.required, attr.min, attr.max, attr.default, attr.array,
        );
        console.log(`    + attr ${col.$id}.${attr.key}`);
      } else if (attr.type === 'boolean') {
        await databases.createBooleanAttribute(
          col.databaseId, col.$id, attr.key, attr.required, attr.default, attr.array,
        );
        console.log(`    + attr ${col.$id}.${attr.key}`);
      } else if (attr.type === 'datetime') {
        await databases.createDatetimeAttribute(
          col.databaseId, col.$id, attr.key, attr.required, attr.default, attr.array,
        );
        console.log(`    + attr ${col.$id}.${attr.key}`);
      }
    } catch (e) {
      if (!String(e.message).includes('already exists')) {
        console.log(`    ~ attr ${col.$id}.${attr.key}: ${e.message.slice(0, 60)}`);
      }
    }
  }

  for (const idx of col.indexes ?? []) {
    try {
      await databases.createIndex(
        col.databaseId, col.$id, idx.key, idx.type, idx.attributes, idx.orders,
      );
      console.log(`    + index ${col.$id}.${idx.key}`);
    } catch (e) {
      if (!String(e.message).includes('already exists')) {
        console.log(`    ~ index ${col.$id}.${idx.key}: ${e.message.slice(0, 60)}`);
      }
    }
  }
}

async function main() {
  const env = loadEnv();
  const endpoint = env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = env.APPWRITE_API_KEY;
  if (!endpoint || !projectId || !apiKey) throw new Error('Missing env vars in .env.local');

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const storage = new Storage(client);
  const databases = new Databases(client);

  console.log(`\nProvisioning Aksharvan on ${endpoint}\n`);

  console.log('Buckets:');
  for (const b of SCHEMA.buckets) {
    try {
      await ensureBucket(storage, b);
    } catch (e) {
      console.log(`  ~ bucket ${b.$id}: ${e.message.slice(0, 70)}`);
    }
  }

  console.log('\nDatabases:');
  for (const d of SCHEMA.databases) await ensureDatabase(databases, d);

  console.log('\nCollections:');
  for (const c of SCHEMA.collections) await ensureCollection(databases, c);

  console.log('\n✓ Provision complete. Functions still need: npx appwrite login && npm run appwrite:deploy\n');
}

main().catch((e) => { console.error('✗', e.message); process.exit(1); });
