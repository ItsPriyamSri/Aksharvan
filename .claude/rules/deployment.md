---
paths:
  - "Dockerfile"
  - "docker/**/*"
  - "nginx.conf"
  - ".github/workflows/**/*"
  - "docker-compose*.yml"
---

# Deployment Rules (Dockerfile, nginx.conf, CI workflows)

## Dockerfile — structure is fixed, do not deviate

The build model is: Next.js static export → nginx serves static files.
There is no Node runtime in production. Do not change this model.

```
Stage 1 (builder):  node:20.18-alpine
  - npm ci  (not npm install)
  - Accept NEXT_PUBLIC_ vars as ARGs, expose as ENVs before build
  - Run: npm run build
  - Output: out/

Stage 2 (server):   nginx:1.27-alpine
  - COPY --from=builder /app/out /usr/share/nginx/html
  - COPY nginx.conf /etc/nginx/conf.d/default.conf
  - EXPOSE 80
```

Rules:
- NEVER add a third stage or a Node runtime stage.
- NEVER switch to `output: 'standalone'` — the whole Dockerfile changes with it.
- Pin exact versions: `node:20.18-alpine`, `nginx:1.27-alpine`. No `latest`, no `lts`.
- Use `npm ci` — reproducible, exact, honours `package-lock.json`.
- Do not run `npm install` or any package manager inside the server stage.
- `.dockerignore` must contain: `node_modules`, `.next`, `out`, `.git`, `.env*`, `*.md`.

## Environment variable discipline in Docker context

- `NEXT_PUBLIC_APPWRITE_ENDPOINT` and `NEXT_PUBLIC_APPWRITE_PROJECT_ID` are the only
  vars baked into the image. They are public — no security risk.
- Pass them as `--build-arg` in CI. Do NOT hardcode them in the Dockerfile.
- No other secrets belong in the Docker image, ever.
- If a runtime config value is needed (non-secret, may differ between envs), serve it
  as `public/config.json` fetched client-side, not as a build-time env var.

## nginx.conf — required directives

The nginx config must include all of the following. Do not remove any:

```nginx
location / {
    root /usr/share/nginx/html;
    try_files $uri $uri.html $uri/index.html /index.html;
}
```
- `try_files` with the `/index.html` fallback is mandatory for the SPA to handle
  deep links on direct load (without it, refreshing any non-root URL returns 404).

```nginx
# Service worker must never be cached
location = /sw.js {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    expires 0;
}
```
- Without this, users get stuck on stale PWA builds and updates never reach them.

```nginx
gzip on;
gzip_types text/css application/javascript application/json image/svg+xml;
```
- Gzip on text assets matters for low-bandwidth users (the primary target audience).

Correct MIME types must be set for: `.webp`, `.avif`, `.opus`, `.lottie` (JSON).

## CI / GitHub Actions

- The build job must: install → lint → typecheck → build → Docker build.
  All four checks must pass before the Docker image is pushed.
- `NEXT_PUBLIC_` vars come from GitHub Actions secrets, passed as `--build-arg`.
- Appwrite Functions are deployed in a separate job using the Appwrite CLI with
  `APPWRITE_API_KEY` from GitHub Actions secrets.
- The CI workflow must produce a single tagged, immutable image per commit SHA.
  Never overwrite an existing image tag other than `latest`.
- Do not run `appwrite push` automatically in CI without a manual approval gate —
  schema changes are destructive and must be intentional.

## AWS / production notes

- The Docker image runs behind an Application Load Balancer or CloudFront distribution
  that terminates TLS. The container itself only serves HTTP on port 80 — that is correct.
- HTTPS is mandatory for the PWA service worker and `getUserMedia` (microphone).
  The app will silently fail without it.
- Register the deployed domain in Appwrite project settings under "Web Platforms" before
  first deployment — Appwrite rejects requests from unregistered origins.
- The Appwrite Cloud project does not need to be in the same AWS region.
  Appwrite Functions and the frontend container are independent deployments.
