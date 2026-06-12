/**
 * Sarvam AI ASR provider.
 *
 * Implements the recognize(audioBuffer, mimeType, lang) interface.
 * Swap this file for google.js / whisper.js to change providers — the
 * interface is the only contract the rest of the function uses.
 *
 * Returns: { transcript: string, confidence: number }
 */

const SARVAM_ASR_URL = 'https://api.sarvam.ai/speech-to-text';

/**
 * @param {Buffer} audioBuffer  raw audio bytes
 * @param {string} mimeType     e.g. 'audio/webm' or 'audio/ogg; codecs=opus'
 * @param {string} lang         BCP-47 language code, default 'hi-IN'
 * @returns {Promise<{ transcript: string, confidence: number }>}
 */
export async function recognize(audioBuffer, mimeType, lang = 'hi-IN') {
  const apiKey = process.env.SARVAM_API_KEY;

  // Mock mode — when no API key is configured return a stub
  if (!apiKey) {
    return { transcript: '__MOCK_TRANSCRIPT__', confidence: 0 };
  }

  const form = new FormData();
  const blob = new Blob([audioBuffer], { type: mimeType });
  form.append('file', blob, 'audio.bin');
  form.append('language_code', lang);
  form.append('model', 'saarika:v1');
  form.append('with_timestamps', 'false');

  const response = await fetch(SARVAM_ASR_URL, {
    method: 'POST',
    headers: { 'api-subscription-key': apiKey },
    body: form,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Sarvam ASR HTTP ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();

  // Sarvam returns { transcript: string, ... }
  const transcript = (data.transcript ?? '').trim();
  // Provider does not expose per-word confidence; use request-level placeholder
  const confidence = typeof data.confidence === 'number' ? data.confidence : 0.8;

  return { transcript, confidence };
}
