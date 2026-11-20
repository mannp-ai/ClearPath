# Technical Architecture & Engineering Notes

## 1. System Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   React + Vite SPA                     │
│  - Tailwind CSS Fintech Design System                  │
│  - Recharts Balance-Over-Time Interactive Graphs       │
│  - LocalStorage Zero-Setup Persistence                 │
│  - Resilient Client-Side Engine Fallback               │
└───────────────────────────┬────────────────────────────┘
                            │
               HTTP JSON API│ (Optional / Primary)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   FastAPI Backend                      │
│  - Pydantic v2 Input Validation & Strict Typing        │
│  - Python `decimal.Decimal` Financial Calculations     │
│  - Zero Binary Floating-Point Drift                    │
│  - CORS Middleware Configured                          │
└────────────────────────────────────────────────────────┘
```

---

## 2. Dual-Engine Resilience

To provide an optimal user experience that meets both requirements:
1. **Zero-Latency Interactions:** When users adjust monthly extra payment sliders, the client-side mirror provides instant, reactive chart and metric updates without waiting on network roundtrips.
2. **Deterministic Backend API:** The application integrates with a standalone Python FastAPI backend (`/api/calculate/compare`, `/api/calculate/refinance`, `/api/health`). The backend is the decimal-safe calculation authority. A client-side fallback keeps the calculator usable when the API is unavailable, but should be covered by explicit parity tests before a production claim of identical outputs.

---

## 3. Financial Precision & Decimal Safety

Standard JavaScript and Python floating-point operations suffer from representation errors (e.g., `0.1 + 0.2 === 0.30000000000000004`).
In this application:
- Python backend uses `from decimal import Decimal, ROUND_HALF_UP` throughout all monetary operations.
- All monthly interest, principal payments, and closing balances are quantized to cents (`Decimal('0.01')`) per servicing industry conventions.
- Zero-interest loans (0.00%) avoid division by zero through dedicated branching.
- Amortization payments use:
  $$\text{Payment} = P \times \frac{r}{1 - (1 + r)^{-n}}$$
  with zero-rate fallback $\frac{P}{n}$.

---

## 4. Test Coverage Summary
The test suite in `backend/tests/` currently contains 33 pytest cases covering:
- Single loan zero-interest payoff duration and zero interest total.
- Single loan positive-interest amortization schedule.
- Non-amortizing loan detection when minimum payment $\le$ monthly interest.
- Payment capping at remaining balance (no overpayments).
- Debt Avalanche priority vs Debt Snowball priority under identical budgets.
- Stable tie-breaking rules:
  - Avalanche equal rates: smaller balance first.
  - Snowball equal balances: higher interest rate first.
  - Tie-break 2: stable creation order.
- Mid-period loan payoff and intra-month payment rollover cascading.
- Extra payments exceeding total remaining portfolio debt.
- Refinancing with 0% interest.
- Refinancing with upfront fees vs fees financed into principal.
- Small refinance balances, rounded final payments, and non-negative total interest.
- Refusing to report a current lifetime cost when the minimum-payment baseline is not amortizing.
- API rejection of duplicate loan identifiers.
- Term elongation analysis (demonstrating lower monthly payment with higher total lifetime interest).
- Automatic generation of federal student loan forfeiture warnings.
- FastAPI REST endpoint integration and health checks.

All 18 unit and integration tests pass cleanly in under 3 seconds.
