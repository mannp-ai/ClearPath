# ClearPath — Final Technical Audit

> **Audit date:** 20 November 2026
> **Scope:** React/Vite frontend, FastAPI backend, repayment/refinance engines, configuration, documentation, and local runtime checks.
> **Method:** source review, API inspection, static security scan, dependency checks, automated tests, production build, direct API checks, and interactive browser smoke tests at desktop and mobile widths.

## 1. Executive summary

ClearPath is a local-first student-loan planning application. It provides loan entry, minimum-payment schedules, avalanche and snowball comparisons, an amortization schedule, and hypothetical refinancing analysis. The implemented product is materially aligned with the MVP PRD.

During this audit, the following justified fixes were implemented:

- Replaced binary floating-point math in the backend refinancing formula with `Decimal` arithmetic.
- Routed refinancing UI refreshes through the existing API service, retaining only the documented client fallback.
- Removed raw server exception text from public API responses.
- Removed the broad Vercel CORS regex; deployment now requires explicit `CORS_ORIGINS` configuration.
- Removed the global `localStorage.clear()` error-recovery behavior.
- Added production security headers for the documented Vercel deployment target.
- Added `.env.example`, corrected inaccurate client-parity documentation, and added validation-boundary tests.
- Rejected duplicate loan identifiers and sub-cent API inputs; corrected refinance cent rounding, tiny-balance payoff, and unavailable current-cost comparisons.
- Surfaced calculation/API failures rather than presenting invalid or stale refinance results, and corrected the storage disclosure.
- Added keyboard-operable schedule expansion and modal focus trapping/restoration; replaced an inaccurate decimal-precision claim with a cents-rounding disclosure.

**Release verdict: READY TO PRESENT WITH LIMITATIONS.**

The core financial flows, API, build, and test suite pass. Interactive browser smoke checks covered loan add/edit/delete, sample data, reload persistence, strategy schedules, schedule expansion, invalid refinance input, and federal-loan warnings; these are not a substitute for an automated E2E/accessibility suite. No production rate-limit/monitoring layer is configured, and the offline client fallback has not received formal parity testing against the decimal server engine.

## 2. Product architecture

| Layer | Implementation | Responsibility |
|---|---|---|
| Client | React 18, TypeScript, Vite, Tailwind, Recharts | Local loan data, UI, charts, local persistence, API fallback |
| API | FastAPI, Pydantic | Public calculation endpoints and schema validation |
| Financial engine | Python `Decimal` modules | Amortization, baseline, avalanche, snowball, refinance calculations |
| Storage | Browser `localStorage` only | Loans and extra-payment preference; no server persistence |
| Deployment target | Vercel frontend plus separately hosted FastAPI | Static UI and optional calculation API |

No database, user account, third-party lender, payment, analytics, or AI integration was found.

### API surface

All endpoints are public by design because they perform deterministic calculations and do not persist or retrieve user-specific resources.

| Endpoint | Method | Validation | Purpose |
|---|---|---|---|
| `/api/health` | GET | None | Service health/version |
| `/api/calculate/baseline` | POST | 1–50 Pydantic loans | Minimum-payment schedule |
| `/api/calculate/avalanche` | POST | Loans plus bounded non-negative extra payment | Avalanche schedule |
| `/api/calculate/snowball` | POST | Loans plus bounded non-negative extra payment | Snowball schedule |
| `/api/calculate/compare` | POST | Loans plus bounded non-negative extra payment | Baseline/avalanche/snowball comparison |
| `/api/calculate/refinance` | POST | Loans plus bounded fixed-rate refinance terms | Hypothetical refinance comparison |

The same routes are available beneath `/api/v1`; this is a compatibility alias rather than a separate implementation.

## 3. Financial logic audit

### Verified behavior

- Monthly nominal rate is annual percentage ÷ 100 ÷ 12.
- Interest is calculated on each opening balance and rounded to cents.
- Payment is capped at the period payoff amount.
- A payment that is less than or equal to opening-period interest is identified as non-amortizing; no finite baseline payoff date is returned.
- Avalanche sorting is rate descending, balance ascending, creation order ascending.
- Snowball sorting is balance ascending, rate descending, creation order ascending.
- Freed minimum-payment budget and extra payment are cascaded within the same period.
- Zero-rate refinance uses principal ÷ term.
- Upfront and financed fee treatments are separately calculated.
- Federal-loan refinance caution is returned when a federal loan is present.

### Numerical evidence

| Check | Result |
|---|---|
| `$10,000`, 6%, `$200` minimum | Month one interest `$50.00`, principal `$150.00`, balance `$9,850.00`; payoff 58 months |
| `$10,000`, 6%, 60-month refinance | `$193.33` monthly payment |
| Live API comparison: `$10,000`, 6%, `$200` minimum, `$100` extra | Baseline: 58 months; accelerated plans: 37 months |
| Zero rate, small balances, excess payment, tie breaks, insufficient payments, fee treatment | Covered by automated tests |

### Financial limitation

The browser fallback engine uses JavaScript number arithmetic with cent rounding. The server is the `Decimal` calculation authority, and the refinance screen refreshes through it when available. The shared UI now claims only that currency amounts are rounded to cents. Formal cross-engine parity fixtures remain a follow-up before claiming mathematically identical offline results.

## 4. Frontend and UX audit

### Strengths

- ClearPath branding, editorial hierarchy, responsive planning/dashboard layouts, useful empty states, and local-first workflow are implemented.
- Loan management supports add, edit, delete confirmation, clear data, sample data, and local persistence.
- Refinancing UI validates rate, term, and fees and displays federal-loan warnings.
- Reduced-motion styling is present.

### Remaining UX/accessibility limitations

| ID | Severity | Finding | Recommendation |
|---|---|---|---|
| UX-FE-2026-001 | Medium | There is no automated browser E2E or visual regression suite. Interactive smoke checks passed in this audit, but do not cover all user journeys or browser combinations. | Add repeatable Playwright journeys and visual/accessibility checks before public release. |
| PERF-FE-2026-001 | Low | The charts vendor chunk is 531 kB raw / 152 kB gzip. | Lazy-load strategy/chart UI after loan entry or split chart code by route. |

Keyboard-operated month expansion and modal focus trapping/restoration were implemented and exercised during the interactive smoke pass. A broader automated accessibility review remains outstanding.

## 5. Backend, cybersecurity, and privacy audit

### Resolved findings

| ID | Original severity | Resolution |
|---|---|---|
| FIN-BE-2026-001 | High | Backend refinance formula and break-even rounding changed from binary floats to `Decimal`. |
| SEC-BE-2026-001 | Medium | Public API errors now return a generic message; diagnostic stack data stays server-side. |
| SEC-BE-2026-002 | Medium | Removed permissive `*.vercel.app` CORS regex. Production origins must be provided via `CORS_ORIGINS`. |
| SEC-FE-2026-001 | Medium | Error recovery no longer deletes all storage for the shared origin. |
| SEC-FE-2026-002 | Medium | Refinance screen now calls the API service rather than permanently bypassing it. |
| SEC-OPS-2026-001 | Low | Added Vercel response-header configuration and a non-secret environment template. |
| FIN-BE-2026-002 | Medium | Duplicate loan IDs are rejected; currency/rate inputs and extra payments enforce cent precision. |
| FIN-BE-2026-003 | Medium | Positive refinance balances have a one-cent minimum payment and totals use cent-rounded monthly interest with a final payoff adjustment. |
| FIN-BE-2026-004 | Medium | Current refinance cost and savings are unavailable when current minimum payments do not amortize or exceed the supported timeline. |
| A11Y-FE-2026-001 | Medium | Amortization schedule expansion now uses a labelled keyboard-operable button with expanded state. |
| A11Y-FE-2026-002 | Low | Loan modal now traps keyboard focus, supports Escape, and restores focus on close. |

### Current security posture

- No hardcoded credentials, secret tokens, dangerous execution APIs, database access, file upload, SSRF path, command execution, or unsafe HTML rendering were found in application code.
- React escaping is used; no `dangerouslySetInnerHTML` or equivalent sink was found.
- Pydantic enforces bounds and types at the API boundary.
- `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY` were confirmed on the local API health response.
- An untrusted Vercel-origin CORS preflight received no `Access-Control-Allow-Origin` header after the CORS fix.
- Browser data is limited to user-entered loan labels, balances, rates, and payments. The UI discloses that data is saved in browser storage and sent to a configured calculation API; the application does not persist loan records server-side. Browser storage is not encrypted at rest.

### Remaining security/operations limitations

| ID | Severity | Finding | Recommendation |
|---|---|---|---|
| SEC-BE-2026-003 | Medium | Public calculation API has no application-level rate limiting or reverse-proxy request-size limit. | Enforce rate limits and body-size limits at the production gateway/hosting layer. |
| SEC-FE-2026-003 | Low | Browser localStorage is not encrypted and is accessible to scripts running on the same origin. | Keep the app free of third-party scripts; do not store credentials or identifiers. |
| SEC-OPS-2026-002 | Low | No CI/CD, dependency gate, error monitoring, or structured request correlation configuration was found. | Add CI for build/tests/audits and privacy-reviewed operational telemetry before public launch. |
| SEC-DEP-2026-001 | Informational | `npm audit --omit=dev` found zero production vulnerabilities. `pip check` passed. `pip-audit` was unavailable, so Python CVE scanning was not completed. | Add `pip-audit` to CI or run it in the release environment. |

## 6. Authentication decision

**Decision: Keep ClearPath open; do not add authentication.**

The MVP is a public, local-first calculator. The backend does not retain user loans, there are no private resources, privileged operations, accounts, lender integrations, or protected credentials. Authentication would add account/security obligations without protecting a server-side asset. This conforms to the PRD.

## 7. Test evidence

| Test | Result | Method | Limitation |
|---|---|---|---|
| Backend unit/integration suite | PASS — 33/33 | `python -m pytest -p no:cacheprovider -v` | No coverage threshold or mutation test configured |
| API validation/regression checks | PASS — duplicate IDs and sub-cent inputs rejected with HTTP 422; non-amortizing refinance behavior covered by regression tests | FastAPI `TestClient` and Pydantic tests | Does not replace complete API fuzzing |
| Frontend type check | PASS | `npm run build` runs `tsc` before Vite | No frontend unit/component test suite exists |
| Production frontend build | PASS | `npm run build` | 531 kB raw charts chunk; no Lighthouse measurement |
| Production frontend dependency audit | PASS — 0 vulnerabilities | `npm audit --omit=dev` | Python CVE audit unavailable |
| Python dependency integrity | PASS | `python -m pip check` | Does not identify CVEs |
| API security headers/CORS smoke check | PASS | FastAPI `TestClient` | Not a full external penetration test |
| Interactive browser smoke test | PASS | Add/edit/delete loan, sample data, reload persistence, strategy schedule expansion, refinance validation/federal warning, keyboard focus loop; no console/page errors observed; 360 px mobile layout had no horizontal overflow | Manual smoke only; not a full E2E, screen-reader, or cross-browser test |

## 8. Deployment readiness

The frontend production build completes successfully. Vercel headers are supplied in `frontend/vercel.json`. The backend can start cleanly via Uvicorn. For a real deployment:

1. Set `VITE_API_URL` to the HTTPS API origin.
2. Set backend `CORS_ORIGINS` to the exact frontend HTTPS origin(s).
3. Terminate TLS at the hosting provider or reverse proxy.
4. Add edge rate limiting, request-size limits, and monitoring.
5. Run browser E2E/accessibility checks and Python CVE scanning.

## 9. Final release recommendation

**READY TO PRESENT WITH LIMITATIONS.**

ClearPath is credible for an internship supervisor demonstration: it builds, validates inputs, calculates the repayment strategies, performs cent-rounded `Decimal` server refinancing calculations, and clearly communicates that results are hypothetical estimates. Before a public consumer launch, complete the remaining operational controls, automated browser E2E/accessibility checks, client/server parity testing, and Python CVE audit.
