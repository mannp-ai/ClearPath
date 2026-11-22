# Authentication and Authorization Report

## Implementation present

- Registration creates an unverified user, sends a verification message, and does not issue a session.
- Email verification and password-reset tokens are persisted as hashed, single-use token records.
- Login checks password hash, verification, and account status.
- Access is held in an HTTP-only, SameSite=Lax cookie; refresh tokens are opaque, stored hashed, rotated, and revocable. Access JWT lifetime is 15 minutes; refresh lifetime is 30 days.
- Logout revokes refresh state and clears cookies. Password reset increments session version and revokes refresh sessions.
- Auth middleware checks the current user, status, role, and session version from MongoDB. User loan/scenario operations apply owner-scoped filters.
- Admin access and SUPER_ADMIN-only role changes are enforced in backend routes. Initial SUPER_ADMIN assignment is an out-of-band bootstrap action.
- Verification/reset email delivery requires configured SMTP; sensitive auth secrets must be configured, not defaulted.

## Tests and limitations

The current 18-test Jest suite includes mocked-model HTTP tests for registration/verification, login cookies, refresh rotation/logout, reset invalidation, unauthenticated access, loan/scenario ownership filters, and ADMIN/SUPER_ADMIN restrictions.

These are route-contract tests, not real MongoDB integration tests. No MongoDB or SMTP service was available, so persistence, token TTL indexes, delivery, full browser flows, and real multi-user access have not been verified. A browser request to the API failed because `localhost:4000` was not listening.

## Status

Implementation and mocked route coverage are present; production authentication readiness is **not established**. See [browser test report](./CLEARPATH_BROWSER_TEST_REPORT.md) and [release checklist](./CLEARPATH_RELEASE_READINESS.md).
