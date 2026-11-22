# ClearPath Release Readiness Checklist

Verdict: **NOT READY FOR PRODUCTION CUTOVER**

| Gate | Result | Evidence / remaining work |
|---|---|---|
| Frontend production build | PASS | `npm --prefix frontend run build` |
| Backend production build | PASS | `npm --prefix backend run build` |
| Frontend lint | PASS | `npm --prefix frontend run lint`; no reported lint issues |
| Backend lint | NOT CONFIGURED | Add/run backend lint before release |
| Unit/regression tests | PASS | Backend Jest 18/18; Python pytest 33/33 |
| Financial parity | PASS, limited | Exact match for one fixed dataset; expand differential fixtures |
| API/auth/authorization tests | PARTIAL | Mocked route tests pass; real Mongo integration pending |
| Browser E2E | BLOCKED | API at localhost:4000 unavailable; full user journey not executed |
| MongoDB persistence/indexes | BLOCKED | No MongoDB server available |
| SMTP verification/reset delivery | BLOCKED | No SMTP service/credentials verified |
| SQL migration | BLOCKED | No SQL source/schema; no migration run |
| Frontend dependency audit | PASS | Full audit: 0 findings |
| Backend dependency audit | FAIL | 2 high direct findings (`nodemailer`, `zod`); audit fix requires major versions and compatibility testing |
| Environment configuration | PARTIAL | `.env.example` exists; production values/SMTP/CORS not verified |
| Deployment and rollback | NOT VERIFIED | No deployment performed; define and rehearse operational runbook |
| Python backend retention | REQUIRED | Keep until parity/integration gates pass |
| Production data changes | NONE | No production migration or deployment performed |

## Cutover conditions

Resolve dependency findings with tested upgrades, run browser/API integration against disposable MongoDB/SMTP, expand financial parity coverage, verify migration source/mapping and rollback (if a SQL source is supplied), audit production configuration, and rehearse deployment/restore procedures. Obtain explicit approval before any production data operation or deployment.
