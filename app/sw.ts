import { defaultCache } from '@serwist/next/worker';
import { Serwist, PrecacheEntry } from 'serwist';

declare const self: typeof globalThis & {
  __SW_MANIFEST: (PrecacheEntry | string)[];
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
