# Product Requirements Document (PRD)

## Student Loan Refinancing & Accelerated Payoff Planner

  Field            Value
  ---------------- ---------------------------------------
  Version          1.0
  Status           Draft for review
  Product stage    MVP
  Initial market   United States (assumption to confirm)
  Date             20 November 2026

------------------------------------------------------------------------

## 1. Executive Summary

The Student Loan Refinancing & Accelerated Payoff Planner is a
responsive web application that helps borrowers understand their student
loan debt, compare repayment strategies, and evaluate a manually entered
hypothetical refinancing offer.

The MVP allows users to enter multiple loans, view their combined debt,
set an additional monthly payment, and compare:

1.  Minimum-payment baseline.
2.  Debt avalanche --- prioritise the highest-interest loan.
3.  Debt snowball --- prioritise the smallest-balance loan.

Users can also enter a hypothetical refinancing rate, term, and fees to
compare estimated monthly payments and total costs with their current
repayment scenario.

The MVP does not connect to lenders, retrieve live rates, submit loan
applications, check eligibility, or provide personalised financial
advice.

**Core product principle:** calculation accuracy and transparent
assumptions matter more than feature quantity or visual complexity.

## 2. Product Overview

### 2.1 Product vision

Make student loan repayment easier to understand by turning loan details
into clear, comparable repayment plans.

### 2.2 Problem statement

Borrowers with multiple student loans may struggle to understand how
balances, interest rates, minimum payments, and extra payments interact.
They may find it difficult to compare repayment strategies or assess
whether a refinancing offer is beneficial over the full loan term.

### 2.3 Proposed solution

Provide a focused calculator and dashboard that: - Consolidates manually
entered loan information into one view. - Models repayment month by
month. - Applies consistent assumptions to each repayment strategy. -
Compares payoff duration, total interest, and total repayment. -
Evaluates a user-entered refinancing scenario, including fees and term
changes.

### 2.4 Value proposition

"Understand your student debt, compare ways to pay it off, and evaluate
refinancing scenarios before making a decision."

## 3. Goals and Non-Goals

### 3.1 MVP goals

-   Allow users to enter, edit, and delete multiple loans.
-   Calculate a minimum-payment baseline.
-   Generate avalanche and snowball repayment schedules.
-   Compare repayment outcomes using consistent assumptions.
-   Allow a hypothetical refinancing comparison.
-   Deliver a responsive, deployable web application.

### 3.2 Out of scope

The MVP will not include: - Loan origination, servicing, consolidation,
or refinancing. - Loan applications or lender approval. - Bank or
loan-servicer connections. - Credit score retrieval or underwriting. -
Live lender rate feeds or lender API integrations. - Automated lender
eligibility checks. - Guaranteed savings or payoff dates. - Personalised
financial, tax, or legal advice. - Subscriptions or paid accounts. - AI
financial advice. - Automatic loan statement imports. - A lender
marketplace or affiliate lead-generation system.

## 4. Target Users

These personas are initial hypotheses, not validated research findings.

### Persona A: Recent graduate with multiple loans

Has several loans with different balances and rates. Wants to understand
total debt and decide which loan to repay first.

### Persona B: Borrower trying to repay faster

Has stable income and may be able to pay extra each month. Wants to
understand how extra payments affect payoff time and interest.

### Persona C: Borrower considering refinancing

Has encountered a possible refinancing offer. Wants to compare the
proposed rate, term, fees, monthly payment, and total cost with current
loans.

## 5. Assumptions and Open Questions

  -----------------------------------------------------------------------
  ID                      Assumption              Validation required
  ----------------------- ----------------------- -----------------------
  A-001                   Initial market is the   Confirm with project
                          United States.          owner.

  A-002                   Users manually enter    Confirm required
                          loan details.           fields.

  A-003                   Calculator use does not Confirm whether saved
                          require registration.   plans are required.

  A-004                   Refinancing offers are  Confirm expected demo
                          manually entered and    flow.
                          hypothetical.

  A-005                   Calculations use        Confirm treatment of
                          monthly periods.        lender-specific
                                                  conventions.

  A-006                   Initial model supports  Confirm supported loan
                          standard fixed-rate     types.
                          amortising loans.
  -----------------------------------------------------------------------

Questions to resolve before implementation: 1. Is the United States
definitely the target market? 2. Should plans persist between visits, or
is session-only use sufficient? 3. Is authentication required? 4. Should
the first version support fixed-rate loans only? 5. Is a manual
refinancing comparison sufficient, or is a lender directory expected? 6.
What deployment environment is required?

Do not silently invent answers. Record decisions here and update the
PRD.

## 6. Primary User Journey

1.  User opens the landing page.
2.  User starts a debt plan.
3.  User enters one or more loans.
4.  The application validates the inputs.
5.  The dashboard displays total debt and minimum monthly payments.
6.  User enters an optional extra monthly payment.
7.  The application calculates baseline, avalanche, and snowball
    scenarios.
8.  User compares payoff dates, months, total interest, and total
    repayment.
9.  User optionally enters a hypothetical refinancing offer.
10. The application displays the comparison and relevant caveats.

``` mermaid
flowchart TD
    A[Landing page] --> B[Start debt plan]
    B --> C[Enter loan details]
    C --> D{Inputs valid?}
    D -- No --> E[Show validation errors]
    E --> C
    D -- Yes --> F[Debt overview]
    F --> G[Set extra monthly payment]
    G --> H[Calculate repayment scenarios]
    H --> I[Compare baseline, avalanche and snowball]
    I --> J{Evaluate refinancing?}
    J -- Yes --> K[Enter hypothetical offer]
    K --> L[Compare estimated costs]
    J -- No --> M[Review plan]
    L --> M
```

## 7. Functional Requirements

Priority definitions: **Must** = required for MVP; **Should** = valuable
if time permits; **Future** = deferred.

### 7.1 Loan management

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  FR-001                  User can add a loan     Must
                          manually.

  FR-002                  User can enter a loan   Must
                          name or label.

  FR-003                  User can enter          Must
                          outstanding principal
                          balance.

  FR-004                  User can enter annual   Must
                          interest rate.

  FR-005                  User can enter minimum  Must
                          monthly payment.

  FR-006                  User can classify a     Should
                          loan as federal,
                          private, or unknown.

  FR-007                  User can edit a loan.   Must

  FR-008                  User can delete a loan  Must
                          after confirmation.

  FR-009                  System calculates total Must
                          entered debt.

  FR-010                  System calculates total Must
                          minimum monthly
                          payments.

  FR-011                  System validates        Must
                          required fields and
                          invalid values.
  -----------------------------------------------------------------------

Validation: - Balance must be greater than zero. - Interest rate must be
zero or greater and within a documented product limit. - Minimum payment
must be greater than zero for a loan with a positive balance. - Currency
values must be non-negative. - Required blank fields must be
identified. - Invalid text must not silently become zero.

### 7.2 Repayment calculator

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  FR-012                  Calculate monthly       Must
                          interest for each loan.

  FR-013                  Calculate principal     Must
                          paid.

  FR-014                  Calculate remaining     Must
                          balance after each
                          monthly payment.

  FR-015                  Generate a              Must
                          month-by-month
                          repayment schedule.

  FR-016                  Calculate total         Must
                          interest paid.

  FR-017                  Calculate total amount  Must
                          repaid.

  FR-018                  Estimate payoff month   Must
                          and year when
                          calculable.

  FR-019                  Allow an additional     Must
                          monthly payment amount.

  FR-020                  Recalculate when loan   Must
                          inputs or extra payment
                          change.
  -----------------------------------------------------------------------

### 7.3 Minimum-payment baseline

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  FR-021                  Calculate a baseline    Must
                          using each loan's
                          entered minimum
                          payment, capped at the
                          amount needed to clear
                          the loan.

  FR-022                  Identify loans that     Must
                          cannot be paid off
                          under the entered
                          payment assumptions.

  FR-023                  Do not report a finite  Must
                          payoff date when a
                          payment is insufficient
                          to amortise a loan.
  -----------------------------------------------------------------------

The default baseline uses minimum payments only and no extra payment.
Extra-payment scenarios are compared separately.

### 7.4 Avalanche strategy

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  FR-024                  Order active loans by   Must
                          descending interest
                          rate.

  FR-025                  Apply minimum payments  Must
                          to all active loans.

  FR-026                  Allocate the extra      Must
                          monthly amount to the
                          highest-rate active
                          loan.

  FR-027                  Redirect available      Must
                          payment to the next
                          loan when a target loan
                          is paid off.

  FR-028                  Generate a              Must
                          month-by-month
                          avalanche schedule.

  FR-029                  Calculate payoff        Must
                          duration, total
                          interest, and total
                          repayment.
  -----------------------------------------------------------------------

Tie-break: same interest rate means smaller balance first, then stable
loan creation order.

### 7.5 Snowball strategy

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  FR-030                  Order active loans by   Must
                          ascending outstanding
                          balance.

  FR-031                  Apply minimum payments  Must
                          to all active loans.

  FR-032                  Allocate extra monthly  Must
                          payment to the
                          smallest-balance active
                          loan.

  FR-033                  Redirect available      Must
                          payment to the next
                          loan when a target loan
                          is paid off.

  FR-034                  Generate a              Must
                          month-by-month snowball
                          schedule.

  FR-035                  Calculate payoff        Must
                          duration, total
                          interest, and total
                          repayment.
  -----------------------------------------------------------------------

Tie-break: same balance means higher interest rate first, then stable
loan creation order.

### 7.6 Strategy comparison

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  FR-036                  Display baseline,       Must
                          avalanche, and snowball
                          results together.

  FR-037                  Show estimated payoff   Must
                          duration.

  FR-038                  Show total interest     Must
                          paid.

  FR-039                  Show total amount       Must
                          repaid.

  FR-040                  Show estimated interest Must
                          saved against a valid
                          baseline.

  FR-041                  Show estimated time     Must
                          saved against a valid
                          baseline.

  FR-042                  Explain the ordering    Should
                          rule used by each
                          strategy.

  FR-043                  Display a simple        Should
                          balance-over-time
                          chart.
  -----------------------------------------------------------------------

Do not label either strategy universally best. Explain that avalanche
targets interest cost, while snowball prioritises early balance payoffs
and may offer behavioural motivation.

### 7.7 Refinancing comparison

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  FR-044                  User can enter a        Must
                          hypothetical
                          refinancing interest
                          rate.

  FR-045                  User can enter a        Must
                          proposed repayment
                          term.

  FR-046                  User can enter          Must
                          refinancing fees.

  FR-047                  Calculate proposed      Must
                          monthly payment under
                          documented assumptions.

  FR-048                  Calculate estimated     Must
                          total payments and
                          interest.

  FR-049                  Compare the offer with  Must
                          a selected current-loan
                          scenario.

  FR-050                  Show monthly payment    Must
                          and estimated
                          total-cost differences.

  FR-051                  Show whether fees are   Must
                          included and how.

  FR-052                  Warn that refinancing   Must
                          eligible federal loans
                          into private loans can
                          result in loss of
                          federal benefits and
                          protections.

  FR-053                  Label manually entered  Must
                          offers as hypothetical,
                          not verified lender
                          offers.

  FR-054                  Show a simple           Should
                          break-even estimate
                          only when meaningful.
  -----------------------------------------------------------------------

No live rates, lender recommendations, eligibility checks, or
applications are included.

### 7.8 Dashboard

  ID       Requirement                                            Priority
  -------- ------------------------------------------------------ ----------
  FR-055   Show total outstanding debt.                           Must
  FR-056   Show number of active loans.                           Must
  FR-057   Show total minimum monthly payments.                   Must
  FR-058   Show selected strategy results.                        Must
  FR-059   Show estimated debt-free date when calculable.         Must
  FR-060   Show a visual repayment comparison.                    Should
  FR-061   Clearly identify when a result cannot be calculated.   Must

### 7.9 Persistence and authentication

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  FR-062                  Calculator should be    Must
                          usable without
                          registration.

  FR-063                  Local storage or        Should
                          session storage may be
                          used if persistence is
                          needed.

  FR-064                  Accounts and            Future
                          cross-device
                          synchronisation are
                          deferred.

  FR-065                  User can clear entered  Must
                          data.
  -----------------------------------------------------------------------

Choose the simplest reliable persistence approach. If local storage is
used, disclose that data is stored on the user's device and provide a
reset action.

## 8. Financial Calculation Rules

The repayment engine is the most important technical component. All
calculations must be deterministic, independently tested, and based on
visible assumptions.

### 8.1 Initial calculation assumptions

-   Monthly calculation periods.
-   Annual nominal interest rate divided by 12 to obtain the monthly
    rate.
-   Interest calculated on the opening balance for each monthly period.
-   Payments assumed to occur at the end of each monthly period.
-   No late fees, variable-rate changes, deferment, forbearance,
    capitalisation events, or lender-specific fees unless explicitly
    entered.
-   Estimates may differ from actual lender statements and payoff
    quotes.
-   Use decimal-safe arithmetic for monetary calculations.
-   Display currency to two decimal places while retaining adequate
    internal precision.

Formulas:

``` text
monthly_rate = annual_interest_rate / 12
monthly_interest = opening_balance * monthly_rate
principal_paid = payment_applied - monthly_interest
closing_balance = max(0, opening_balance + monthly_interest - payment_applied)
```

The payment applied must not exceed the amount needed to clear the loan
for that period.

### 8.2 Payment sufficiency

If the payment is less than or equal to the monthly interest under the
model: - Identify the loan as not amortising. - Do not display a
misleading finite payoff date. - Explain that the payment may not cover
monthly interest. - Allow the user to change the payment or assumptions.

### 8.3 Allocation model

For avalanche and snowball:

1.  Calculate monthly interest for each active loan.
2.  Apply the required minimum payment to each active loan, capped at
    the amount required to clear it.
3.  Determine the remaining extra-payment pool.
4.  Apply extra payment according to the strategy priority order.
5.  If a target loan is cleared, allocate remaining extra funds to the
    next loan in the same period, following one consistently documented
    rule.
6.  Never allocate more than the amount required to clear a loan.
7.  Recalculate balances for the next period.

The exact rollover timing must be specified in the implementation and
tested. Apply the same rule to both strategies.

### 8.4 Refinancing calculation

For a standard fixed-rate amortising loan with monthly payments:

``` text
payment = P * r / (1 - (1 + r)^(-n))
```

Where: - `P` = refinancing principal. - `r` = monthly interest rate. -
`n` = number of monthly payments.

For zero interest:

``` text
payment = P / n
```

The UI must state whether fees are paid upfront or added to principal.
Default to fees paid upfront unless the user explicitly chooses to
finance them.

Compare total cash outflow consistently: - Current scenario: remaining
scheduled payments plus applicable costs. - Refinancing scenario: new
scheduled payments plus upfront fees, or payments on the financed amount
if fees are added to principal.

Do not compare monthly payment alone. A longer term can lower the
monthly payment while increasing total cost.

Only show a break-even estimate where the comparison method is
meaningful and explain the method.

### 8.5 Required calculation tests

Test: - One loan with zero interest. - One loan with positive fixed
interest. - Multiple loans with different rates and balances. - Equal
rates and equal balances. - Extra payment larger than the target loan's
remaining payoff amount. - A loan paid off during a monthly allocation
period. - Minimum payment insufficient to cover interest. - Invalid
negative values. - Refinancing at zero interest. - Fees paid upfront. -
Fees financed into principal. - Longer refinancing term with lower
monthly payment but higher total cost.

Expected numerical results must be independently calculated and reviewed
before becoming test assertions.

## 9. UI/UX Requirements

### 9.1 Design direction

Modern, trustworthy fintech interface: - Clear information hierarchy. -
Simple forms. - Readable financial figures. - Restrained colour
palette. - Responsive layouts. - Accessible labels and contrast. -
Minimal animation. - No unnecessary dashboard cards.

### 9.2 MVP screens

**Screen 1: Landing page** - Product name and short explanation. -
Primary action to start a plan. - Short explanation of snowball and
avalanche. - Notice that results are estimates.

**Screen 2: Loan entry** - Loan name. - Outstanding balance. - Annual
interest rate. - Minimum monthly payment. - Optional loan type. - Add
another loan. - Validation messages. - Continue action.

**Screen 3: Debt dashboard** - Total debt. - Active loan count. - Total
minimum monthly payment. - Loan list. - Extra monthly payment input. -
Strategy comparison summary.

**Screen 4: Strategy comparison** - Baseline, avalanche, and snowball
results. - Total interest. - Total repayment. - Payoff duration. -
Estimated debt-free date. - Simple chart or schedule. - Explanation of
strategy ordering.

**Screen 5: Refinancing comparison** - Current loan scenario. - Proposed
rate and term. - Fees. - New monthly payment. - Estimated total cost. -
Cost and payment differences. - Federal-loan warning where relevant. -
Hypothetical-offer disclaimer.

Every screen must handle empty, loading, validation-error,
unavailable-result, and success states as applicable.

## 10. Non-Functional Requirements

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  NFR-001                 Work on current major   Must
                          desktop and mobile
                          browsers.

  NFR-002                 Return calculator       Must
                          results promptly for a
                          reasonable number of
                          loans.

  NFR-003                 Produce deterministic   Must
                          results for identical
                          inputs and assumptions.

  NFR-004                 Be usable on common     Must
                          mobile screen sizes.

  NFR-005                 Provide accessible      Must
                          input labels and
                          validation messages.

  NFR-006                 Avoid collecting        Must
                          unnecessary personal
                          information.

  NFR-007                 Handle errors without   Must
                          exposing stack traces.

  NFR-008                 Allow locally stored    Must
                          data to be cleared.

  NFR-009                 Keep the calculation    Must
                          engine independently
                          testable.
  -----------------------------------------------------------------------

## 11. Recommended Technical Direction

This is a recommendation, not a final architecture decision.

  -----------------------------------------------------------------------
  Layer                   Suggested technology    Reason
  ----------------------- ----------------------- -----------------------
  Frontend                React, TypeScript, Vite Fast component-based
                                                  development

  Styling                 Tailwind CSS            Responsive styling

  Backend                 Python and FastAPI      Suitable for
                                                  calculation APIs

  Calculation engine      Isolated Python module  Testable financial
                          using decimal-safe      logic
                          arithmetic

  Charts                  Recharts or Chart.js    Repayment visualisation

  Persistence             Local storage           Avoid unnecessary
                          initially, or Supabase  account infrastructure
                          if persistence is
                          required

  Frontend deployment     Vercel                  Straightforward
                                                  deployment

  Backend deployment      Suitable Python hosting Hosts FastAPI if
                          provider                backend is used
  -----------------------------------------------------------------------

For a single-developer MVP, use a simple frontend and small calculation
backend, or run calculations in the frontend if server-side processing
and persistence are unnecessary. Do not introduce microservices.

Authentication should not be required for the initial calculator
experience unless the project owner explicitly requires saved plans
across devices.

## 12. Risks and Compliance

  -----------------------------------------------------------------------
  Risk                    Impact                  MVP mitigation
  ----------------------- ----------------------- -----------------------
  Incorrect repayment     Misleading debt costs   Independently validate
  calculations            or payoff dates         formulas and unit tests

  Simplified interest     Difference from lender  Disclose model
  assumptions             statements              assumptions

  Incorrect refinancing   Misleading savings      Include fees, term, and
  comparison              claims                  total cost

  Loss of federal         Borrower may lose       Prominent warning where
  benefits                federal protections     relevant

  Outdated lender         Incorrect rates or      No live lender rates in
  information             eligibility claims      MVP

  Privacy exposure        Sensitive financial     Minimise collection and
                          data exposed            provide data reset

  Misleading claims       Estimates mistaken for  Label results as
                          guarantees              estimates
  -----------------------------------------------------------------------

### Required user-facing disclaimers

-   Calculations are estimates based on information entered by the user.
-   Actual loan terms, interest calculations, payment allocation, and
    payoff amounts may differ by lender.
-   The application does not provide legal, tax, or personalised
    financial advice.
-   A refinancing comparison is not a lender quote or approval.
-   Refinancing eligible federal student loans into private loans can
    cause borrowers to lose federal benefits and protections.

Before public launch, applicable US federal and state requirements
should be reviewed by qualified legal or compliance professionals. This
PRD is not legal advice and does not establish regulatory compliance.

## 13. Analytics and Measurement

Analytics are optional for the first demonstration. If implemented,
collect only the minimum necessary events.

  -----------------------------------------------------------------------
  Metric                              Definition
  ----------------------------------- -----------------------------------
  Loan entry completion               Users who complete loan entry after
                                      starting

  Calculator completion               Users who receive a repayment
                                      result

  Strategy comparison usage           Users who view more than one
                                      strategy

  Extra-payment interaction           Users who change the extra-payment
                                      amount

  Refinancing comparison usage        Users who complete a hypothetical
                                      comparison

  Calculation errors                  Failed or invalid calculation
                                      attempts
  -----------------------------------------------------------------------

Do not set arbitrary targets before usability testing.

## 14. MVP Prioritisation

  Feature                                     Priority   Release
  ------------------------------------------- ---------- ---------------------
  Manual loan entry                           Must       MVP
  Edit and delete loans                       Must       MVP
  Debt summary                                Must       MVP
  Monthly interest and balance calculations   Must       MVP
  Minimum-payment baseline                    Must       MVP
  Avalanche strategy                          Must       MVP
  Snowball strategy                           Must       MVP
  Extra monthly payment                       Must       MVP
  Strategy comparison                         Must       MVP
  Basic repayment visualisation               Should     MVP if time permits
  Hypothetical refinancing comparison         Must       MVP
  Local persistence                           Should     If needed
  User accounts                               Future     Deferred
  Live lender integrations                    Future     Deferred
  Bank integrations                           Future     Deferred
  Credit checks                               Future     Deferred
  Loan applications                           Future     Deferred
  AI financial adviser                        Future     Deferred
  Affiliate marketplace                       Future     Deferred

## 15. Development Milestones

Planning ranges depend on the developer's experience and final scope.
They are not delivery commitments.

  -----------------------------------------------------------------------
  Milestone               Work                    Deliverable
  ----------------------- ----------------------- -----------------------
  1\. Product definition  Confirm assumptions and Agreed MVP scope
                          PRD

  2\. UI planning         Define screens and user Wireframes or UI spec
                          flow

  3\. Project setup       Create application      Running skeleton
                          structure

  4\. Loan management     Entry, editing,         Working loan flow
                          deletion, validation

  5\. Calculation engine  Monthly interest and    Tested baseline
                          amortisation

  6\. Repayment           Avalanche and snowball  Tested schedules
  strategies

  7\. Comparison          Metrics and visual      Working dashboard
  dashboard               comparison

  8\. Refinancing         Manual offer comparison Working comparison
  calculator

  9\. QA                  Edge cases, mobile,     Release candidate
                          error states

  10\. Deployment         Deploy frontend and     Shareable MVP URL
                          backend if applicable
  -----------------------------------------------------------------------

### First five development tasks

1.  Confirm target market and calculation assumptions.
2.  Define the loan input data model.
3.  Implement and test monthly repayment for one loan.
4.  Extend the calculation engine to multiple loans.
5.  Implement and test avalanche and snowball allocation.

Do not begin with visual polish before the calculation model is
validated.

## 16. MVP Acceptance Checklist

### Loan management

-   [ ] Add multiple loans.
-   [ ] Edit a loan.
-   [ ] Delete a loan.
-   [ ] Reject invalid values.
-   [ ] Update total debt correctly.
-   [ ] Update total minimum payment correctly.

### Repayment calculations

-   [ ] Calculate monthly interest under documented assumptions.
-   [ ] Calculate principal and closing balance correctly.
-   [ ] Cap payment at the amount needed to clear a loan.
-   [ ] Identify insufficient payments.
-   [ ] Generate consistent repayment schedules.

### Avalanche and snowball

-   [ ] Avalanche orders by highest interest rate.
-   [ ] Snowball orders by smallest balance.
-   [ ] Apply minimum payments to active loans.
-   [ ] Allocate extra payments by the correct priority.
-   [ ] Redirect payments after a loan is paid off.
-   [ ] Pass independently verified calculation tests.

### Strategy comparison

-   [ ] Display baseline, avalanche, and snowball.
-   [ ] Show total interest.
-   [ ] Show total repayment.
-   [ ] Show payoff duration.
-   [ ] Calculate savings only when a valid baseline exists.

### Refinancing

-   [ ] Enter hypothetical rate and term.
-   [ ] Include fees transparently.
-   [ ] Calculate monthly payment.
-   [ ] Compare total cost.
-   [ ] Avoid presenting a longer term as automatically better.
-   [ ] Display federal-loan warning where relevant.
-   [ ] Label results as estimates.

### Product readiness

-   [ ] Complete the main user journey.
-   [ ] Usable mobile layout.
-   [ ] Empty and error states handled.
-   [ ] User can clear data.
-   [ ] Calculation tests pass.
-   [ ] Deployed application is accessible.

## 17. Future Opportunities (Not MVP Commitments)

Potential future features: - Verified lender directory. - Lender API
integrations. - Real lender quote comparisons. - User accounts and saved
plans. - Secure loan statement import. - Additional repayment
scenarios. - Variable-rate modelling. - More detailed loan-type
support. - Educational repayment content. - Referral partnerships,
subject to legal and compliance review.

These features must not enter the MVP without a separate scope decision.

## 18. Final Product Definition

The MVP is a responsive web application that allows a borrower to
manually enter multiple student loans, understand combined debt, compare
minimum-payment, avalanche, and snowball repayment scenarios, and
evaluate a manually entered hypothetical refinancing offer.

The MVP succeeds when the complete journey works, financial calculations
are independently tested, assumptions are visible, and the product can
be demonstrated through a deployed application.

**The repayment engine is the core product. The dashboard and
refinancing comparison make that engine useful and understandable.**

No live lender marketplace, account aggregation, underwriting, or
automated financial advice is required for the first release.
