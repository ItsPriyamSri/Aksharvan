import { appwriteFunctions } from '../client';
import { isAppwriteConfigured } from '../config';
import { FUNCTION_SET_PIN } from '../constants';

const PIN_SET_KEY = 'aksharvan:pin-set';

export async function setPin(pin: string): Promise<void> {
  if (isAppwriteConfigured()) {
    await appwriteFunctions.createExecution(
      FUNCTION_SET_PIN,
      JSON.stringify({ pin }),
    );
    return;
  }
  localStorage.setItem(PIN_SET_KEY, '1');
}

export function isPinSet(): boolean {
  return localStorage.getItem(PIN_SET_KEY) === '1';
}
