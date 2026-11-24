# ClearPath

ClearPath is a student-loan planning application for managing loan portfolios, comparing accelerated repayment strategies, and estimating hypothetical refinancing offers. It is an educational calculator, not financial advice or a lender quote.

## Current architecture

- `frontend/`: Next.js App Router, React, TypeScript, and Recharts.
- `backend/`: Express, TypeScript, MongoDB/Mongoose, cookie-based authentication, and financial APIs.
- `backend/tests/`: Jest route/financial tests, including a Python-to-TypeScript parity test.
- `backend/app/` and `backend/tests/`: retained Python/FastAPI reference implementation and its original test suite. Do not remove it until migration parity and integration requirements are met.
- `frontend-legacy/`: preserved original Vite app; it is not the current Next.js frontend.

## Local development

Requirements: Node.js/npm, Python with `backend/requirements.txt`, and a MongoDB database (Atlas, or a local MongoDB for development).

1. Configure the backend:

   ```powershell
   Copy-Item backend\.env.example backend\.env
   ```

   Set `MONGODB_URI` (Atlas `mongodb+srv://` string), `MONGODB_DATABASE`, a random `JWT_ACCESS_SECRET` of at least 32 characters, `CORS_ORIGINS`, and `FRONTEND_URL`. Email verification and password reset also require valid `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM` settings.

2. Start the API:

   ```powershell
   npm --prefix backend install
   npm --prefix backend run dev
   ```

   The API defaults to `http://localhost:4000`; its health endpoint is `/api/health`.

3. Start the frontend in another terminal:

   ```powershell
   npm --prefix frontend install
   npm --prefix frontend run dev
   ```

   The frontend defaults to `http://localhost:3000`. Set `NEXT_PUBLIC_API_URL` if the API is hosted elsewhere.

## Validation commands

```powershell
python -m pytest -p no:cacheprovider -q
npm --prefix backend test -- --runInBand
npm --prefix backend run build
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix backend audit
npm --prefix frontend audit
```

The parity test invokes Python, so the Python dependencies must be installed before running backend Jest.

## Migration and release status

The Next.js and Express builds, frontend lint, Python suite, and current backend Jest suite pass. The parity test matches the original Python engine on its fixed dataset. However:

- No SQL database/schema is present here, so no SQL-to-MongoDB migration has been implemented or run.
- MongoDB Atlas persistence and two-user ownership isolation were verified against a disposable database. SMTP email delivery and Google OAuth remain unverified.
- Browser route smoke checks render forms, but the API at port 4000 is unavailable, preventing authenticated end-to-end tests.
- Backend dependency audit currently reports two high-severity direct dependency findings (`nodemailer`, `zod`); frontend audit reports none.

**Production cutover verdict: NOT READY FOR PRODUCTION CUTOVER.** See the [release checklist](./CLEARPATH_RELEASE_READINESS.md), [database migration report](./CLEARPATH_DATABASE_MIGRATION_REPORT.md), and [test report](./CLEARPATH_TEST_REPORT.md) for evidence and blockers.

## Vercel deployment configuration

Deploy `backend/` and `frontend/` as two Vercel projects (backend entry: `backend/api/index.ts`).

Backend (required): `NODE_ENV=production`, `MONGODB_URI` and `MONGODB_DATABASE` (requests get HTTP 503 if missing/unreachable; Atlas Network Access must allow Vercel), `JWT_ACCESS_SECRET` (>=32 chars), `CORS_ORIGINS` (exact frontend origin(s); empty = all cross-origin requests rejected), `FRONTEND_URL`, `GOOGLE_CALLBACK_URL` (the deployed backend URL; Google login only), `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, and `SMTP_*`/`EMAIL_FROM` (or Gmail OAuth2 vars).
Cookies: production cookies are `Secure`. Use sibling subdomains (e.g. `app.example.com` + `api.example.com`) with `COOKIE_DOMAIN=.example.com`; the Next.js middleware reads the session cookie on the frontend host. If the two apps are on unrelated domains, set `COOKIE_SAMESITE=none`, but the frontend route guard will not see the cookies.
**Recommended without a custom domain (Vercel frontend + Render backend):** let the frontend proxy `/api/*` to the backend so the browser only ever talks to the Vercel domain and cookies are first-party. Set on Vercel: `BACKEND_URL=https://<your-backend>.onrender.com` and `NEXT_PUBLIC_API_URL=https://<your-site>.vercel.app` (the frontend's own URL). Set on Render: `CORS_ORIGINS` and `FRONTEND_URL` to the same Vercel URL, `GOOGLE_CALLBACK_URL=https://<your-site>.vercel.app/api/v1/auth/google/callback` (also add it in Google Cloud Console), `TRUST_PROXY_HOPS=2`, leave `COOKIE_DOMAIN` and `COOKIE_SAMESITE` unset. A cold-starting free Render instance can make the first request slow.
Frontend (required): `NEXT_PUBLIC_API_URL` (backend URL; the build fails without it), `NEXT_PUBLIC_GOOGLE_CLIENT_ID` if used.
