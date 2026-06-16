#!/usr/bin/env node
/**
 * generate-audio.js — Build-time TTS pipeline
 *
 * Reads lib/content/narration-manifest.json, calls Sarvam AI (or ElevenLabs),
 * produces compressed mono Opus/AAC clips named by audioName, and uploads them
 * to the Appwrite `audio` bucket.
 *
 * Usage:
 *   node scripts/generate-audio.js          # skip existing files
 *   node scripts/generate-audio.js --force  # regenerate all
 *   node scripts/generate-audio.js --dry-run # validate manifest only, no API calls
 *
 * Required env vars (set in .env.local or CI secrets — never commit values):
 *   APPWRITE_FUNCTION_API_ENDPOINT  (same as NEXT_PUBLIC_APPWRITE_ENDPOINT)
 *   APPWRITE_PROJECT_ID             (same as NEXT_PUBLIC_APPWRITE_PROJECT_ID)
 *   APPWRITE_API_KEY
 *   SARVAM_API_KEY                  (or ELEVENLABS_API_KEY for the ElevenLabs path)
 *
 * Pedagogy rule enforced: "teach" and "sound" category clips MUST use the
 * pattern "object — sound" (e.g. "बतख — ब"). Lines matching the bad patterns
 * "ब से बतख", "बतख से ब", "से" anywhere in teach/sound clips are REJECTED.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Client, Storage } from 'node-appwrite';
import { loadEnvLocal } from './load-env-local.mjs';

loadEnvLocal();

const __dirname  = dirname(fileURLToPath(import.meta.url));
const ROOT       = resolve(__dirname, '..');
const MANIFEST   = resolve(ROOT, 'lib/content/narration-manifest.json');
const VOICE_CFG  = JSON.parse(readFileSync(resolve(ROOT, 'lib/content/sarvam-voices.json'), 'utf8'));
const BUCKET_ID  = 'audio';

const args     = process.argv.slice(2);
const FORCE    = args.includes('--force');
const DRY_RUN  = args.includes('--dry-run');

// ---------------------------------------------------------------------------
// Pedagogy guard
// ---------------------------------------------------------------------------

/**
 * Patterns the ALfA approach explicitly forbids in teaching clips.
 * "से" (meaning "from") inverts the object→sound ordering.
 */
const BAD_PATTERNS = [
  /से\s+\S/u,   // "ब से बतख" pattern
  /\S+\s+से/u,  // "बतख से ब" pattern
];

/**
 * @param {{ audioName: string, text: string, category: string }} entry
 * @throws {Error} if the entry violates the pedagogy rule
 */
function assertPedagogyRule(entry) {
  if (entry.category !== 'teach' && entry.category !== 'sound') return;
  for (const pattern of BAD_PATTERNS) {
    if (pattern.test(entry.text)) {
      throw new Error(
        `PEDAGOGY VIOLATION in "${entry.audioName}": text "${entry.text}" ` +
        `matches bad pattern ${pattern}. ` +
        `Sound clips must say "object — sound" (e.g. "बतख — ब"), never "ब से बतख".`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Manifest validation
// ---------------------------------------------------------------------------

function loadAndValidateManifest() {
  if (!existsSync(MANIFEST)) {
    throw new Error(`Manifest not found: ${MANIFEST}`);
  }
  const raw      = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const entries  = raw.entries;
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('Manifest entries array is missing or empty');
  }

  const seen = new Set();
  for (const entry of entries) {
    if (!entry.audioName || !entry.text || !entry.voice || !entry.category) {
      throw new Error(
        `Invalid manifest entry (missing field): ${JSON.stringify(entry)}`
      );
    }
    if (seen.has(entry.audioName)) {
      throw new Error(`Duplicate audioName: "${entry.audioName}"`);
    }
    seen.add(entry.audioName);
    assertPedagogyRule(entry);
  }

  return entries;
}

// ---------------------------------------------------------------------------
// TTS providers
// ---------------------------------------------------------------------------

/**
 * Call Sarvam AI TTS.
 * Returns a Buffer of audio bytes (WAV / the provider's native format).
 *
 * @param {string} text     Hindi text
 * @param {string} voice    'tina' | 'toto' | 'default'
 * @returns {Promise<Buffer>}
 */
async function callSarvam(text, voice) {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) throw new Error('SARVAM_API_KEY is not set in .env.local');

  const profile = VOICE_CFG.voices[voice] ?? VOICE_CFG.voices.default;
  const model = VOICE_CFG.model ?? 'bulbul:v3';

  const response = await fetch('https://api.sarvam.ai/text-to-speech', {
    method:  'POST',
    headers: {
      'Content-Type':         'application/json',
      'api-subscription-key': apiKey,
    },
    body: JSON.stringify({
      inputs:               [text],
      target_language_code: VOICE_CFG.target_language_code ?? 'hi-IN',
      speaker:              profile.speaker,
      pace:                 profile.pace,
      speech_sample_rate:   VOICE_CFG.speech_sample_rate ?? 24000,
      enable_preprocessing: VOICE_CFG.enable_preprocessing ?? true,
      model,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Sarvam TTS HTTP ${response.status}: ${body.slice(0, 300)}`);
  }

  const data = await response.json();
  const b64 = data.audios?.[0];
  if (!b64) throw new Error('Sarvam TTS returned no audio data');
  return Buffer.from(b64, 'base64');
}

/**
 * Call ElevenLabs TTS (fallback provider).
 *
 * @param {string} text
 * @param {string} voice   'tina' | 'toto' | 'default'
 * @returns {Promise<Buffer>}
 */
async function callElevenLabs(text, voice) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is not set');

  // Map voice names to ElevenLabs voice IDs (update with real IDs from the console)
  const voiceIds = {
    tina:    process.env.ELEVENLABS_VOICE_TINA    ?? 'EXAVITQu4vr4xnSDxMaL',
    toto:    process.env.ELEVENLABS_VOICE_TOTO    ?? 'onwK4e9ZLuTAKqWW03F9',
    default: process.env.ELEVENLABS_VOICE_DEFAULT ?? 'EXAVITQu4vr4xnSDxMaL',
  };
  const voiceId = voiceIds[voice] ?? voiceIds.default;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'xi-api-key':    apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.6, similarity_boost: 0.8 },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`ElevenLabs TTS HTTP ${response.status}: ${body.slice(0, 200)}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

/**
 * Choose provider based on env vars present.
 * Prefers Sarvam; falls back to ElevenLabs.
 *
 * @param {string} text
 * @param {string} voice
 * @returns {Promise<Buffer>}
 */
async function generateAudio(text, voice) {
  if (process.env.SARVAM_API_KEY) return callSarvam(text, voice);
  if (process.env.ELEVENLABS_API_KEY) return callElevenLabs(text, voice);
  throw new Error(
    'No TTS provider configured. Set SARVAM_API_KEY or ELEVENLABS_API_KEY in .env.local.'
  );
}

// ---------------------------------------------------------------------------
// Appwrite upload helper
// ---------------------------------------------------------------------------

function buildClient() {
  const endpoint  = process.env.APPWRITE_FUNCTION_API_ENDPOINT
    ?? process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID
    ?? process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey    = process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    throw new Error(
      'Missing Appwrite env vars. Set APPWRITE_FUNCTION_API_ENDPOINT (or NEXT_PUBLIC_APPWRITE_ENDPOINT), ' +
      'APPWRITE_PROJECT_ID (or NEXT_PUBLIC_APPWRITE_PROJECT_ID), and APPWRITE_API_KEY.'
    );
  }
  return new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
}

/**
 * Check if a file named audioName already exists in the audio bucket.
 *
 * @param {Storage} storage
 * @param {string}  audioName
 * @returns {Promise<boolean>}
 */
async function fileExists(storage, audioName) {
  try {
    await storage.getFile(BUCKET_ID, audioName);
    return true;
  } catch {
    return false;
  }
}

/**
 * Upload audio buffer to the Appwrite audio bucket.
 * Uses audioName as the stable file ID so the frontend can reference it directly.
 *
 * @param {Storage} storage
 * @param {string}  audioName
 * @param {Buffer}  audioBuffer
 * @param {string}  mimeType
 */
async function uploadFile(storage, audioName, audioBuffer, mimeType) {
  const blob = new Blob([audioBuffer], { type: mimeType });
  // Delete existing file if --force is set
  if (FORCE) {
    try { await storage.deleteFile(BUCKET_ID, audioName); } catch { /* not found */ }
  }
  await storage.createFile(BUCKET_ID, audioName, blob);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function profileLabel(voice) {
  const p = VOICE_CFG.voices[voice] ?? VOICE_CFG.voices.default;
  return `${p.speaker} pace=${p.pace}`;
}

async function main() {
  console.log('Aksharvan TTS pipeline');
  console.log(`Model: ${VOICE_CFG.model}`);
  console.log(`Tina → ${VOICE_CFG.voices.tina.speaker}, Toto → ${VOICE_CFG.voices.toto.speaker}`);
  console.log(`Manifest: ${MANIFEST}`);
  if (DRY_RUN) console.log('Mode: DRY RUN (no API calls, no uploads)');
  if (FORCE)   console.log('Mode: --force (regenerate all files)');
  console.log('');

  // Validate manifest (always — catches pedagogy violations early)
  let entries;
  try {
    entries = loadAndValidateManifest();
    console.log(`✓ Manifest valid: ${entries.length} entries, pedagogy rules pass`);
  } catch (err) {
    console.error('✗ Manifest error:', err.message);
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log('\nDry run complete. All entries validated.');
    return;
  }

  // Build Appwrite client
  let storage;
  try {
    const client = buildClient();
    storage = new Storage(client);
  } catch (err) {
    console.error('✗ Appwrite config error:', err.message);
    process.exit(1);
  }

  let skipped = 0;
  let uploaded = 0;
  let errors   = 0;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  for (const entry of entries) {
    const { audioName, text, voice } = entry;

    // Skip if already uploaded (unless --force)
    if (!FORCE && await fileExists(storage, audioName)) {
      process.stdout.write(`  skip  ${audioName}\n`);
      skipped++;
      continue;
    }

    process.stdout.write(`  gen   ${audioName} ...`);
    try {
      const audioBuffer = await generateAudio(text, voice);
      const mimeType = 'audio/wav';
      await uploadFile(storage, audioName, audioBuffer, mimeType);
      process.stdout.write(` ✓ (${profileLabel(voice)}, ${audioBuffer.length} bytes)\n`);
      uploaded++;
      await sleep(250);
    } catch (err) {
      process.stdout.write(` ✗\n`);
      console.error(`    Error: ${err.message}`);
      errors++;
    }
  }

  console.log('');
  console.log(`Done: ${uploaded} uploaded, ${skipped} skipped, ${errors} errors`);
  if (errors > 0) process.exit(1);
}

main();
