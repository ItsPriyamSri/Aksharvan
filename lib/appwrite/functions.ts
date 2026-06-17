// Aksharvan — Appwrite Functions Service
// Wrappers for the three backend functions (spec §4).

import { ExecutionMethod } from "appwrite";
import { functions, account } from "./client";
import { FUNCTION_SET_PIN, FUNCTION_LOGIN_WITH_PIN, FUNCTION_ASR_RECOGNIZE } from "./constants";

// ─── set-pin ─────────────────────────────────────────────────────────────────

export async function setPin(pin: string): Promise<void> {
  const execution = await functions.createExecution(
    FUNCTION_SET_PIN,
    JSON.stringify({ pin }),
    false,
    "/",
    ExecutionMethod.POST
  );

  const result = JSON.parse(execution.responseBody ?? "{}");
  if (!result.ok) {
    throw new Error("setPin: function returned not-ok");
  }
}

// ─── login-with-pin ───────────────────────────────────────────────────────────

type LoginWithPinResult = {
  userId: string;
  secret: string;
};

export async function loginWithPin(
  phone: string,
  pin: string
): Promise<LoginWithPinResult> {
  const execution = await functions.createExecution(
    FUNCTION_LOGIN_WITH_PIN,
    JSON.stringify({ phone, pin }),
    false,
    "/",
    ExecutionMethod.POST
  );

  const result = JSON.parse(execution.responseBody ?? "{}") as LoginWithPinResult;
  if (!result.userId || !result.secret) {
    throw new Error("loginWithPin: invalid response");
  }
  return result;
}

/**
 * Full PIN login: call loginWithPin function, then createSession with the secret.
 */
export async function loginWithPinFull(phone: string, pin: string): Promise<void> {
  const { userId, secret } = await loginWithPin(phone, pin);
  await account.createSession(userId, secret);
}

// ─── asr-recognize ────────────────────────────────────────────────────────────

type AsrRequest = {
  audioBase64: string;
  mimeType: string;
  expected: string[];
  exerciseId: string;
};

export type AsrResult = {
  matched: boolean;
  confidence: number;
  transcript: string;
};

export async function recognizeSpeech(req: AsrRequest): Promise<AsrResult> {
  const execution = await functions.createExecution(
    FUNCTION_ASR_RECOGNIZE,
    JSON.stringify(req),
    false,
    "/",
    ExecutionMethod.POST,
  );

  const result = JSON.parse(execution.responseBody ?? "{}") as AsrResult & {
    error?: string;
    code?: string;
  };

  if (result.error) {
    throw new Error(result.error);
  }
  if (typeof result.matched !== "boolean") {
    throw new Error("asr-recognize returned an invalid response");
  }

  return result;
}
