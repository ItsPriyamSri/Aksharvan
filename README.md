# Aksharvan

A mobile-first Hindi phonics learning PWA for children aged 4–10. Next.js 14 App Router,
TypeScript, Tailwind CSS, Appwrite Cloud (auth + database + storage + functions).

Two guide characters — Tina and Toto — narrate in Hindi through a "heal the magical forest"
story-driven exercise loop (Jadooi Jungle, Level 1).

---

## Frontend development

```bash
npm install
npm run dev        # local dev server at http://localhost:3000
npm run build      # static export → out/
npm run typecheck  # tsc --noEmit
npm run lint       # ESLint
npm run preview    # serve out/ locally
```

---

## Backend — Appwrite

### Prerequisites

- An [Appwrite Cloud](https://cloud.appwrite.io) account (or self-hosted Appwrite ≥ 1.5)
- [Appwrite CLI](https://appwrite.io/docs/tooling/command-line/installation) installed globally
- A `.env.local` file (copy `.env.example` and fill in the values)

### One-time setup

Full walkthrough: **[docs/APPWRITE-SETUP.md](docs/APPWRITE-SETUP.md)**  
Quick status: `npm run appwrite:check`

1. **Create the Appwrite project** in the cloud console.

2. **Login and link the project:**
   ```bash
   appwrite login
   appwrite init project   # or: set projectId in appwrite.json manually
   ```

3. **Push the schema** (database, collections, indexes, buckets):
   ```bash
   appwrite push
   ```
   This provisions everything defined in `appwrite.json`. Run again after any schema change.

4. **Configure SMS provider** (for phone OTP):
   - Console → Auth → SMS provider → select MSG91 (recommended for India)
   - Enter MSG91 API key + sender ID + DLT template ID
   - Enable "Phone" under Auth → Settings

5. **Deploy the Functions:**
   ```bash
   appwrite deploy function --all
   ```
   This deploys `set-pin`, `login-with-pin`, and `asr-recognize`.

6. **Set Function environment variables** in the Appwrite console (Auth → Functions →
   select each function → Settings → Variables). See the table below.

7. **Generate and upload narration audio** (requires TTS API key — see below):
   ```bash
   npm run generate-audio            # generate all; skip existing files
   npm run generate-audio -- --force # force-regenerate all files
   npm run generate-audio -- --dry-run # validate manifest only; no API calls
   ```

### Function environment variables

Set these in the Appwrite console — **never** in source files or `.env*` committed to git.

| Variable | Functions that use it | Purpose |
|---|---|---|
| `APPWRITE_API_KEY` | `set-pin`, `login-with-pin`, `asr-recognize` | Server SDK — write to database, mint tokens |
| `SARVAM_API_KEY` | `asr-recognize` | Sarvam AI ASR for Hindi speech recognition |

For the TTS pipeline script (local / CI only — not a deployed Function):

| Variable | Purpose |
|---|---|
| `APPWRITE_FUNCTION_API_ENDPOINT` | Appwrite endpoint (same value as `NEXT_PUBLIC_APPWRITE_ENDPOINT`) |
| `APPWRITE_PROJECT_ID` | Appwrite project ID |
| `APPWRITE_API_KEY` | Server SDK key for uploading to the `audio` bucket |
| `SARVAM_API_KEY` | Sarvam AI TTS (primary) |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS (fallback if Sarvam key absent) |
| `ELEVENLABS_VOICE_TINA` | ElevenLabs voice ID for Tina (optional; has a default) |
| `ELEVENLABS_VOICE_TOTO` | ElevenLabs voice ID for Toto (optional; has a default) |

### Schema changes

After editing `appwrite.json`, always run `appwrite push`. If you change a TypeScript
interface in `lib/appwrite/types.ts`, update the corresponding collection attribute in
`appwrite.json` in the same commit.

### Project layout (backend files)

```
appwrite.json                         # schema source of truth
appwrite/functions/
  set-pin/src/main.js                 # set 4-digit PIN on profile
  login-with-pin/src/main.js          # PIN login → custom token → session
  asr-recognize/src/main.js           # Hindi ASR proxy + closed-vocab match
  asr-recognize/src/match.js          # matching logic (unit-testable)
  asr-recognize/src/match.test.js     # 22 unit tests — run: node src/match.test.js
  asr-recognize/src/providers/sarvam.js  # Sarvam AI provider (swappable)
scripts/
  generate-audio.js                   # build-time TTS pipeline
lib/
  appwrite/
    types.ts                          # shared TypeScript interfaces (frontend imports)
    constants.ts                      # collection/bucket/function IDs
  content/
    narration-manifest.json           # 72 narration entries with Hindi copy
docs/
  BACKEND-INTEGRATION.md             # frontend integration guide
.env.example                          # env var schema (no real values)
```

---

## Docker

```bash
docker build \
  --build-arg NEXT_PUBLIC_APPWRITE_ENDPOINT=$NEXT_PUBLIC_APPWRITE_ENDPOINT \
  --build-arg NEXT_PUBLIC_APPWRITE_PROJECT_ID=$NEXT_PUBLIC_APPWRITE_PROJECT_ID \
  -t aksharvan .

docker run -p 8080:80 aksharvan
```

---

## Privacy

This app serves children (ages 4–10). Audio recordings are stored **only with explicit
parental consent** (`x-consent: true` header on `asr-recognize`). See
[docs/BACKEND-INTEGRATION.md §6](docs/BACKEND-INTEGRATION.md#6-account-deletion--data-cleanup)
for the account deletion and data cleanup procedure.
