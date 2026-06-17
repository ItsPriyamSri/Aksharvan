function isEmojiCodePoint(cp: number): boolean {
  if (cp === 0xfe0f || cp === 0x200d) return true;
  if (cp >= 0x1f300 && cp <= 0x1faff) return true;
  if (cp >= 0x2600 && cp <= 0x27bf) return true;
  if (cp >= 0x1f1e6 && cp <= 0x1f1ff) return true;
  return false;
}

/** Remove emoji / pictographs so TTS does not say "biceps", "sparkles", etc. */
export function stripEmojisForSpeech(text: string): string {
  const result: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const cp = text.codePointAt(i);
    if (cp === undefined) continue;
    if (isEmojiCodePoint(cp)) {
      if (cp > 0xffff) i++;
      continue;
    }
    result.push(String.fromCodePoint(cp));
    if (cp > 0xffff) i++;
  }
  return result.join("").replace(/\s+/g, " ").trim();
}
