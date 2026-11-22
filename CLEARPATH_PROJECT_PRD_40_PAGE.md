**ClearPath Product Requirements Document**  
**Student Loan Repayment & Hypothetical Refinancing Planner**  
  
|  |  |  
| - | - |  
| **Field** |  **Value** |  
| Product |  ClearPath |  
| Product category |  Student-loan decision-support calculator |  
| Document |  Product Requirements Document (PRD) |  
| Version |  3.0 |  
| Prepared |  21 November 2026 |  
| Status |  Draft for supervisor and stakeholder approval |  
| Repository branch inspected |  `migration/next-express-mongo` |  
| Mandatory architecture |  Next.js/React/TypeScript/Tailwind frontend; separate Express/Node.js/TypeScript backend; MongoDB; Git/GitHub |  
| Intended market |  United States (inherited assumption; confirmation required) |  
| Production status |  **Not ready for cutover** |  
  
   
**Version history**  
  
|  |  |  |  
| - | - | - |  
| **Version** |  **Date** |  **Change** |  
| 1.0 |  20 Nov 2026 |  Original MVP brief: local-first repayment and refinance calculator |  
| 2.0 |  21 Nov 2026 |  Expanded 40-page product and migration outline |  
| 3.0 |  21 Nov 2026 |  Inspected actual source, routes, models, tests, configuration and Git state; added detailed requirements, screen/API inventory, evidence, status distinctions and observed gaps |  
  
   
**Status vocabulary**  
**Proposed, Approved, In Progress, Implemented, Verified, Deferred, Blocked.** “Implemented” means code is present; it does not mean end-to-end behavior passed. “Verified” is reserved for acceptance evidence that covers the requirement’s stated scope. No formal stakeholder sign-off is recorded yet.  
**02 / Executive summary**  
ClearPath helps users organize student loans, compare modeled repayment paths, inspect amortization, test extra payments, and evaluate a manually entered hypothetical refinance offer. It is an educational decision-support calculator—not a lender, servicer, broker, underwriter, or financial adviser.  
The supervisor-mandated target stack is present in the repository: Next.js frontend, separate Express/TypeScript API, and Mongoose/MongoDB models. The Python/FastAPI engine and Vite frontend remain preserved as migration references. The current Next.js pages cover home, loans, repayment/scenarios, refinancing, account actions, local-data import, and admin user management.  
**Verified today:** frontend lint and production build pass; backend build and 18 Jest tests pass; the Python reference suite passes 33 tests. One three-loan fixture matches Python and TypeScript schedules/refinance results. Frontend audit reports zero vulnerabilities; backend audit reports two high-severity direct dependency findings.  
**Not verified:** real MongoDB persistence/indexes, SMTP delivery, complete browser-to-API journeys, real multi-user ownership, full parity, production configuration, SQL migration, deployment and rollback. Browser API calls failed because the local API was unavailable. The project is therefore **NOT READY FOR PRODUCTION CUTOVER**.  
**03 / Product overview and vision**  
**Vision**  
Give borrowers a clearer, more transparent way to understand their student-loan repayment options before they make decisions outside the product.  
**Product definition**  
ClearPath accepts user-supplied loan attributes and produces estimates under documented assumptions. It models baseline minimum payments, avalanche, snowball, a recurring additional payment, monthly schedules and hypothetical refinancing. Signed-in users can save/revisit scenario results and their account-owned loans. Account operations are intended to be optional to basic planning, but this guest-versus-account behavior is not yet resolved in the Next.js implementation.  
**Value proposition**  
“See how your loan inputs behave under clear repayment assumptions, compare strategies side by side, and examine the full modeled cost of a refinance scenario.”  
**Product boundaries**  
Outputs are projections, not payoff quotes. The tool does not verify user data, live lender offers, eligibility, program qualification, or servicer treatment. It must not state that an offer is available or that any repayment approach is universally best.  
**04 / Problem statement**  
Borrowers may have multiple student loans with different balances, rates, minimum payments, and federal/private status. Those details are often viewed separately, making it difficult to understand total debt and how the obligations interact.  
Manual estimation is error-prone. Monthly interest changes the amount of principal reduced; minimum payments may not amortize a loan; extra funds need an allocation rule; and a cleared loan can free payment capacity for another balance. Users need more than a single payment estimate: they need comparable outcomes and a schedule that explains how the estimate was produced.  
Refinancing creates another decision trap. A lower monthly payment can reflect a longer term, while fees may be paid upfront or added to principal. Comparing only the payment can conceal the modeled lifetime cost. If federal loans are included, refinancing into a private loan may permanently remove federal protections.  
ClearPath addresses the information and calculation problem by collecting user-entered inputs, applying consistent rules, displaying schedules and trade-offs, and stating limitations. It does not resolve lender-specific, legal, tax, or personal suitability questions. The product problem and usability assumptions still require borrower research; no market validation is claimed.  
**05 / Objectives and measurable success criteria**  
Targets with **TBD** require product-owner approval after baseline usability measurement; this PRD does not invent adoption or performance targets.  
  
|  |  |  |  
| - | - | - |  
| **Objective** |  **Success measure / acceptance target** |  **Current evidence** |  
| Make portfolio entry usable |  Research participants can enter, correct and understand a multi-loan portfolio; target completion/error rates TBD |  Current Next.js form exists; browser workflow not E2E-tested |  
| Make calculations trustworthy |  All approved deterministic fixtures match expected cents and schedule rules |  18 backend tests pass; one full Python/TS parity fixture passes |  
| Explain repayment trade-offs |  Users can distinguish minimum-only, avalanche and snowball assumptions in comprehension testing |  UI summaries exist; comprehension testing absent |  
| Show refinance total cost |  Payment, term, fees, fee treatment and total cost are presented together |  Refinance form/results implemented; API/database E2E blocked |  
| Protect account data |  No cross-user read/write in real MongoDB integration/E2E |  Mocked route tests only |  
| Be releasable safely |  All release gates on page 38 pass with recorded evidence |  Several gates blocked; no cutover |  
  
   
Instrument only approved, privacy-reviewed aggregate metrics. Do not equate registrations, page views, or a successful build with product success.  
**06 / Scope and non-goals**  
**Approved product scope in this brief**  
- Multiple user-entered loans and portfolio totals.  
- Minimum-payment baseline; avalanche and snowball comparison.  
- Additional monthly payment simulation and rollover.  
- Payoff duration, total interest/repayment, and amortization schedules.  
- User-entered hypothetical fixed-rate refinance terms, term and fees.  
- Save and revisit repayment scenarios.  
- Account roles USER, ADMIN and SUPER_ADMIN, with server-side authorization.  
- Separate Express service; Next.js must not replace the backend API.  
**Non-goals**  
No loan origination, payment submission, servicing, lender marketplace, live rate feed, lender recommendation, eligibility/underwriting, credit bureau connection, guaranteed savings, individualized financial/legal/tax advice, or production data migration without explicit approval.  
**Proposed / unresolved scope**  
Guest planning in the new Next.js application, cross-device sync behavior, scenario editing, account deletion, admin audit-log viewer, admin settings, analytics, file export, and exact data retention are not approved merely because a model or legacy feature exists. Resolve these with stakeholders before delivery commitment.  
**07 / Target market, users and personas**  
**Market assumption:** United States borrowers and USD presentation. Confirm jurisdiction, currency, rate conventions, privacy notice and terminology before launch.  
  
|  |  |  |  
| - | - | - |  
| **Persona hypothesis** |  **Need** |  **Risk / design response** |  
| Multi-loan organizer |  Consolidate multiple balances, rates and minimums |  Keep inputs editable; show source is user-supplied |  
| Extra-payment planner |  Understand effect of recurring extra funds |  Apply same budget assumptions and explain rollover |  
| Refinance evaluator |  Compare rate, term, fees and total cost |  Do not elevate payment reduction above total cost |  
| Returning account user |  Revisit saved loan and scenario snapshots |  Verify identity, expiry and record ownership |  
| Support/admin operator |  Perform limited account operations |  Least privilege; no default loan-content access |  
  
   
These are hypotheses, not research-validated personas. No age, income, credit profile, employment, repayment-plan eligibility, or demographic characteristics should be inferred. Research should include users with different loan counts, federal/private mixes, financial confidence, accessibility needs and privacy expectations.  
**08 / User roles and permissions**  
  
|  |  |  |  |  
| - | - | - | - |  
| **Role** |  **Intended permissions** |  **Explicit restrictions** |  **Repository status** |  
| Guest |  Use planning/calculation if guest mode is approved; manage only local data |  No account-owned API access |  Legacy app is local-first; current Next.js loans/calculations call authenticated APIs; guest target unresolved |  
| USER |  Manage own loans/scenarios; calculate and save/revisit |  Cannot list another user’s records or administer accounts |  Implemented routes; ownership filters covered by mocked tests only |  
| ADMIN |  List up to the API’s current first 100 users; activate/deactivate USER accounts |  Cannot change roles; cannot manage other admin accounts without SUPER_ADMIN |  Implemented API/UI; not real DB/E2E-verified |  
| SUPER_ADMIN |  ADMIN capabilities plus assign roles |  Must not bypass authentication, audit, or safety controls |  Role API implemented; out-of-band bootstrap; real integration pending |  
  
   
The role is loaded from current MongoDB account state by auth middleware; privilege decisions must never rely solely on browser state. `AuditLog` and `AppSetting` schemas exist but no admin audit/settings routes or verified write path were found. Role/status changes increment session version. The admin user list has a 100-record limit and no pagination UI/API contract.  
**09 / User journeys and workflows**  
**Current authenticated target journey**  
1. Visit landing page; choose account creation or sign-in.  
2. Register; verify email; sign in.  
3. Add, edit or delete loans in `/loans`.  
4. Open `/repayment`; enter extra monthly payment and request comparison.  
5. Review baseline/avalanche/snowball summaries and selected schedule.  
6. Name and save a scenario; reopen saved results or delete it.  
7. Open `/refinancing`; enter rate, term, fees and fee treatment.  
8. Optionally import compatible legacy browser data to the signed-in account.  
9. Admin role can open user list and manage permitted account status/role actions.  
**Important gaps**  
The Next.js app does not currently provide a completed unauthenticated loan-entry/calculation journey: loans and calculations depend on protected API routes. The browser has not passed this full flow because the Express API/MongoDB/SMTP test environment was unavailable. Refinance results are not saved as scenarios. A dedicated dashboard URL is not present; `/repayment` carries the comparison/saved-scenario experience.  
**10 / Information architecture and screen inventory**  
  
|  |  |  |  |  
| - | - | - | - |  
| **Route / surface** |  **Present behavior in source** |  **Implementation status** |  **Verification** |  
| `/` |  Landing page and links to loans/account |  Implemented |  Production render observed; no product-flow E2E |  
| `/register` |  Account registration form |  Implemented |  UI rendered; API/email not verified |  
| `/login` |  Login form and recovery link |  Implemented |  UI rendered; API not verified |  
| `/verify-email` |  Consumes query token and calls API |  Implemented |  Mocked route test; live email flow not verified |  
| `/reset-password` |  Request or token-confirm form |  Implemented |  Mocked route test; email delivery not verified |  
| `/loans` |  Create/list/edit/delete persisted loans |  Implemented |  Unit/mocked filters; browser DB flow blocked |  
| `/repayment` |  Compare, save/list/open/delete scenarios, schedule table |  Implemented |  Route contracts/tests; real persistence/E2E not verified |  
| `/refinancing` |  Fixed-rate refinance input and result display |  Implemented |  Page rendered empty state; backend unavailable |  
| `/import` |  Import two supported localStorage key formats |  Implemented |  Source inspected; user journey not E2E-tested |  
| `/admin` |  List accounts and permitted status/role actions |  Implemented |  Mocked role tests; live admin workflow unverified |  
| Not-found / global layout |  Next not-found and shared navigation |  Framework/source present |  Build-generated routes; accessibility not audited |  
  
   
No dedicated `/dashboard`, scenario detail, profile, account deletion, admin audit-log, admin settings, or data export screen was found. Guest screen inventory remains a product decision.  
**11 / Functional requirements and status conventions**  
The requirement baseline in this PRD is **Approved for specification by the supervisor brief; formal stakeholder sign-off is pending**. Priorities: MUST / SHOULD / MAY. Implementation status is separate from product approval. Evidence reports whether acceptance has actually been verified.  
**Requirement-record fields**  
Every `ID — title` entry defines a product requirement and testable acceptance criterion. Its bracketed value is priority; any stated dependency is a prerequisite (if none is applicable, none is identified); **Implementation** uses the status vocabulary on page 1; and **Evidence/Verification** states what passed or is missing. Remaining work is explicitly stated where known; an acceptance criterion not covered by the cited evidence remains open. Verification evidence must not be inferred from code presence or build success.  
**Cross-functional requirements**  
**CORE-001 — Truthful estimates** `[MUST]`  
   
 Acceptance: every calculated amount/date is labeled estimated; hypothetical refinance is not presented as a verified offer. Dependencies: financial model/content review. Implementation: **In Progress**. Evidence: labels and warnings present in current UI/API; full user comprehension review absent. Remaining: review all surfaces and disclosures.  
**CORE-002 — Consistent comparisons** `[MUST]`  
   
 Acceptance: all repayment strategies use the same loan snapshot, start date, rate convention and modeled budget. Dependencies: CALC-001–006. Implementation: **Implemented**. Evidence: engine API and one parity fixture; broad/browser verification missing. Remaining: expanded fixture matrix and full browser/API verification.  
**CORE-003 — Explicit failure states** `[MUST]`  
   
 Acceptance: invalid input, network failure, non-amortization and simulation cap never appear as a valid complete result. Dependencies: validation and UI state design. Implementation: **In Progress**. Evidence: some server warnings and frontend alerts exist; every route/state not tested. Remaining: test every error and recovery state in API/browser.  
**12 / Authentication and account management requirements**  
**AUTH-001 — Registration** `[MUST]`  
   
 Acceptance: normalize/validate email; accept password 8–128 chars; hash with bcrypt; create USER unverified; do not issue a session until verified; handle duplicate email safely. Dependencies: MongoDB, SMTP, rate limiter. Implementation: **Implemented**. Evidence: mocked registration test passes; real Mongo/SMTP delivery blocked. Remaining: integration and abuse tests.  
**AUTH-002 — Login** `[MUST]`  
   
 Acceptance: valid active verified account receives secure HTTP-only access/refresh cookies; invalid, unverified or deactivated account cannot authenticate; error must not reveal password validity. Dependencies: AUTH-001, user model. Implementation: **Implemented**. Evidence: mocked cookie/password tests; live flow blocked. Remaining: verify against MongoDB/SMTP and browser.  
**AUTH-003 — Email verification** `[SHOULD, policy approval pending]`  
   
 Acceptance: one-time hashed token, expiry, consumption and verified state; expired/reused token fails. Current token lifetime: 24 hours. Dependencies: AUTH-001, MongoDB, SMTP and policy approval. Implementation: **Implemented**. Evidence: mocked route test; TTL/index behavior and SMTP unverified. Remaining: approve requirement and run live integration tests.  
**AUTH-004 — Logout and refresh** `[MUST]`  
   
 Acceptance: refresh tokens are opaque, stored hashed, rotate, expire in 30 days, revoke on logout; access JWT expires in 15 minutes; failed refresh clears session. Dependencies: AUTH-002, RefreshToken persistence. Implementation: **Implemented**. Evidence: mocked rotation/logout tests; real TTL/replay verification pending. Remaining: real Mongo expiry/replay/browser tests.  
**AUTH-005 — Password recovery** `[MUST]`  
   
 Acceptance: generic request response; one-time expiring reset token; new password hashed; sessions invalidated. Current reset token lifetime: one hour. Dependencies: AUTH-001, SMTP, token persistence. Implementation: **Implemented**. Evidence: mocked reset test; email/database integration blocked. Remaining: verify email and session invalidation end to end.  
**AUTH-006 — Session/role freshness** `[MUST]`  
   
 Acceptance: protected route checks current active user and session version; role/status change invalidates prior sessions. Dependencies: AUTH-002, user persistence. Implementation: **Implemented**. Evidence: mocked stale-token test; Mongo integration pending. Remaining: test deactivation/role change against real DB.  
**AUTH-007 — Account deletion/profile lifecycle** `[SHOULD]`  
   
 Acceptance: approved retention/cascade policy and user-facing workflow before release. Dependencies: PRIV-002/004 and product approval. Implementation: **Proposed**. Evidence: no self-service route/UI found. Remaining: decide policy; implement only if approved.  
**13 / Loan management requirements**  
**LOAN-001 — Create loan** `[MUST]`  
   
 Acceptance: authenticated user creates a loan with name, type, positive balance, rate 0–100%, minimum payment; persisted record’s owner is server-derived, not client-supplied. Dependencies: AUTH-002, MongoDB. Implementation: **Implemented**. Evidence: route/schema present; create path not covered by a live DB test. Remaining: real DB and browser create verification.  
**LOAN-002 — List owned loans** `[MUST]`  
   
 Acceptance: response contains only records matching authenticated user ID; stable creation order. Dependencies: AUTH-002, LOAN-001. Implementation: **Implemented**. Evidence: mocked `Loan.find({userId})` test passes; real cross-user DB test missing. Remaining: integration test with two Mongo users.  
**LOAN-003 — Edit and delete own loan** `[MUST]`  
   
 Acceptance: owner-scoped update/delete; foreign or invalid ID returns non-disclosing not-found; UI reflects persisted result only on success. Dependencies: AUTH-002, LOAN-001. Implementation: **Implemented**. Evidence: mocked selector assertions; browser/db E2E blocked. Remaining: real multi-user DB/API and browser verification.  
**LOAN-004 — Validation** `[MUST]`  
   
 Acceptance: reject blank/invalid name, nonpositive/out-of-bound amounts, invalid loan type/rate; return 422 with safe field details. Dependencies: approved field bounds and currency precision policy. Implementation: **Implemented**. Evidence: Zod/schema source; route-level comprehensive malformed-input coverage not established. Remaining: test malformed and boundary values.  
**LOAN-005 — Guest planning** `[SHOULD, product approval required]`  
   
 Acceptance: unauthenticated user can enter loans, calculate, and clear locally without server persistence, if approved. Dependencies: decision on local data lifecycle and guest/account transition. Implementation: **In Progress** (legacy Vite is local-first; Next.js route calls protected APIs). Evidence: legacy source only; target guest path absent and not browser-verified. Remaining: approve scope and implement/test the target flow or defer explicitly.  
**LOAN-006 — Legacy localStorage import** `[SHOULD]`  
   
 Acceptance: validate `clearpath_mvp_loans` or `loanoptima_mvp_loans`; confirm import; report partial/duplicate handling; never clear original storage. Dependencies: authenticated account and LOAN-001. Implementation: **Implemented**. Evidence: source confirms keys/validation and no deletion; real import transaction/UX unverified. Remaining: test duplicate, malformed and partial-failure behavior with MongoDB.  
**14 / Repayment calculation requirements**  
**CALC-001 — Minimum-payment baseline** `[MUST]`  
   
 Acceptance: apply each active loan’s minimum, cap at payoff, compute schedule and totals; no extra funds in baseline. Dependencies: LOAN-001 and approved financial rules. Implementation: **Implemented**. Evidence: Python/TS tests and parity fixture; full API-to-browser flow not tested. Remaining: test through authenticated UI/API and Mongo-backed data.  
**CALC-002 — Scenario comparison** `[MUST]`  
   
 Acceptance: return baseline, avalanche, snowball and portfolio summary using same input and date basis. Dependencies: CALC-001, STRAT-001, STRAT-002. Implementation: **Implemented**. Evidence: Jest parity/regression; API route requires auth and full browser flow blocked. Remaining: full browser/API verification.  
**CALC-003 — Schedule detail** `[MUST]`  
   
 Acceptance: month values include opening balance, interest, payment, principal, closing balance, active count and per-loan details; totals reconcile. Dependencies: approved financial rounding rules. Implementation: **Implemented** in both engines. Evidence: parity compares schedule fields for one fixture; broader edge coverage pending. Remaining: edge fixtures and UI verification.  
**CALC-004 — Extra amount** `[MUST]`  
   
 Acceptance: nonnegative extra recurring amount within approved bounds; strategy totals use sum of initial minimums plus extra; re-calculate on current inputs. Dependencies: STRAT-001, STRAT-002. Implementation: **Implemented** in engine/form. Evidence: fixture tests; UI E2E blocked. Remaining: verify user interaction and request validation end to end.  
**CALC-005 — Payoff metadata** `[MUST]`  
   
 Acceptance: show months/date and totals only for completed amortizing result; mark unavailable otherwise. Dependencies: CALC-001, CALC-003. Implementation: **Implemented** in engine response. Evidence: regression tests; display coverage not exhaustive. Remaining: test all frontend unavailable-result states.  
**CALC-006 — Request validation** `[MUST]`  
   
 Acceptance: limit repayment compare to 1–50 loans, bounded values and known categories; reject malformed/duplicate identifiers under approved API contract. Dependencies: approved precision policy and finance schema. Implementation: **In Progress**. Evidence: Zod validates count/ranges/type, but duplicate-ID and two-decimal precision enforcement is not evident in Express route; Python does validate unique IDs/decimal places. Remaining: align both APIs and test rejection cases.  
**15 / Avalanche and snowball strategy rules**  
**STRAT-001 — Avalanche ordering** `[MUST]`  
   
 Acceptance: after minimums, direct extra pool by descending APR, then ascending current balance, then stable creation order. Dependencies: CALC-004, approved rate/balance precision. Implementation: **Implemented**. Evidence: source in both engines; existing Jest/Python tests and fixed parity fixture pass; adversarial tie fixtures/parity incomplete. Remaining: add explicit tie and randomized parity fixtures.  
**STRAT-002 — Snowball ordering** `[MUST]`  
   
 Acceptance: after minimums, direct extra pool by ascending current balance, then descending APR, then stable creation order. Dependencies: CALC-004, approved rate/balance precision. Implementation: **Implemented**. Evidence: source and tests; parity fixture passes; full randomized comparisons pending. Remaining: add explicit tie and randomized parity fixtures.  
**STRAT-003 — Same-period and future rollover** `[MUST]`  
   
 Acceptance: cap at payoff amount; any unused amount and freed minimum budget enters allocation pool and cascades to next active priority loan; no double-spend. Dependencies: STRAT-001, STRAT-002. Implementation: **Implemented** in both engines. Evidence: test/fixture exercises rollover; broaden coverage to multiple simultaneous payoffs. Remaining: test simultaneous payoffs and budget reconciliation.  
**STRAT-004 — Neutral explanation** `[MUST]`  
   
 Acceptance: describe avalanche as prioritizing higher rate and snowball as prioritizing small balance; never promise universal superiority. Dependencies: approved product/content review. Implementation: **In Progress**. Evidence: current route summaries show labels; all copy not audited. Remaining: review all routes and disclosures.  
**16 / Refinancing simulator requirements**  
**REFI-001 — Offer input and calculation** `[MUST]`  
   
 Acceptance: accept proposed annual rate 0–100%, 1–600 months, nonnegative bounded fees, upfront/financed treatment; return monthly payment, interest, total cost and cost differences where valid. Dependencies: LOAN-001, approved financial precision. Implementation: **Implemented**. Evidence: unit tests and one parity fixture; live API/browser execution blocked. Remaining: align input limits and verify API/UI/database journey.  
**REFI-002 — Fee treatment** `[MUST]`  
   
 Acceptance: upfront fee is added to total cost, not refinance principal; financed fee is added to principal and accrues modeled interest. Dependencies: REFI-001, approved rounding policy. Implementation: **Implemented**. Evidence: both fixtures compared; broader edge cases pending. Remaining: expand refinance fixtures and integration tests.  
**REFI-003 — Federal caution** `[MUST]`  
   
 Acceptance: if federal loans are present, display warning about potential permanent loss of federal protections; do not imply personal eligibility. Dependencies: user-provided loan classification and content/legal review. Implementation: **Implemented** in service/UI contract. Evidence: code and parity fixture; current browser integration not verified. Remaining: verify display in browser and approve final copy.  
**REFI-004 — Honest current comparison** `[MUST]`  
   
 Acceptance: if current minimum-payment baseline is not amortizing or reaches 600-month cap, current lifetime total and difference are unavailable with explanation. Dependencies: CALC-001, CALC-005. Implementation: **Implemented** in both engines. Evidence: Python/TypeScript logic and tests; inspect API/UI rendering in E2E. Remaining: verify unavailable-result copy end to end.  
**REFI-005 — Input consistency** `[MUST]`  
   
 Acceptance: compare a named portfolio snapshot and report all inputs/assumptions; do not accept unrelated foreign data as an owner’s persisted loan record where account linkage is intended. Dependencies: OQ-004 and AUTH-002. Implementation: **In Progress**. Evidence: route authenticates but accepts submitted loan objects; owner-ID linkage is not checked. Remaining: decide snapshot contract and verify ownership semantics.  
**17 / Saved scenario management**  
**SCEN-001 — Create saved scenario** `[MUST]`  
   
 Acceptance: save name, strategy, extra amount, loan input snapshot and result snapshot under authenticated owner; validate bounds and strategy. Dependencies: AUTH-002, LOAN-001, CALC-002. Implementation: **Implemented**. Evidence: API/UI helpers present; mocked model coverage; real Mongo persistence not verified. Remaining: real DB save/reopen test.  
**SCEN-002 — List and open** `[MUST]`  
   
 Acceptance: list only caller-owned scenarios; open displays saved result and captured inputs/strategy. Dependencies: SCEN-001, AUTH-002. Implementation: **Implemented**. Evidence: page fetches scenarios and restores result/extra/strategy; owner query mocked; browser flow blocked. Remaining: real Mongo and browser verification.  
**SCEN-003 — Delete** `[MUST]`  
   
 Acceptance: caller may delete own scenario only after UI confirmation; foreign ID is not disclosed. Dependencies: AUTH-002, SCEN-001. Implementation: **Implemented**. Evidence: route and UI present; mocked ownership tests; real DB/E2E not run. Remaining: real owner/foreign-user deletion tests.  
**SCEN-004 — Update/rename** `[SHOULD]`  
   
 Acceptance: user can edit scenario metadata/snapshot/results only if product approves; record version/conflict behavior. Dependencies: SCEN-005 and product approval. Implementation: **In Progress** (PUT API exists, no frontend update helper/workflow found). Verification: no update test observed. Remaining: agree behavior, implement UI and test.  
**SCEN-005 — Snapshot semantics** `[MUST]`  
   
 Acceptance: saved result remains labeled as the calculation for the stored snapshot, even after loans change; version the model/assumptions for future recalculation. Dependencies: SCEN-001 and CALC-002. Implementation: **In Progress**. Evidence: snapshot/result fields exist but Mongoose uses `Mixed`; schema/version semantics undefined. Remaining: define typed schema/version fields and verify backward-compatible reads.  
**18 / Admin dashboard and administrative functionality**  
**ADM-001 — Admin user dashboard** `[MUST]`  
   
 Acceptance: authorized admins list accounts with permitted fields and pagination; regular USER is denied. Current API returns first 100 and total count. Dependencies: AUTH-006, approved admin fields. Implementation: **Implemented**. Evidence: mocked role test; no pagination; real DB/browser not verified. Remaining: add pagination or approve cap; test with real DB.  
**ADM-002 — Account status** `[MUST]`  
   
 Acceptance: ADMIN/SUPER_ADMIN may activate/deactivate USER; ADMIN cannot manage administrator accounts; self-deactivation is prevented; sessions invalidated. Dependencies: AUTH-006, ADM-001. Implementation: **Implemented**. Evidence: route source; limited mocked suite; comprehensive status edge tests absent. Remaining: integration/concurrency tests and audit logging.  
**ADM-003 — Role changes** `[MUST]`  
   
 Acceptance: only SUPER_ADMIN changes role; only active, verified users become admin; protect last active SUPER_ADMIN. Dependencies: AUTH-006, ADM-001. Implementation: **Implemented**. Evidence: mocked escalation and role-change tests pass; concurrency/real DB not tested. Remaining: real DB/concurrency tests and audit writes.  
**ADM-004 — Admin audit log** `[MUST]`  
   
 Acceptance: immutable, privacy-minimized record for status/role changes with actor/target/time/outcome; query access restricted. Dependencies: ADM-002, ADM-003, approved retention policy. Implementation: **In Progress** (AuditLog model only; no write path or viewer found). Evidence: schema inspection; no tests or route. Remaining: implement writes/access policy and verify audit records.  
**ADM-005 — Administrative settings** `[MAY]`  
   
 Acceptance: any setting has owner, version, validation and audit controls. Dependencies: explicit settings scope and ADM-004. Implementation: **Proposed** (AppSetting schema exists; no API/UI behavior found). Evidence: schema only. Remaining: approve/defer; no feature behavior verified.  
**ADM-006 — Analytics administration** `[MAY]`  
   
 Acceptance: privacy-approved aggregate events only, with retention/deletion. Dependencies: PRIV-003, PRIV-004. Implementation: **Proposed** (AnalyticsEvent schema only; no usage path found). Evidence: schema only. Remaining: approve/defer; define consent and retention first.  
**19 / Financial calculation methodology and assumptions**  
**Observed engine behavior (Python and TypeScript)**  
- Loan `interest_rate` is expressed as an APR percentage; monthly rate is `rate / 100 / 12`.  
- Monthly period; interest is calculated on opening balance and rounded to cents using ROUND_HALF_UP.  
- Payment is applied at period end; principal is payment minus rounded interest; closing balance is floored at zero.  
- Payment is capped at opening balance plus monthly interest.  
- Baseline uses each loan’s minimum only and does not roll freed minimums into other loans.  
- Accelerated total budget is initial sum of all minimums plus extra; active minimums apply first, then unspent budget is allocated by strategy priority.  
- Simulation is capped at 600 months (50 years).  
- Zero APR refinance payment uses principal divided by term; otherwise standard fixed-rate amortization formula.  
- Refinance final payment is adjusted to clear balance within term; upfront fee is added outside loan principal, financed fee is added to principal.  
**Precision and storage**  
Python uses `Decimal`; TypeScript uses `decimal.js` with precision 50 and ROUND_HALF_UP for interest/payment values. Mongo loan fields and incoming Express JSON use JavaScript `number`, not a Decimal128 contract. Express Zod validation does not visibly enforce 2 decimal places, unlike Python Pydantic decimal-place constraints. This is a parity/contract gap requiring decision and tests.  
**20 / Edge cases and calculation limitations**  
**Observed policy**  
- Baseline marks a loan non-amortizing when its minimum payment is **not strictly greater** than rounded initial monthly interest; baseline returns no schedule if any loan fails this test.  
- Accelerated schedules still simulate using the extra pool; the code does not perform the same initial sufficiency rejection before simulation.  
- Incomplete schedules at 600 months are marked non-amortizing and have no lifetime totals.  
- Weighted average rate is balance-weighted and rounded to 2 decimal places.  
- Date labels differ in implementation: Python uses `dateutil.relativedelta`; TypeScript uses `Date.setMonth`, which can differ for month-end dates/time zones. Jan-1 parity fixture does not test this.  
- Python schema enforces unique loan IDs; Express repayment route’s displayed Zod schema has no duplicate-ID refinement.  
- TypeScript loan/refinance monetary values are JS numbers; values with more than cents may be accepted by some routes.  
**Requirement**  
Before calling the engines equivalent, define and approve precision/date behavior, add edge fixtures (month-end/leap year, sub-cent inputs, duplicate IDs, non-amortization, small balance, simultaneous payoff), and compare all material outputs. Do not “correct” differences without a reviewed decision and recorded expected outputs.  
**21 / Technical architecture**  
```  
Browser  
   └── Next.js App Router (React + TypeScript + Tailwind)  
         └── credentialed HTTP/JSON requests  
               └── separate Express.js / TypeScript service  
                     ├── auth/admin/loans/scenarios/calculation routes  
                     ├── Zod input validation + middleware  
                     ├── decimal.js finance service  
                     └── Mongoose → MongoDB  
   
 Preserved references: Python/FastAPI + Decimal engine; legacy React/Vite app.  
   
```  
**Architecture requirements**  
**ARCH-001** `[MUST]`: retain separate Express service; no migration of API into Next API routes. Acceptance: Next.js owns presentation only and all application APIs continue through the separately runnable Express service. Dependencies: none identified. Implementation: **Implemented**. Evidence: backend package and Express router; verified TypeScript build. Remaining: preserve separation through deployment.  
**ARCH-002** `[MUST]`: TypeScript contracts at frontend/API/finance boundaries. Acceptance: request/response and financial-domain contracts are explicit and validated at service boundaries. Dependencies: approved numeric precision and snapshot policy. Implementation: **In Progress**. Evidence: typed API client and finance types; backend request fields still use JS numbers and scenario result uses `Mixed`. Remaining: resolve finance numeric and scenario schema gaps.  
**ARCH-003** `[MUST]`: do not remove Python reference until parity and integration sign-off. Acceptance: Python reference remains available until domain/engineering owners approve parity and integration evidence. Dependencies: CALC-001–006, STRAT-001–003, REFI-001–004. Implementation: **Implemented** (retained). Evidence: source and tests present. Remaining: keep until release gates pass.  
No service mesh, extra database, ORM, queue, or framework replacement is justified by current evidence.  
**22 / Frontend requirements**  
**FE-001 — Mandatory stack** `[MUST]`: Next.js, React, TypeScript, Tailwind. Acceptance: production build compiles all routes; no Express responsibilities move into Next. Dependencies: ARCH-001. Implementation: **Verified** for build. Evidence: source confirms Next App Router and Tailwind import; production build passes. Remaining: repeat build in release CI.  
**FE-002 — Screens and API client** `[MUST]`: Acceptance: screens use a shared credentialed API client, typed request/response functions, bounded refresh retry and explicit errors. Dependencies: BE-001, AUTH-004. Implementation: **Implemented**. Evidence: `frontend/src/lib/api.ts`; build/lint pass; live API unavailable. Remaining: verify live API integration.  
**FE-003 — User states** `[MUST]`: Acceptance: every data screen has loading, empty, validation, error and success states; no stale-success display after failed calculation. Dependencies: FE-002. Implementation: **In Progress**. Evidence: some states exist; no comprehensive UI test. Remaining: test all screen state transitions.  
**FE-004 — Guest/account transition** `[MUST, decision pending]`: Acceptance: guest planning stays local and account import requires confirmation; no silent upload/deletion. Dependencies: OQ-002, LOAN-005/006. Implementation: **In Progress**. Evidence: local import route exists; current Next calculator screens call authenticated APIs and no guest calculation path found. Remaining: approve account/guest behavior and implement or defer.  
**FE-005 — Data visualization** `[SHOULD]`: Acceptance: if a balance chart is provided, it has a text/table equivalent. Dependencies: A11Y-003, approved chart scope. Implementation: **In Progress**. Evidence: Recharts is a dependency and used in legacy client; no Recharts import found in current `frontend/src`; current repayment route has summary cards/table, no chart. Remaining: approve chart scope and implement accessible visualization or defer.  
**FE-006 — Scenario controls** `[MUST]`: Acceptance: allow save, revisit and delete; update only if approved. Dependencies: SCEN-001–003. Implementation: **Implemented** for save/list/open/delete. Evidence: UI/API code and mocked tests; actual persisted flow not verified. Remaining: verify on real MongoDB/browser.  
**23 / Backend requirements**  
**BE-001 — Separate Express service** `[MUST]`: Node/Express/TypeScript service runs independently and mounts `/api/v1` routes. Acceptance: service starts independently and serves versioned routes. Dependencies: ARCH-001. Implementation: **Implemented**. Evidence: TypeScript build passes. Remaining: verify in deployment-like integration.  
**BE-002 — Validation** `[MUST]`: Acceptance: validate body, params, limits and identifiers at API boundary. Dependencies: CALC-006, LOAN-004. Implementation: **In Progress**. Evidence: Zod in routes; duplicate IDs/decimal-place/field-bound coverage is inconsistent. Remaining: standardize schemas and boundary tests.  
**BE-003 — Error behavior** `[MUST]`: Acceptance: async errors reach central handler; public response does not leak stacks/secrets; validation errors are distinguishable. Dependencies: BE-002. Implementation: **Implemented** in routes/handler. Evidence: partial route tests only. Remaining: test error contracts across routes.  
**BE-004 — Startup/configuration** `[MUST]`: Acceptance: fail fast on missing production secrets/origins/database; load documented local config. Dependencies: approved environment/deployment configuration. Implementation: **In Progress**. Evidence: `JWT_ACCESS_SECRET` length and production CORS checks; DB connects before listen. `dotenv` is a dependency but no `dotenv.config()`/preload was found, although setup says copy `.env`; local `.env` loading is unverified. Remaining: confirm and test local/production config loading.  
**BE-005 — Operational safety** `[MUST]`: Acceptance: request limits, rate limits, readiness, graceful shutdown, structured sanitized logs and monitoring. Dependencies: approved operational targets and deployment. Implementation: **In Progress**. Evidence: 1 MB JSON limit, Helmet, CORS and auth rate limit exist; health only reports static status; auth rate limit is in-memory; no complete metrics/readiness/shutdown evidence. Remaining: define targets and implement/test operational controls.  
**BE-006 — Backend lint** `[SHOULD]`: Acceptance: lint command runs on backend source. Dependencies: approved lint rules/tooling. Implementation: **Proposed**. Evidence: no backend lint script exists. Remaining: add and run the backend lint gate.  
**24 / MongoDB data model and relationships**  
  
|  |  |  |  
| - | - | - |  
| **Collection/model** |  **Observed fields and relationship** |  **Requirement / status** |  
| User |  unique normalized email, passwordHash, role, status, emailVerified, sessionVersion, profile, timestamps |  User schema implemented; real unique-index/persistence behavior unverified |  
| Loan |  `userId → User`, name/type, Number balance/rate/minimum, timestamps |  Owner-required; index by owner and creation date; integration unverified |  
| Scenario |  `userId → User`, name, strategy, extraPayment, Mixed snapshot/results, timestamps |  Owner-required; flexible Mixed fields lack strict versioned schema |  
| RefreshToken |  userId, unique tokenHash, expiry, revoked; TTL index |  Model implemented; TTL index execution/rotation in Mongo unverified |  
| EmailVerificationToken / PasswordResetToken |  userId, unique tokenHash, expiry, used; TTL index |  Model implemented; live expiry/index behavior unverified |  
| AuditLog |  actorId, action, target, Mixed metadata, IP, createdAt |  Schema only; no route write/view found |  
| AnalyticsEvent |  optional userId, type, Mixed metadata, createdAt |  Schema only; no event use found |  
| AppSetting |  key, Mixed value, version, changedBy, createdAt |  Schema only; no settings API/UI found |  
  
   
**Data requirements**  
**DATA-001** `[MUST]`: every loan/scenario read/update/delete includes authenticated owner selector. Acceptance: authenticated user operations query by both record ID and current user ID. Dependencies: AUTH-002, LOAN-001, SCEN-001. Implementation: **Implemented**. Evidence: selectors asserted in mocked Jest tests; no real multi-user MongoDB verification. Remaining: test with two real MongoDB users.  
**DATA-002** `[MUST]`: replace/validate `Mixed` scenario data with versioned contract and migration policy. Acceptance: persisted snapshot/result data is schema-validated and versioned, with a backward-compatible migration plan. Dependencies: SCEN-005, approved finance contract. Implementation: **Proposed**. Evidence: current Scenario model uses `Mixed`; no versioned schema/migration found. Remaining: design, implement and test the schema migration.  
**DATA-003** `[MUST]`: establish ownership cascade, deletion, retention, backup/restore and indexing policy. Acceptance: approved data lifecycle policy and successful index/backup/restore tests. Dependencies: PRIV-002/004 and operations decisions. Implementation: **Blocked**. Evidence: no approved policy or real DB rehearsal found. Remaining: obtain decisions, then implement and rehearse.  
**25 / API specifications and endpoint inventory**  
All target paths below are mounted under `/api/v1`; server also mounts unversioned `/api` aliases for these routers. The unversioned aliases are backward-compatibility behavior, not a separately governed version.  
  
|  |  |  |  |  
| - | - | - | - |  
| **Method / path** |  **Purpose** |  **Auth** |  **Implementation / verification** |  
| GET `/api/health` |  Static Node service health/version |  No |  Implemented; Jest health test; does not prove Mongo readiness |  
| POST `/auth/register`, `/verify-email`, `/login`, `/refresh`, `/logout` |  Account lifecycle |  Route-specific |  Implemented; mocked route tests |  
| POST `/auth/password-reset/request`, `/password-reset/confirm`; GET `/auth/me` |  Recovery/current user |  Request endpoints public; me protected |  Implemented; mocked tests; SMTP/Mongo not verified |  
| GET/POST `/loans`; PUT/DELETE `/loans/:id`; POST `/loans/import` |  Owner loan CRUD/import |  Yes |  Implemented; selectors mocked; no DB integration |  
| POST `/repayment/compare` |  Compare all strategies |  Yes |  Implemented; finance tests; real API flow blocked |  
| POST `/refinancing/calculate` |  Refinance estimate |  Yes |  Implemented; finance tests; real API flow blocked |  
| GET/POST `/scenarios`; GET/PUT/DELETE `/scenarios/:id` |  Scenario CRUD |  Yes |  Implemented; owner filters mocked; no DB integration |  
| GET `/admin/users`; PATCH `/admin/users/:id/status`, `/role` |  Admin user operations |  ADMIN/SUPER_ADMIN |  Implemented; mocked role tests; no live workflow |  
  
   
Legacy Python service exposes `/api/health` and `/api/calculate/baseline`, `/avalanche`, `/snowball`, `/compare`, `/refinance`. It remains a reference, not the mandated target backend.  
**26 / Authentication and authorization security**  
**Observed controls**  
- bcryptjs password hash with cost factor 12.  
- Access JWT HS256, 15-minute expiry, subject + session-version claim; middleware loads current user/role/status.  
- Opaque 32-byte refresh/verification/reset tokens; only SHA-256 token hashes stored; refresh lifetime 30 days, verification 24 hours, reset one hour.  
- HTTP-only, SameSite=Lax cookies; Secure in production.  
- Rate limiter: 10 requests/15 minutes on selected auth routes, in-memory default store.  
- Role middleware enforces ADMIN/SUPER_ADMIN; SUPER_ADMIN required for role changes.  
- Loan/scenario selectors include owner ID.  
**Required security work**  
**SEC-001** `[MUST]`: Acceptance: real database IDOR tests cover own/other-user read/write/delete and unauthenticated access. Dependencies: DATA-001, MongoDB test environment. Implementation: **In Progress**. Evidence: mocked assertions pass only. Remaining: execute the full test matrix against MongoDB.  
**SEC-002** `[MUST]`: Acceptance: test role escalation, inactive account, admin account and last-super-admin under real DB/concurrency. Dependencies: ADM-002/003, MongoDB test environment. Implementation: **In Progress**. Evidence: mocked partial coverage. Remaining: run real DB and concurrency tests.  
**SEC-003** `[MUST]`: Acceptance: define and verify CSRF protection for cookie-authenticated state-changing requests, including deployment CORS/SameSite behavior. Dependencies: approved deployment origin/cookie policy. Implementation: **Proposed**. Evidence: controls not established by current source evidence. Remaining: choose and test a CSRF mitigation.  
**SEC-004** `[MUST]`: Acceptance: implement a distributed rate-limit policy, abuse alerts, replay behavior and operational key rotation. Dependencies: BE-005, approved abuse policy. Implementation: **In Progress**. Evidence: in-memory limiter and rotation flow exist; production controls unverified. Remaining: implement/verify durable rate limits, alerts, replay defenses and key rotation.  
**SEC-005** `[MUST]`: Acceptance: implement admin audit trail writes, access controls and retention. Dependencies: ADM-004, approved retention policy. Implementation: **Proposed**. Evidence: model only; no write path or tests found. Remaining: implement and verify audit controls.  
**27 / Privacy and data lifecycle**  
**Data classes**  
Account email/profile and password hash; user-entered loan names, balances, rates and minimums; scenario inputs/results; opaque token hashes and session metadata; optional operational IP and future analytics.  
**Requirements**  
**PRIV-001** `[MUST]`: disclose guest browser storage versus account Mongo storage and the moment data is uploaded. Acceptance: before upload, UI identifies storage location and obtains explicit confirmation. Dependencies: OQ-002, LOAN-005/006. Implementation: **In Progress**. Evidence: import page says source browser data is left untouched, but guest-first Next behavior and complete notice are unresolved. Remaining: settle behavior and audit all upload points.  
**PRIV-002** `[MUST]`: define user access, correction, export, account deletion, backup retention and legal hold policy. Acceptance: publish and implement approved request workflows and retention rules. Dependencies: product/legal jurisdiction decision. Implementation: **Proposed**. Evidence: no self-service deletion/export route found. Remaining: approve policy and implement required workflows.  
**PRIV-003** `[MUST]`: minimize logs/analytics; never log passwords, cookies, raw tokens, or unnecessary detailed loan data. Acceptance: reviewed logging policy and tests ensure sensitive values are redacted. Dependencies: BE-005, approved analytics scope. Implementation: **In Progress**. Evidence: auth email errors are logged without token in message, but full logging policy/telemetry review is absent. Remaining: audit every log path and add redaction tests.  
**PRIV-004** `[MUST]`: define collection purpose, retention, processor/vendor, jurisdiction and privacy notice before production. Acceptance: owner/legal approval recorded for each required disclosure and retention policy. Dependencies: OQ-001, OQ-007. Implementation: **Blocked**. Evidence: review/approval not present. Remaining: complete owner/legal review.  
No analytics service or lender data integration is verified. AnalyticsEvent schema presence is not consent, product telemetry, or a privacy policy.  
**28 / UI/UX and design system requirements**  
Current frontend imports Tailwind CSS and uses utility classes, Geist font setup and basic CSS variables. No documented component design system or complete content/design token specification was found. Recharts is in the frontend package; current Next.js repayment page uses summary cards and a schedule table, while chart components exist in legacy Vite source.  
**UX-001** `[MUST]`: disclose model assumptions near results. Acceptance: result views show rate convention, payment timing, fees and limitations. Dependencies: financial model approval. Implementation: **In Progress**. Evidence: landing/refinance text exists, full surface audit pending. Remaining: review every result surface.  
**UX-002** `[MUST]`: show field-specific validation, units and supported ranges. Acceptance: invalid fields expose a specific error and unit/range guidance. Dependencies: BE-002, A11Y-002. Implementation: **In Progress**. Evidence: HTML and Zod limits exist, comprehensive accessible error mapping not verified. Remaining: verify all forms and accessible error associations.  
**UX-003** `[MUST]`: support loading, empty, saved, error and retry states. Acceptance: each applicable state is visible and recoverable without showing stale success. Dependencies: FE-003. Implementation: **In Progress**. Evidence: several are implemented, no full UI test matrix. Remaining: test every data screen state.  
**UX-004** `[MUST]`: use neutral, non-coercive language; explain strategy tradeoffs. Acceptance: compare methods without recommending a universal winner or implying financial advice. Dependencies: STRAT-004, approved content review. Implementation: **In Progress**. Evidence: some copy present, content review pending. Remaining: approve copy across the application.  
**UX-005** `[SHOULD]`: reusable tokens/components for color, spacing, focus and financial number formatting. Acceptance: shared documented tokens/components are used consistently on target routes. Dependencies: none identified. Implementation: **Proposed**. Evidence: no formal system documented. Remaining: define and adopt a minimal design system if approved.  
**UX-006** `[SHOULD]`: Acceptance: any chart remains optional and has a text equivalent. Dependencies: FE-005, A11Y-003. Implementation: **In Progress**. Evidence: not present in current Next route. Remaining: implement accessible chart or explicitly defer it.  
Motion must be subtle, non-blocking and reduced-motion aware. No `prefers-reduced-motion` rule was found in the inspected target globals stylesheet.  
**29 / Accessibility and responsive design**  
**A11Y-001** `[MUST]`: all forms, actions, navigation, tables and dialogs are keyboard operable with visible focus. Acceptance: complete target-screen keyboard audit passes with visible focus. Dependencies: target screen inventory. Implementation: **In Progress**. Evidence: source includes labels, semantic tables and navigation, but comprehensive keyboard audit absent. Remaining: conduct and record manual audit.  
**A11Y-002** `[MUST]`: accessible names, error association, status announcements and table headers. Acceptance: automated and manual checks confirm required semantics for each screen. Dependencies: FE-003, UX-002. Implementation: **In Progress**. Evidence: `role=alert/status`, labels and captions appear in several screens; no automated/manual full audit. Remaining: audit every route with assistive technology.  
**A11Y-003** `[MUST]`: chart values have a nonvisual equivalent and color is not the sole signal. Acceptance: any chart has a complete text/table equivalent and non-color cues. Dependencies: FE-005. Implementation: **Proposed** for current Next app; no current Next chart found. Remaining: include if a chart is implemented; otherwise retain as a gate.  
**A11Y-004** `[MUST]`: respect reduced-motion preference for transitions/animation. Acceptance: reduced-motion preference removes or minimizes nonessential motion. Dependencies: motion implementation. Implementation: **Proposed**; target CSS preference not found. Remaining: add and test reduced-motion behavior before motion release.  
**RESP-001** `[MUST]`: responsive layouts work on narrow mobile, tablet and desktop without loss of data/actions. Acceptance: all journeys work at agreed viewport widths without clipped content or inaccessible actions. Dependencies: target browser/device matrix. Implementation: **In Progress**. Evidence: Tailwind responsive classes exist, browser device matrix not verified. Remaining: run and record responsive browser tests.  
**A11Y-005** `[MUST]`: target WCAG 2.2 AA and validate with automated and manual techniques, including zoom, contrast, keyboard and screen reader. Acceptance: publish findings and resolve blocking WCAG 2.2 AA issues before release. Dependencies: A11Y-001–004, target screen inventory. Implementation: **Proposed**; no accessibility report/tooling in test scripts. Remaining: define audit scope, run automated/manual testing, and resolve findings.  
Do not claim WCAG conformance based on semantic markup or a successful build.  
**30 / Non-functional requirements**  
  
|  |  |  |  |  |  
| - | - | - | - | - |  
| **ID / quality** |  **Requirement and acceptance** |  **Dependencies** |  **Implementation status / evidence** |  **Remaining work** |  
| NFR-PERF |  Agree p95 calculation/API and UI budgets; measure representative 50-loan inputs |  Product/operations targets |  **Proposed**; no performance test/SLO |  Approve budgets and add representative performance test |  
| NFR-AVAIL |  Distinguish readiness from liveness; set approved availability target |  Deployment and operations |  **In Progress**; static health endpoint only |  Implement readiness and measure approved target |  
| NFR-SEC |  HTTPS, secret management, authorization, body bounds, rate limits, dependency gate |  SEC-001–005, deployment |  **In Progress**; some controls exist; audit and production settings open |  Close security gaps and verify production configuration |  
| NFR-RELIABILITY |  Identical version + inputs + assumptions yields deterministic results |  CALC-001–006, STRAT-001–003 |  **Implemented** at engine level; one parity fixture verified |  Expand deterministic/parity fixtures |  
| NFR-SCALE |  Keep Express stateless; use durable DB-backed state/rate-limit strategy as needed |  MongoDB and deployment design |  **In Progress**; Mongo-backed user records intended; deployment not tested |  Verify deployment and durable limits |  
| NFR-OBS |  Redacted structured logs, request IDs, metrics, alerts and incident procedure |  BE-005, operations |  **In Progress**; `console` logs and central error handler only |  Implement and test observability/runbooks |  
| NFR-RECOVERY |  Approved backup, restore test and data rollback |  DATA-003, operations |  **Blocked**; no rehearsal evidence |  Approve policy and complete rehearsal |  
| NFR-COMPAT |  Support agreed current browsers and mobile widths |  Product/device matrix |  **Proposed**; no browser matrix |  Approve matrix and run browser tests |  
| NFR-MAINT |  Typed contracts, documented assumptions, focused lint/test commands |  ARCH-002, BE-006 |  **In Progress**; backend lint absent; finance/report docs exist |  Add lint gate and close contract gaps |  
  
   
Do not invent numeric service objectives. Product and operations must set targets before launch and supply measurement evidence.  
**31 / Testing and quality assurance strategy**  
**Current actual test inventory**  
- Python pytest: 33 tests across repayment, refinancing, edge cases, validation and API.  
- Backend Jest: 6 suites, 18 tests (health, repayment, refinance, regression, auth/ownership route contracts, Python/TypeScript parity).  
- Frontend: ESLint and production build; no frontend unit/component/E2E script found.  
- No MongoDB-backed integration suite, browser E2E, dedicated security test suite, performance suite, or backend lint command was found.  
**Required layers**  
1. Unit: calculation helpers, validation, serialization, auth utilities and frontend components.  
2. API integration with disposable MongoDB and an email test sink.  
3. Multi-user ownership, unauthenticated, stale session, role and escalation tests.  
4. Financial regression/parity fixtures including edge cases and month-end dates.  
5. Browser E2E through UI → Express → MongoDB for user and admin flows.  
6. Responsive, keyboard/screen-reader/reduced-motion verification.  
7. Dependency and secret scans; security review; operational backup/restore rehearsal.  
**32 / Financial parity and regression testing**  
**Current verified parity evidence**  
`backend/tests/financialParity.test.ts` invokes the Python reference with the same fixed input as TypeScript:  
- Federal loan \$5,000 at 8%, \$100 minimum.  
- Private loan \$2,000 at 4%, \$100 minimum.  
- Unknown zero-rate loan \$1,250, \$50 minimum.  
- \$200 extra monthly; fixed start date 2025-01-01.  
- Refinance offers 4.5% for 60 months with \$400 upfront and financed fee treatment.  
The test compares full baseline/avalanche/snowball schedules, monthly interest/principal/payment/closing balance, summaries, dates, rollovers and refinance summaries after cent normalization. It passes.  
**Not covered**  
This is one fixture. It does not establish parity for month-end dates/time zones, every validation boundary, random portfolios, duplicate IDs, sub-cent numbers, all non-amortizing/600-month cases, or production workloads. TypeScript `Date.setMonth` can differ from Python `relativedelta` at month boundaries. Express numeric validation also differs from Python Decimal-place validation.  
**Parity gate**  
Add reviewed fixtures, compare every required output, investigate discrepancies, document approved behavior, and retain Python until engineering/domain owners sign off.  
**33 / End-to-end acceptance criteria**  
**User journey**  
On disposable MongoDB and email sink: register → verify email → login → create loans → edit one → delete one → run comparison → verify avalanche/snowball allocation and amortization schedule → run zero/nonzero-rate refinance with both fee options → save scenario → reopen saved snapshot → delete scenario → logout → verify protected request denied.  
**Ownership and authorization**  
- User A can list/read/update/delete their own loans/scenarios.  
- User A cannot read, update, delete or infer User B’s records by ID.  
- Unauthenticated requests cannot access account records or protected calculations.  
- ADMIN can perform approved user management but cannot assign roles.  
- ADMIN cannot act on administrator accounts where policy forbids it.  
- SUPER_ADMIN role changes require verification/active status rules; last-active SUPER_ADMIN guard works under concurrent requests.  
- Deactivation/password reset invalidates sessions.  
**Product behavior**  
Verify actual UI requests, API response, and persisted Mongo records; ensure displayed values equal returned values and errors are honest. Test mobile viewport, keyboard and reduced motion.  
**Current status: Blocked.** Previous browser check rendered forms/refinance empty state but API at `localhost:4000` refused connection. No journey above is claimed passed.  
**34 / Migration strategy and legacy system assessment**  
**Observed systems**  
- **Current target frontend:** `frontend/`, Next.js App Router.  
- **Target backend:** `backend/src/`, separate Express API and Mongoose models.  
- **Reference API/engine:** `backend/app/`, Python FastAPI and Decimal engine.  
- **Reference frontend:** `frontend-legacy/`, React/Vite local-first application with localStorage and chart/schedule components.  
- The legacy folder is untracked in current Git status and includes dependencies/build artifacts; preserve it and do not stage/delete it without explicit review.  
- Git branch is `migration/next-express-mongo`; recent history contains phased migration commits. `git remote -v` returned no configured remote.  
- Worktree was already dirty with modified/untracked project/code/docs files. PRD audit did not treat them as all newly created by this request.  
**SQL migration**  
No SQL file/schema/data source was found in the repository inventory. No SQL-to-MongoDB migration code or records exist in verified evidence. Status: **Blocked**. Do not infer schema, access production data, or migrate without an approved read-only source, mapping, idempotency, reconciliation and rollback plan.  
**Local browser import**  
Import from `clearpath_mvp_loans`/`loanoptima_mvp_loans` is a separate feature; it is not SQL migration and has not passed E2E.  
**35 / Development roadmap and milestones**  
Milestones are ordered by dependency; dates and estimates require team planning.  
  
|  |  |  |  |  
| - | - | - | - |  
| **Milestone** |  **Outcome** |  **Exit criteria** |  **Current state** |  
| M0 — Product decisions |  Confirm guest/account policy, jurisdiction, retention and financial rules |  Decisions recorded and approved |  In Progress |  
| M1 — Core calculation quality |  Resolve precision/date/validation differences and broaden parity |  Reviewed fixture suite passes; engine behavior signed off |  In Progress |  
| M2 — Frontend core journey |  Guest/account entry states, portfolio CRUD, strategy/chart/schedule UX |  Acceptance and accessible UI tests pass |  In Progress |  
| M3 — Real API/data |  Mongo/SMTP integration, indexes, user/session/loan/scenario flows |  Disposable DB + email E2E pass |  Blocked |  
| M4 — Authorization/admin |  Real IDOR/role/audit checks; complete pagination/log policies |  Security tests and audit controls pass |  In Progress |  
| M5 — Migration readiness |  Only if a SQL source is identified: dry run/reconciliation/rollback |  Explicit migration approval and rehearsal |  Blocked |  
| M6 — Release readiness |  dependency remediation, operations, restore and deployment drill |  all page 38 gates pass |  Blocked |  
  
   
Keep the Python engine and original source data until M1–M6 gates, as applicable, are accepted.  
**36 / Risks, dependencies and mitigations**  
  
|  |  |  |  |  
| - | - | - | - |  
| **Risk / dependency** |  **Impact** |  **Mitigation and owner role** |  **Status** |  
| No SQL source/schema discovered |  Migration mappings/counts cannot be defined |  Product/data owner identifies source; no migration until approved |  Blocked |  
| MongoDB unavailable for verification |  Persistence/index/ownership behavior unknown |  Backend/QA provision disposable DB and integration suite |  Blocked |  
| SMTP unavailable |  Verification/reset flows may not work |  Operations configure test sink and verify delivery/replay/expiry |  Blocked |  
| Backend audit has 2 high findings (`nodemailer`, `zod`) |  Release supply-chain risk |  Backend owner assess and test compatible major upgrades |  In Progress |  
| No backend lint script |  Static quality gate absent |  Engineering add approved lint configuration/script |  Proposed |  
| Single parity fixture |  Unseen financial differences possible |  Finance/engineering expand differential fixture matrix |  In Progress |  
| JS Date month arithmetic |  Month-end payoff date may differ from Python |  Add month-end tests and approve canonical date behavior |  In Progress |  
| Express financial API accepts user-supplied loans |  Calculations may not reflect owned persisted records |  Product/backend define snapshot vs owner-linked calculation contract |  In Progress |  
| `.env` file not evidently loaded |  Local setup may not use copied config |  Confirm environment loading; document and test startup |  In Progress |  
| AuditLog/AnalyticsEvent/AppSetting schemas unused |  Implied capabilities not delivered |  Mark as future or implement with policies/tests |  Proposed |  
| No configured Git remote |  GitHub sync/release traceability unavailable |  Repository owner configures approved remote separately |  Blocked |  
| Dirty worktree/untracked legacy folder |  Risk of unintended staging/overwrite |  Review file ownership before commits; preserve unrelated changes |  In Progress |  
  
   
**37 / Open questions and assumptions**  
  
|  |  |  |  
| - | - | - |  
| **ID** |  **Question / assumption** |  **Needed decision owner** |  
| OQ-001 |  Is United States/USD the approved launch market? |  Product / legal |  
| OQ-002 |  Must Next.js support anonymous local planning, or is login required for data pages? |  Product |  
| OQ-003 |  Are email verification and reset mandatory for first account release? |  Product / security |  
| OQ-004 |  Should calculation endpoints derive loans from Mongo owner records or accept an explicit snapshot? |  Product / backend |  
| OQ-005 |  What is the approved cents/decimal input policy for Express, Mongo and Python parity? |  Financial / engineering |  
| OQ-006 |  What is the canonical month-end/timezone rule for payoff date labels? |  Financial / engineering |  
| OQ-007 |  What data retention, account deletion, export and backup retention apply? |  Product / privacy |  
| OQ-008 |  Are admin audit logs, configurable settings and analytics required in initial release? |  Product / security |  
| OQ-009 |  Does a SQL data source exist outside this workspace? |  Data owner |  
| OQ-010 |  Which browsers, performance SLOs and availability targets are required? |  Product / operations |  
| OQ-011 |  Who owns support, incident response, production deployment and rollback? |  Manager |  
  
   
Until decided, assumptions remain explicit and the related feature must not be reported as approved or complete.  
**38 / Requirements traceability matrix**  
  
|  |  |  |  |  
| - | - | - | - |  
| **Requirement group** |  **IDs** |  **Principal implementation location** |  **Verification evidence / gap** |  
| Cross-functional product behavior |  CORE-001–003 |  Frontend pages, API client, services |  Build and partial route tests; no complete UI review |  
| Authentication/account |  AUTH-001–007 |  `backend/src/routes/auth.ts`, middleware, User/Token models; `frontend/src/app/{register,login,verify-email,reset-password}` |  Jest mocked route tests pass; Mongo/SMTP/browser flow missing |  
| Loan management/import |  LOAN-001–006 |  `routes/loans.ts`, Loan model; `/loans`, `/import` |  Mocked selectors; real DB/browser flow missing; guest target gap |  
| Calculation and schedule |  CALC-001–006 |  `services/finance/repayment.ts`, `routes/repayment.ts`; `/repayment` |  Jest/Python tests and one parity fixture; API-to-browser blocked |  
| Strategy logic |  STRAT-001–004 |  Python/TS repayment engines |  Code and unit/parity evidence; broaden ties/rollover fixtures |  
| Refinance |  REFI-001–005 |  `services/finance/refinancing.ts`, route; `/refinancing` |  Unit/parity fixture; request/owner contract and live E2E open |  
| Saved scenarios |  SCEN-001–005 |  `routes/scenarios.ts`, Scenario model, `api.ts`, `/repayment` |  Mocked owner filters; real DB integration unavailable |  
| Administration |  ADM-001–006 |  `routes/admin.ts`, User model, `/admin`, AuditLog/AppSetting/AnalyticsEvent schemas |  Mocked role tests; no audit/settings/analytics implementation |  
| Architecture/frontend/backend |  ARCH-001–003, FE-001–006, BE-001–006 |  `frontend/`, `backend/src/` |  Front lint/build and backend build pass; lint/integration gaps remain |  
| Data and privacy |  DATA-001–003, PRIV-001–004 |  Mongoose models, auth, import and logging paths |  Mock contracts/source review only; policies and real DB proof missing |  
| UX/accessibility/NFR |  UX-001–006, A11Y-001–005, RESP-001, NFR-\* |  Next app/layout/CSS/API |  No comprehensive accessibility, responsive, performance or ops test |  
  
   
