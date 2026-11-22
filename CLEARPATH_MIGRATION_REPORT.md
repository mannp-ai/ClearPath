# ClearPath Migration Report

## Scope and current state

Work continues on the existing workspace branch `migration/next-express-mongo`; no branch switch, commit, push, deployment, or production-data operation was performed. The frontend is a Next.js App Router application, and the target API is Express/TypeScript with MongoDB models. The Python/FastAPI implementation and original Vite frontend remain preserved.

## Verified progress

- Financial calculations are ported to TypeScript. An automated parity test compares full schedules, repayment summaries, strategy allocation, and two refinance fee treatments against the original Python implementation for one fixed dataset; it passes.
- Express routes and MongoDB models exist for authentication, user loans, scenarios, repayment, refinancing, and administration.
- Authentication routes include registration, verification, login, logout, refresh, reset request/confirmation, and current-session lookup. Email delivery depends on external SMTP configuration.
- Route tests cover authentication contracts, owner filters on loan/scenario operations, and admin role restrictions using mocked Mongoose models.
- Frontend registration, sign-in, loan, repayment, refinancing, import, and admin routes exist. Browser smoke inspection confirmed account forms render; API-dependent behavior could not be exercised.
- Frontend lint/build, backend build/Jest, and the Python suite pass (details in [test report](./CLEARPATH_TEST_REPORT.md)).

## Pending / blocked

- **SQL-to-MongoDB migration:** blocked; no SQL database file/schema or SQL source application was found in the workspace. Do not infer a schema or run production migration. See [database migration report](./CLEARPATH_DATABASE_MIGRATION_REPORT.md).
- **Real MongoDB integration:** not verified; no MongoDB service was available.
- **Full authentication and authorization journey:** route-level tests are mocked; SMTP/MongoDB-backed account lifecycle is not verified.
- **User ownership:** query-filter contracts are covered by tests, but cross-user reads/writes against a real database have not been tested.
- **Browser E2E:** blocked by unavailable API/MongoDB. No complete registration-to-data-flow browser test has passed.
- **Release security:** backend `npm audit` reports high-severity findings in `nodemailer` and `zod`. Frontend audit reports zero findings. Major-version dependency upgrades need compatibility testing.
- **Cutover:** retain the Python implementation and original source data until real database, browser, security, and regression gates pass.

## Decision

**NOT READY FOR PRODUCTION CUTOVER.** No production data was migrated or changed.
