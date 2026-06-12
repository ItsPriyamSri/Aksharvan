/**
 * Closed-vocabulary matching for child Hindi ASR responses.
 *
 * Strategy (applied in order, most-lenient bias for child learners):
 *   1. Normalize both sides (trim, lowercase, strip diacritics, collapse spaces)
 *   2. Exact match
 *   3. Substring containment (child says "yeh ek batakh hai" → contains "batakh")
 *   4. Fuzzy edit distance ≤ 2 (short substitutions / child pronunciation drift)
 *
 * Returns { matched: boolean, confidence: number } where confidence is 0–1.
 */

/**
 * Strip combining diacritics (Devanagari matras etc.) and normalise whitespace.
 * Covers ASCII + Unicode Mn (non-spacing marks).
 *
 * @param {string} s
 * @returns {string}
 */
export function normalize(s) {
  if (typeof s !== 'string') return '';
  return s
    .normalize('NFD')
    .replace(/[̀-ͯऀ-ॿ]/gu, (ch) => {
      // Keep base Devanagari letters (consonants + independent vowels: ऀ-ी range)
      // but strip matras (ु-ॏ), virama (्), nukta (़), anusvara (ं), visarga (ः)
      const cp = ch.codePointAt(0);
      if (cp >= 0x0941 && cp <= 0x094f) return ''; // matras
      if (cp === 0x094d) return '';                  // virama
      if (cp === 0x093c) return '';                  // nukta
      if (cp === 0x0902 || cp === 0x0903) return ''; // anusvara / visarga
      return ch;
    })
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Wagner-Fischer edit distance (Levenshtein).
 *
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Match transcript against the closed vocabulary.
 *
 * @param {string}   transcript      raw transcript from the ASR provider
 * @param {string[]} expected        closed vocab (e.g. ["batakh", "बतख"])
 * @param {number}   providerConf    provider's own confidence (0–1)
 * @returns {{ matched: boolean, confidence: number }}
 */
export function matchTranscript(transcript, expected, providerConf = 0) {
  const normT = normalize(transcript);

  let bestConf = 0;

  for (const word of expected) {
    const normW = normalize(word);
    if (!normW) continue;

    // Exact match
    if (normT === normW) {
      return { matched: true, confidence: 1.0 };
    }

    // Substring containment — child adds filler words
    if (normT.includes(normW) || normW.includes(normT)) {
      bestConf = Math.max(bestConf, 0.85);
      continue;
    }

    // Fuzzy: edit distance ≤ 2 (lenient for child pronunciation drift)
    const dist = editDistance(normT, normW);
    if (dist <= 2) {
      // confidence degrades linearly: dist 0→1.0, dist 1→0.75, dist 2→0.55
      const fuzzyConf = dist === 1 ? 0.75 : 0.55;
      bestConf = Math.max(bestConf, fuzzyConf);
    }
  }

  const matched = bestConf >= 0.55;
  // Blend with provider confidence — bias toward matching for children
  const blended = matched
    ? Math.max(bestConf, (bestConf + providerConf) / 2)
    : Math.min(bestConf, (bestConf + providerConf) / 2);

  return { matched, confidence: parseFloat(blended.toFixed(3)) };
}
