/** Microphone access helpers — shared by voice input hooks. */

export async function requestMicPermission(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return false;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
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

export async function recordAudio(maxMs = 8000): Promise<{ blob: Blob; mimeType: string }> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = pickRecorderMimeType();
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: Blob[] = [];

  return new Promise((resolve, reject) => {
    const stopAll = () => stream.getTracks().forEach((t) => t.stop());

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onerror = () => {
      stopAll();
      reject(new Error("recording failed"));
    };

    recorder.onstop = () => {
      stopAll();
      resolve({ blob: new Blob(chunks, { type: mimeType }), mimeType });
    };

    recorder.start(250);
    setTimeout(() => {
      if (recorder.state !== "inactive") recorder.stop();
    }, maxMs);
  });
}
