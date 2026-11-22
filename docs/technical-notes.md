# Technical Architecture & Engineering Notes

## Architecture

```text
Browser
  └─ Next.js App Router (frontend/)
       └─ credentialed JSON requests
            └─ Express API (backend/, port 4000)
                 ├─ auth, admin, loans, scenarios, repayment, refinance routes
                 ├─ request validation and authorization middleware
                 └─ Mongoose models → MongoDB

Python/FastAPI backend/ and frontend-legacy/ are preserved migration references.
```

The Next.js client sends HTTP-only cookies to Express (`withCredentials`). The API is configured through `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000`). Express mounts versioned routes under `/api/v1`; the health endpoint is `/api/health`.

## Data and authorization boundaries

- Users own loans and repayment scenarios through `userId` references.
- Loan/scenario read, update, and delete queries are scoped by the authenticated user ID.
- Admin routes check current account role/status; role changes require `SUPER_ADMIN`.
- Access JWTs are short-lived and session-version checked. Opaque refresh tokens are stored hashed and rotated; cookie settings are HTTP-only and SameSite=Lax.
- Route tests verify these contracts with mocked models. Real MongoDB behavior and indexes have not yet been integration-tested.

## Financial engine and persistence

Repayment and refinancing are calculated in TypeScript with `decimal.js`. The Python implementation remains the reference until broad parity and end-to-end gates pass. Current parity evidence is one fixed dataset, compared over complete monthly schedules and refinance summaries; see the [financial regression report](../CLEARPATH_FINANCIAL_REGRESSION_REPORT.md).

MongoDB models exist for users, loans, scenarios, sessions/tokens. No SQL source schema or database is present in the workspace; no SQL migration has run. Browser-local portfolio import is a separate path and is not SQL migration.

## Runtime configuration

Configure MongoDB, a 32-character-or-longer `JWT_ACCESS_SECRET`, production CORS/frontend origins, and SMTP settings for verification/reset messages. Do not use production credentials or data for test runs. See [setup guide](../CLEARPATH_SETUP_GUIDE.md).

## Release controls

Keep the Python backend and original data until real MongoDB persistence, email, authorization, browser journeys, dependency review, and rollback have been verified. Current blockers are tracked in the [release checklist](../CLEARPATH_RELEASE_READINESS.md).
