/**
 * Unit tests for match.js — run with: node src/match.test.js
 * Exits 0 on pass, 1 on failure.
 */

import { normalize, editDistance, matchTranscript } from './match.js';

let passed = 0;
let failed = 0;

function assert(label, actual, expected) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    console.error(`    expected: ${JSON.stringify(expected)}`);
    console.error(`    actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

// --- normalize ---
console.log('\nnormalize():');
assert('lowercase',          normalize('Batakh'), 'batakh');
assert('trim whitespace',    normalize('  batakh  '), 'batakh');
assert('collapse spaces',    normalize('yeh  ek  hai'), 'yeh ek hai');
assert('Devanagari base',    normalize('बतख') !== '', true);  // doesn't strip the base letter
assert('empty string',       normalize(''), '');
assert('non-string',         normalize(null), '');

// --- editDistance ---
console.log('\neditDistance():');
assert('identical',          editDistance('batakh', 'batakh'), 0);
assert('one sub',            editDistance('batakh', 'badakh'), 1);
assert('two subs',           editDistance('batakh', 'badabh'), 2);
assert('one insert',         editDistance('bat', 'baat'), 1);
assert('empty vs word',      editDistance('', 'bat'), 3);

// --- matchTranscript ---
console.log('\nmatchTranscript():');

// Exact match
const r1 = matchTranscript('batakh', ['batakh'], 0.9);
assert('exact match → matched', r1.matched, true);
assert('exact match → confidence 1.0', r1.confidence, 1.0);

// Substring containment — child adds filler
const r2 = matchTranscript('yeh ek batakh hai', ['batakh'], 0.7);
assert('substring → matched', r2.matched, true);
assert('substring → confidence ≥ 0.7', r2.confidence >= 0.7, true);

// Fuzzy distance = 1
const r3 = matchTranscript('badakh', ['batakh'], 0.6);
assert('fuzzy dist=1 → matched', r3.matched, true);
assert('fuzzy dist=1 → confidence < 1', r3.confidence < 1, true);

// Fuzzy distance = 2
const r4 = matchTranscript('baadkh', ['batakh'], 0.5);
assert('fuzzy dist=2 → matched', r4.matched, true);

// No match
const r5 = matchTranscript('sapera', ['batakh'], 0.9);
assert('no match → not matched', r5.matched, false);
assert('no match → low confidence', r5.confidence < 0.55, true);

// Multiple expected words — should match any
const r6 = matchTranscript('बतख', ['batakh', 'बतख'], 0.8);
assert('multi-expected → matched on Devanagari', r6.matched, true);

// Strict mismatch (distance > 2)
const r7 = matchTranscript('elephant', ['batakh'], 0.9);
assert('long mismatch → not matched', r7.matched, false);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
