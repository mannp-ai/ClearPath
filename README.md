# ClearPath

ClearPath is a student-loan planning application for managing loan portfolios, comparing accelerated repayment strategies, and estimating hypothetical refinancing offers. It is an educational calculator, not financial advice or a lender quote.

## Current architecture

- `frontend/`: Next.js App Router, React, TypeScript, and Recharts.
- `backend/`: Express, TypeScript, MongoDB/Mongoose, cookie-based authentication, and financial APIs.
- `backend/tests/`: Jest route/financial tests, including a Python-to-TypeScript parity test.
- `backend/app/` and `backend/tests/`: retained Python/FastAPI reference implementation and its original test suite. Do not remove it until migration parity and integration requirements are met.
- `frontend-legacy/`: preserved original Vite app; it is not the current Next.js frontend.

## Local development

Requirements: Node.js/npm, Python with `backend/requirements.txt`, and a reachable MongoDB instance.

1. Configure the backend:

   ```powershell
   Copy-Item backend\.env.example backend\.env
   ```

   Set `MONGODB_URI`, a random `JWT_ACCESS_SECRET` of at least 32 characters, `CORS_ORIGINS`, and `FRONTEND_URL`. Email verification and password reset also require valid `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM` settings.

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
- MongoDB and SMTP are unavailable in the verified environment; real persistence, email delivery, and end-to-end auth/data flows remain unverified.
- Browser route smoke checks render forms, but the API at port 4000 is unavailable, preventing authenticated end-to-end tests.
- Backend dependency audit currently reports two high-severity direct dependency findings (`nodemailer`, `zod`); frontend audit reports none.

**Production cutover verdict: NOT READY FOR PRODUCTION CUTOVER.** See the [release checklist](./CLEARPATH_RELEASE_READINESS.md), [database migration report](./CLEARPATH_DATABASE_MIGRATION_REPORT.md), and [test report](./CLEARPATH_TEST_REPORT.md) for evidence and blockers.
