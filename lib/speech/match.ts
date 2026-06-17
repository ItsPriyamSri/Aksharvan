/** Client-side closed-vocabulary matching (mirrors appwrite/functions/asr-recognize/src/match.js). */

export function normalizeSpeech(text: string): string {
  if (!text) return "";
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function matchTranscript(
  transcript: string,
  expected: string[],
  providerConf = 0,
): { matched: boolean; confidence: number } {
  const normT = normalizeSpeech(transcript);
  let bestConf = 0;

  for (const word of expected) {
    const normW = normalizeSpeech(word);
    if (!normW) continue;

    if (normT === normW) return { matched: true, confidence: 1 };

    if (normT.includes(normW) || normW.includes(normT)) {
      bestConf = Math.max(bestConf, 0.85);
      continue;
    }

    const dist = editDistance(normT, normW);
    if (dist <= 2) {
      bestConf = Math.max(bestConf, dist === 1 ? 0.75 : 0.55);
    }
  }

  const matched = bestConf >= 0.55;
  const blended = matched
    ? Math.max(bestConf, (bestConf + providerConf) / 2)
    : Math.min(bestConf, (bestConf + providerConf) / 2);

  return { matched, confidence: parseFloat(blended.toFixed(3)) };
}

export function matchesAnyOption(transcript: string, options: string[]): boolean {
  return matchTranscript(transcript, options).matched;
}
