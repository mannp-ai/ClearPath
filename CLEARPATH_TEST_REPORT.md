# ClearPath Test Report

Validation executed in the current workspace:

| Check | Result | Evidence / limitation |
|---|---|---|
| Frontend ESLint | PASS | `npm --prefix frontend run lint`; no lint output/errors |
| Frontend production build | PASS | `npm --prefix frontend run build`; Next.js generated all configured routes |
| Backend TypeScript build | PASS | `npm --prefix backend run build` |
| Backend Jest | PASS | 6 suites, 18 tests; `npm --prefix backend test -- --runInBand` |
| Python reference suite | PASS | 33 passed; `python -m pytest -p no:cacheprovider -q` |
| Financial parity | PASS, narrow dataset | Included in Jest; exact monthly schedules and summaries match for one fixed three-loan input, $200 extra payment, fixed start date, and upfront/financed refinance offers |
| Frontend dependency audit | PASS | 0 vulnerabilities in full npm audit |
| Backend dependency audit | FAIL | 2 high-severity direct dependency findings: `nodemailer` and `zod`; fixes are major upgrades per npm audit |
| Backend lint | NOT CONFIGURED | No backend lint script is defined |
| Real API/MongoDB integration | BLOCKED | MongoDB was unavailable; backend route tests mock Mongoose models |
| Browser E2E | BLOCKED | Production UI routes/forms render, but requests to `http://localhost:4000` fail with connection refused |
| SMTP delivery | NOT TESTED | No usable SMTP service/configuration available |

The route tests assert auth, role, and ownership query contracts; they are not proof of actual database persistence or full multi-user behavior. The browser check was not a completed user journey. See the [browser test report](./CLEARPATH_BROWSER_TEST_REPORT.md) and [release checklist](./CLEARPATH_RELEASE_READINESS.md).
