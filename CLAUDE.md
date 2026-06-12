# CLAUDE.md — Aksharvan

See @README.md for project overview. See @package.json for available commands.

## What This Is

A mobile-first Hindi phonics learning PWA for children aged 4–10. Next.js 14 App Router,
TypeScript, Tailwind CSS, Appwrite Cloud (auth + database + storage + functions), deployed
as static files (nginx on Docker, AWS). Two guide characters — Tina and Toto — narrate in
Hindi through a "heal the magical forest" story-driven exercise loop.

## Commands

```bash
npm run dev          # local dev server
npm run build        # static export → out/
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run preview      # serve out/ locally with npx serve
```

```bash
appwrite deploy function   # deploy all Appwrite Functions
appwrite push              # push collections + buckets schema
```

```bash
docker build \
  --build-arg NEXT_PUBLIC_APPWRITE_ENDPOINT=$NEXT_PUBLIC_APPWRITE_ENDPOINT \
  --build-arg NEXT_PUBLIC_APPWRITE_PROJECT_ID=$NEXT_PUBLIC_APPWRITE_PROJECT_ID \
  -t aksharvan .
docker run -p 8080:80 aksharvan
```

## Project Structure

```
app/                  → Next.js App Router pages and layouts (ALL 'use client')
components/           → Reusable UI components
components/ui/        → Generic UI primitives
lib/appwrite/         → Appwrite SDK wrappers — single source of truth
lib/content/          → Bundled Level 1 content JSON (no API call needed)
lib/hooks/            → Custom React hooks
public/               → Static assets (images, Lottie, fonts)
appwrite/functions/   → Appwrite serverless functions (set-pin, login-with-pin, asr-recognize)
```

## Non-Negotiable Constraints

### Static Export — Never Break This

`output: 'export'` is set in `next.config.ts`. There is NO Next.js server runtime.

- ALL pages and components must be Client Components (`'use client'`) or fully
  statically generated at build time.
- NEVER use: Server Components with async data fetching, `getServerSideProps`,
  route handlers, server actions, `next/headers`, `cookies()`, or middleware
  that requires a server runtime.
- `images: { unoptimized: true }` must stay set — the image optimizer needs a server.
- Dynamic routes MUST have `generateStaticParams()` or the build breaks.
- `useSearchParams()` requires a Suspense boundary — always wrap it.
- When in doubt: run `npm run build`. Static export errors show there, not in dev.

### Appwrite Functions — Server Logic Stays There

- `set-pin`, `login-with-pin`, `asr-recognize` live in `appwrite/functions/`.
- Secrets (Appwrite API key, Sarvam key) exist only as Appwrite Function env vars.
- Never call the Appwrite server SDK from the Next.js app. Use the Web SDK only.

### Secrets and Environment Variables

- NEVER hardcode credentials, API keys, or service endpoints.
- `NEXT_PUBLIC_` prefix = baked into the client bundle at build time. Safe for
  public endpoints (Appwrite endpoint, project ID). Nothing sensitive.
- Non-`NEXT_PUBLIC_` vars exist only during `next build`, not at runtime in
  the static export. Do not rely on them for client-side logic.
- Dev: `.env.local` (gitignored). Prod: Docker `--build-arg`. Schema: `.env.example`.
- Never use `process.env.KEY ?? "actual_value"` — no real secrets as defaults.

## Workflow — Plan Before Acting

For any task touching 3 or more files:

1. Read the relevant existing files first.
2. State a numbered plan and identify the minimum set of files to change.
3. Identify the verification method (which command proves it works).
4. Implement only what the plan covers.

For single-file tasks: read the file, then edit. Do not skip the read.

## Code Hygiene — Mandatory, Every Task

**Before creating anything new:**
Search `lib/`, `components/`, and `hooks/` for existing implementations.
Prefer extending an existing module over writing a parallel one.
Do not create a new file until you have confirmed the logic does not already exist.

**While editing:**
- Touch only files and functions required for the task.
- Do not improve, reformat, or refactor adjacent code that is not broken.
- Match existing naming, file organisation, and code style exactly.
- If you spot pre-existing dead code, mention it — do not delete it unless asked.

**Before finishing:**
- Remove all `console.log`, `console.warn`, `console.error` you added.
- Remove commented-out code blocks you added during implementation.
- Remove unused imports your changes created.
- Remove temp files, scratch scripts, debug pages, placeholder assets.
- Run `npm run lint` and `npm run typecheck`. Fix all errors before stopping.
- Every changed line must trace directly to the stated task.

## Safety Checks

- Before modifying a shared utility in `lib/` or a component used across multiple
  pages: identify all call sites and assess the blast radius of your change.
- Preserve existing behaviour unless the task explicitly requires a behaviour change.
- Do not refactor things that are not broken.
- When changing the Appwrite schema (`appwrite.json`), also update the relevant
  TypeScript interfaces in `lib/appwrite/types.ts` in the same change.
- Run `npm run build` after any change to routing, `next.config.ts`, or env vars.

## Docker / Deployment Rules

- Two-stage Dockerfile only: `node:20-alpine` builder → `nginx:alpine` server.
- The build stage produces `out/`. nginx serves `out/`. No Node process at runtime.
- NEVER switch to `output: 'standalone'` — this changes the entire deployment model.
- NEVER add a Node runtime stage to the Dockerfile.
- `NEXT_PUBLIC_` vars are build-time only — always passed as `--build-arg` in CI/CD.
- `.dockerignore` must exclude: `node_modules`, `.next`, `out`, `.git`, `.env*`.
- `nginx.conf` must handle: `try_files $uri $uri.html /index.html` (SPA fallback),
  no-cache headers on the service worker file, gzip on, correct MIME types.
- Use `npm ci`, not `npm install`, in the Dockerfile for reproducible installs.
- Pin the Node version (`node:20.18-alpine`, not `node:lts` or `node:latest`).
- Every feature must be deployable from a clean checkout with documented commands only.
  If you add a build step, update `README.md` and relevant scripts in the same PR.

## Appwrite Schema Discipline

- `appwrite.json` is the source of truth for collections, attributes, indexes, and buckets.
- After any schema change: run `appwrite push` and document it in the PR.
- Collection document IDs follow the pattern: `profiles` → `userId`; `progress` → `${userId}_${levelId}`.
- `progress.state` is stored as a JSON string (Appwrite has no native JSON type).
  Always `JSON.stringify` on write and `JSON.parse` on read.

## What NOT to Put in This File

Detailed API documentation, long explanations, personality instructions, formatting
rules already enforced by ESLint/Prettier, and rules that only apply to one path.
Path-specific rules live in `.claude/rules/`. See that directory.
