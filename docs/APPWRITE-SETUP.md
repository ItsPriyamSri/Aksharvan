# Appwrite Setup — Aksharvan

Step-by-step guide to connect this repo to Appwrite Cloud. Most schema and function code is already written; you mainly create a project, paste IDs/keys, and run a few commands.

**Time:** ~20–30 minutes first time (excluding SMS provider approval).

---

## Overview

| Step | Who | What |
|------|-----|------|
| 1 | You | Create Appwrite Cloud project |
| 2 | You | `appwrite login` (browser) |
| 3 | Script | Link project ID to repo |
| 4 | You | Create API key, paste into `.env.local` |
| 5 | Script | `appwrite push` — database, buckets, collections |
| 6 | Script | `appwrite deploy function` — 3 serverless functions |
| 7 | You | Set function env vars in console |
| 8 | You | Configure SMS (MSG91) for phone OTP |
| 9 | Optional | `npm run generate-audio` for Tina/Toto voice |

Run **`npm run appwrite:check`** anytime to see what's still missing.

---

## Step 1 — Create the Appwrite project

1. Go to [cloud.appwrite.io](https://cloud.appwrite.io) and sign up / log in.
2. **Create project** → name it `Aksharvan`.
3. Copy the **Project ID** from **Project Settings** (looks like `67abc123def456`).

**Stop here and paste the Project ID in chat** (or run the link script yourself):

```bash
npm run appwrite:link -- YOUR_PROJECT_ID_HERE
```

This updates `appwrite.json` and `.env.local` automatically.

---

## Step 2 — Log in with the CLI

```bash
npx appwrite login
```

A browser window opens — authorize the CLI. You only do this once per machine.

Verify:

```bash
npx appwrite account get
```

---

## Step 3 — Create an API key

In Appwrite Console → your project → **API Keys** → **Create API key**:

| Setting | Value |
|---------|--------|
| Name | `aksharvan-server` |
| Expiration | Never (or 1 year) |
| Scopes | `databases.read`, `databases.write`, `collections.read`, `collections.write`, `documents.read`, `documents.write`, `buckets.read`, `buckets.write`, `files.read`, `files.write`, `functions.read`, `functions.write`, `execution.write` |

Copy the secret key. Open `.env.local` and uncomment/add:

```env
APPWRITE_API_KEY=your_secret_key_here
```

> Never commit this file. It's already in `.gitignore`.

---

## Step 4 — Push the schema

From the repo root:

```bash
npm run appwrite:push
```

This provisions (from `appwrite.json`):

- Database `aksharvan`
- Collections: `profiles`, `progress`, `recordings`
- Buckets: `images`, `animations`, `audio`, `recordings`
- Function definitions

Re-run after any `appwrite.json` change.

---

## Step 5 — Deploy function code

```bash
npm run appwrite:deploy
```

Uploads source for `set-pin`, `login-with-pin`, and `asr-recognize`.

| Function | Purpose | Who can call |
|----------|---------|--------------|
| `set-pin` | Hash & store 4-digit PIN on profile | Logged-in user |
| `login-with-pin` | Phone + PIN → session secret | Anyone |
| `asr-recognize` | Hindi speech → closed-vocab match | Logged-in user |

---

## Step 6 — Function environment variables

Console → **Functions** → select each function → **Settings** → **Variables**:

| Variable | Functions | Value |
|----------|-----------|-------|
| `APPWRITE_API_KEY` | all three | Same server API key from Step 3 |
| `SARVAM_API_KEY` | `asr-recognize` only | From [sarvam.ai](https://sarvam.ai) (optional — mock ASR without it) |

Also set on the function runtime (not just in `.env.local`):

- `APPWRITE_FUNCTION_API_ENDPOINT` = `https://cloud.appwrite.io/v1` (usually auto-injected)
- `APPWRITE_PROJECT_ID` = your project ID (usually auto-injected)

---

## Step 7 — Phone OTP (SMS)

Console → **Auth** → **Settings**:

1. Enable **Phone** authentication.
2. **SMS provider** → MSG91 (recommended for India):
   - MSG91 API key
   - Sender ID
   - DLT template ID (required for India)

Without SMS, OTP login won't send texts. PIN login still works once a profile exists.

**Dev shortcut:** With `NEXT_PUBLIC_APPWRITE_PROJECT_ID` unset or `your_project_id`, the app runs in mock mode (any 6-digit OTP, PIN `1234`).

---

## Step 8 — Verify everything

```bash
npm run appwrite:check    # all green?
npm run dev               # http://localhost:3000
```

Test flow:

1. `/login` → phone OTP or PIN
2. Complete signup (age slider)
3. Navigate map → level → exercises

---

## Step 9 — Voice audio (optional, recommended)

Once Appwrite is live and `APPWRITE_API_KEY` is in `.env.local`:

```bash
# Add SARVAM_API_KEY to .env.local first
npm run generate-audio -- --dry-run   # validate manifest
npm run generate-audio                # upload ~72 clips to audio bucket
```

Requires a Sarvam API key. One-time generation; clips are served from the public `audio` bucket.

---

## Quick reference — npm scripts

| Command | Action |
|---------|--------|
| `npm run appwrite:check` | Pre-flight checklist |
| `npm run appwrite:link -- <id>` | Sync project ID to config files |
| `npm run appwrite:push` | Push schema to cloud |
| `npm run appwrite:deploy` | Deploy all 3 functions |
| `npm run generate-audio` | TTS pipeline → audio bucket |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Project not found` | Run `npm run appwrite:link -- <id>` and `appwrite login` |
| `Unauthorized` on functions | Add `APPWRITE_API_KEY` to function variables in console |
| `appwrite push` fails on collections | Delete conflicting resources in console or match IDs in `appwrite.json` |
| App still in mock mode | Restart `npm run dev` after setting real `NEXT_PUBLIC_APPWRITE_PROJECT_ID` |
| No voice audio | Run `generate-audio`; frontend wiring for SceneEngine is separate (see voice plan) |

---

## What gets created in Appwrite

```
Project: Aksharvan
├── Database: aksharvan
│   ├── profiles      (doc id = userId)
│   ├── progress      (doc id = userId_level-1)
│   └── recordings    (consent-gated ASR uploads)
├── Buckets
│   ├── images        (public read)
│   ├── animations    (public read)
│   ├── audio         (public read — narration clips)
│   └── recordings    (private, encrypted)
└── Functions
    ├── set-pin
    ├── login-with-pin
    └── asr-recognize
```

Frontend reads only `NEXT_PUBLIC_APPWRITE_ENDPOINT` and `NEXT_PUBLIC_APPWRITE_PROJECT_ID` at build time. Everything else stays server-side.
