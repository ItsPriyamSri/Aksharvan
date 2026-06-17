/** Microphone access helpers — shared by voice input hooks. */

export type MicStream = MediaStream;

export async function getMicStream(): Promise<MicStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });
}

export async function requestMicPermission(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return false;
  }
  try {
    const stream = await getMicStream();
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
}

export function releaseMicStream(stream: MicStream | null): void {
  stream?.getTracks().forEach((t) => t.stop());
}

export function pickRecorderMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "audio/webm";
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") {
        reject(new Error("read failed"));
        return;
      }
      const comma = dataUrl.indexOf(",");
      resolve(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl);
    };
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(blob);
  });
}

type RecordOptions = {
  maxMs?: number;
  minMs?: number;
  silenceMs?: number;
  speechThreshold?: number;
};

/** Record from an open stream; stops early after speech + trailing silence (VAD). */
export function recordAudioFromStream(
  stream: MicStream,
  options: RecordOptions = {},
): Promise<{ blob: Blob; mimeType: string }> {
  const maxMs = options.maxMs ?? 7000;
  const minMs = options.minMs ?? 500;
  const silenceMs = options.silenceMs ?? 1300;
  const speechThreshold = options.speechThreshold ?? 14;

  const mimeType = pickRecorderMimeType();
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: Blob[] = [];

  return new Promise((resolve, reject) => {
    let settled = false;
    let speechDetected = false;
    let lastSpeechAt = 0;
    const startedAt = Date.now();
    let pollId: ReturnType<typeof setInterval> | null = null;
    let maxTimer: ReturnType<typeof setTimeout> | null = null;
    let audioCtx: AudioContext | null = null;

    const finish = (blob: Blob) => {
      if (settled) return;
      settled = true;
      if (pollId) clearInterval(pollId);
      if (maxTimer) clearTimeout(maxTimer);
      try { audioCtx?.close(); } catch { /* ignore */ }
      resolve({ blob, mimeType });
    };

    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      if (pollId) clearInterval(pollId);
      if (maxTimer) clearTimeout(maxTimer);
      try { if (recorder.state !== "inactive") recorder.stop(); } catch { /* ignore */ }
      try { audioCtx?.close(); } catch { /* ignore */ }
      reject(err);
    };

    const stopRecording = () => {
      if (recorder.state !== "inactive") {
        try { recorder.stop(); } catch { /* ignore */ }
      } else {
        finish(new Blob(chunks, { type: mimeType }));
      }
    };

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onerror = () => fail(new Error("recording failed"));

    recorder.onstop = () => {
      finish(new Blob(chunks, { type: mimeType }));
    };

    try {
      audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const freqData = new Uint8Array(analyser.frequencyBinCount);

      pollId = setInterval(() => {
        if (settled) return;
        const now = Date.now();
        const elapsed = now - startedAt;

        analyser.getByteFrequencyData(freqData);
        let sum = 0;
        for (let i = 0; i < freqData.length; i++) sum += freqData[i];
        const level = sum / freqData.length;

        if (level >= speechThreshold) {
          speechDetected = true;
          lastSpeechAt = now;
        }

        if (
          speechDetected
          && elapsed >= minMs
          && now - lastSpeechAt >= silenceMs
        ) {
          stopRecording();
          return;
        }

        if (!speechDetected && elapsed >= maxMs) {
          stopRecording();
        }
      }, 80);

      maxTimer = setTimeout(() => {
        if (!settled) stopRecording();
      }, maxMs + 400);

      recorder.start(100);
    } catch {
      recorder.start(100);
      maxTimer = setTimeout(() => {
        if (!settled) stopRecording();
      }, maxMs);
    }
  });
}

/** @deprecated Prefer recordAudioFromStream with a reused stream. */
export async function recordAudio(maxMs = 8000): Promise<{ blob: Blob; mimeType: string }> {
  const stream = await getMicStream();
  try {
    return await recordAudioFromStream(stream, { maxMs });
  } finally {
    releaseMicStream(stream);
  }
}
