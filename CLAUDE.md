# ClearPath

Student-loan repayment and refinancing modeller. Work on branch `migration/next-express-mongo`; never push, merge or deploy without being asked.

## Architecture (keep it)
- `frontend/`: Next.js (App Router), React, TypeScript, Tailwind. Talks to the API over `NEXT_PUBLIC_API_URL` with cookies (`withCredentials`). Read `frontend/AGENTS.md` before touching Next.js code.
- `backend/`: separate Express + TypeScript API, MongoDB via Mongoose. Serverless entry is `backend/api/index.ts` (Vercel); `backend/src/server.ts` is the app. Do not move APIs into Next.js routes.
- `frontend-legacy/` and `backend/app/` (Python) are legacy references; do not extend them.

## Rules
- **Financial engine** (`backend/src/services/finance/*`): never change calculations. Tests in `backend/tests` guard parity.
- **Currency**: display metadata only. Each loan stores its own `currency` (legacy loans = USD); a user preference never converts or relabels loans. No conversion exists, so repayment/refinancing reject mixed-currency loans (422) and the UI blocks them. Shared pure helpers: `frontend/src/lib/currency.ts` (also unit-tested from the backend).
- **Auth/security**: HTTP-only cookies, session versioning, per-user ownership on every loan/scenario query (`{ _id, userId }`), role checks from the DB not the JWT. Do not weaken them.
- **Database**: `MONGODB_URI` is required; there is no localhost fallback. DB failure returns 503 (`/api/health` stays up). Connection is cached for serverless.
- **Production URLs**: `FRONTEND_URL` and `GOOGLE_CALLBACK_URL` must be https and not localhost in production (`backend/src/config/urls.ts`).
- **Secrets**: `.env`, `*.env` and `client_secret_*.json` are git-ignored. Never print, log, commit or paste secret values. Only `.env.example` files hold placeholders.
- **UI**: warm ivory canvas, forest green / marigold / coral accents, Bricolage Grotesque headings. Reuse `cp-*` classes in `globals.css`. Keep WCAG 2.2 AA (labels, focus, contrast, 24px targets). Font is fetched from Google at build.
- Smallest diff; fix confirmed defects only; no new dependencies without need (`ponytail skill.md`).

## Commands
- Backend: `cd backend && npm test` (Jest, runs in band) and `npm run build`.
- Frontend: `cd frontend && npx tsc --noEmit && npx eslint src && NEXT_PUBLIC_API_URL=<url> npm run build` (the build fails without the URL by design).
- Real-database checks must use a disposable database name and drop it afterwards, never `clearpath`.
