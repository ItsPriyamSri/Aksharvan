# Aksharvan Frontend Build Status

> **Loop state file.** Claude Code updates this every iteration. The loop stops only when every epic is `DONE` and the Completion Oracle in `.claude/FRONTEND-LOOP.md` §9 passes.

**Last updated:** (not started)  
**Current epic:** E1  
**Iteration:** 0  
**Blockers:** none  
**Appwrite mode:** `auto` (real SDK calls when configured; fallbacks when not)

---

## Epic tracker (E1–E11 from `docs/01-FRONTEND-PLAN.md` §11)

| Epic | Name | Status | Evidence |
|------|------|--------|----------|
| E1 | Project shell + PWA + Appwrite service layer | `TODO` | |
| E2 | Auth & profile (OTP + PIN tabs, dual-path) | `TODO` | |
| E3 | Menu + map (placeholders + hotspots) | `TODO` | |
| E4 | Cutscenes (world video + level zoom intro) | `TODO` | |
| E5 | Exercise engine core (voice-only E1–E5) | `TODO` | |
| E6 | Match-build (tap in order) | `TODO` | |
| E7 | Memory game (tap pairs) | `TODO` | |
| E8 | Voice pipeline (ASR dual-path + narration) | `TODO` | |
| E9 | Restoration + celebration + map completion | `TODO` | |
| E10 | Progress sync (dual-layer + exact resume) | `TODO` | |
| E11 | Polish, PWA, integration handoff | `TODO` | |

Status values: `TODO` | `IN_PROGRESS` | `DONE` | `BLOCKED`

---

## Backend integration checklist (real paths must exist — not mock-only)

| Integration | Service file | Real Appwrite path | Fallback | Wired? |
|-------------|--------------|-------------------|----------|--------|
| SDK client | `lib/appwrite/client.ts` | `Client` singleton | — | |
| Auth OTP | `lib/appwrite/services/auth.ts` | `createPhoneToken` → `createSession` | mock OTP any 6 digits | |
| Auth PIN | `lib/appwrite/services/auth.ts` | `FUNCTION_LOGIN_WITH_PIN` → `createSession` | mock PIN `1234` | |
| Profiles | `lib/appwrite/services/profile.ts` | `createDocument` / `getDocument` / `updateDocument` | localStorage mirror | |
| Progress | `lib/appwrite/services/progress.ts` | `${userId}_level-1` upsert | localStorage mirror + sync | |
| Set PIN | `lib/appwrite/services/pin.ts` | `FUNCTION_SET_PIN` | localStorage flag | |
| ASR | `lib/appwrite/services/asr.ts` | `FUNCTION_ASR_RECOGNIZE` | Web Speech API | |
| Audio playback | `lib/appwrite/services/audio.ts` | Howler + `storage.getFileView` | `speechSynthesis` + subtitle | |
| Static assets | `lib/appwrite/services/assets.ts` | `storage.getFileView/Preview` | `public/assets/*` | |
| Storage URLs | constants + assets service | `BUCKET_*` from `constants.ts` | local paths | |

---

## User flow acceptance (from product decisions)

| Step | Route / component | Status |
|------|-------------------|--------|
| Signup/login (OTP + PIN tabs, age) | `/login` | |
| Main menu (Play + Settings) | `/menu` | |
| World intro portrait video (skippable) | `/intro` | |
| Aksharvan map (Jadooi Jungle clickable) | `/map` | |
| Level entry (grey forest zoom + puppets + narration) | `/level/level-1` | |
| 7 exercises × 6 sub-levels | `/level/level-1/play` | |
| Restoration crossfade after each sub-level | play screen | |
| Celebration → map (Jadooi Jungle completed) | `/level/level-1/complete` → `/map` | |
| Smart resume (intro / map / exact exercise) | AppProviders + progress | |
| Settings (age, logout, PIN) | `/settings` | |

---

## Verification log

```
(iteration 0 — not started)
```

---

## Escalation log

```
(none)
```
