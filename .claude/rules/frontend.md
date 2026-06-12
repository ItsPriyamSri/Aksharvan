---
paths:
  - "app/**/*"
  - "components/**/*"
  - "lib/hooks/**/*"
  - "lib/content/**/*"
---

# Frontend Rules (app/, components/, lib/hooks/, lib/content/)

## Every file here is client-side. No exceptions.

- Every file in `app/` and `components/` must begin with `'use client'` unless it is
  a purely static layout or a `generateStaticParams` export with no interactivity.
- If a file needs data, it fetches it from Appwrite using the Web SDK in a hook or
  `useEffect`. Never use server-side data fetching patterns.
- `lib/content/` is bundled JSON — import it as a module, do not fetch it over the network.

## Appwrite Web SDK (lib/appwrite/)

- Never initialise the Appwrite `Client` more than once. Use the singleton in
  `lib/appwrite/client.ts`. Do not create a second client anywhere.
- Auth calls: `account.createPhoneToken` → `account.createSession`.
- Database: `databases.createDocument` / `getDocument` / `updateDocument`.
  Always pass per-user permissions on create:
  `[Permission.read(Role.user(userId)), Permission.update(Role.user(userId))]`
- Storage URLs: `storage.getFileView(bucketId, fileId)` for audio/Lottie;
  `storage.getFilePreview(bucketId, fileId, width, height, undefined, quality, undefined, undefined, undefined, undefined, undefined, undefined, 'webp')`
  for images (request WebP + downscale for low-bandwidth devices).
- Function calls: `functions.createExecution(functionId, JSON.stringify(body))`.
  Parse the response with `JSON.parse(execution.responseBody)`.

## Component conventions

- New components go in `components/`. Generic UI primitives go in `components/ui/`.
  Before creating a component, check both directories.
- Props interfaces are defined in the same file as the component (not a separate types file)
  unless the type is shared across 3+ components — then it goes in `lib/appwrite/types.ts`.
- Tailwind only for styling. No inline styles, no CSS modules, no styled-components.
- Framer Motion for transitions and microinteractions. No CSS animation on interactive elements.
- Lottie animations via `lottie-react`. JSON files live in `public/animations/`.
- Audio via Howler.js. All audio is pre-generated and served from Appwrite Storage.
  Never call a TTS API at runtime.

## Hindi / Devanagari rendering

- Fonts loaded via `next/font/google` with `subsets: ['latin', 'devanagari']`.
  Do not load fonts any other way (no `<link>` tags, no CDN imports).
- Letter tiles (अक्षर glyphs) are always typographic — rendered from `Tiro Devanagari Hindi`.
  They are never image assets.

## Exercise engine

- The exercise player reads from `lib/content/level1.json`. It is a generic engine —
  do not hardcode exercise content into component logic.
- `progress.state` is always `JSON.stringify`'d on write to Appwrite and `JSON.parse`'d
  on read. Never write a plain object to the `state` attribute.
- Auto-advance and mic-arming logic lives in the exercise engine, not in individual
  exercise components.
