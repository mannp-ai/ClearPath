# Financial Calculation Assumptions & Rules

## 1. Overview
The **Student Loan Refinancing & Accelerated Payoff Planner** uses deterministic, decimal-safe financial calculations in the Python backend. This document details the exact mathematical formulas, timing conventions, and rules used by the authoritative server calculation engine.

---

## 2. Compounding & Interest Calculation Assumptions

- **Calculation Period:** Monthly compounding.
- **Monthly Nominal Rate:**
  $$\text{monthly\_rate} = \frac{\text{annual\_interest\_rate}}{12}$$
  Where `annual_interest_rate` is the decimal fraction (e.g. 6.5% = 0.065).
- **Monthly Interest Charged:**
  $$\text{monthly\_interest} = \text{opening\_balance} \times \text{monthly\_rate}$$
  Monthly interest is rounded to the nearest cent ($0.01) using standard round-half-up.
- **Payment Application Timing:** Payments and extra contributions are assumed to occur at the end of each monthly period.
- **Zero-Interest Loans:** If an annual interest rate is 0.00%, monthly interest is $0.00, and 100% of the applied payment is allocated toward principal.

---

## 3. Repayment Mechanics & Payment Application

For each loan in month $m$:
1. $\text{payoff\_needed} = \text{opening\_balance} + \text{monthly\_interest}$
2. $\text{payment\_applied} = \min(\text{payment\_allocated}, \text{payoff\_needed})$
3. $\text{principal\_paid} = \text{payment\_applied} - \text{monthly\_interest}$
4. $\text{closing\_balance} = \max(0, \text{payoff\_needed} - \text{payment\_applied})$

### Payment Cap (No Overpayment)
Under no circumstance does a loan receive more payment than its $\text{payoff\_needed}$. If an allocated payment exceeds the remaining balance plus interest, the payment is capped, and the unused amount is preserved and rolled over to other active loans in priority order.

---

## 4. Payment Sufficiency & Non-Amortizing Loans

A loan is identified as **non-amortizing** if:
$$\text{minimum\_payment} \le \text{opening\_balance} \times \text{monthly\_rate}$$
Under this condition:
- The payment does not cover monthly interest, causing negative or zero amortization.
- The system flags the loan with an explicit warning banner.
- The system **does not display a fabricated debt-free date**.

---

## 5. Strategy Prioritization & Tie-Breaking Rules

The monthly budget is defined as:
$$\text{total\_monthly\_budget} = \sum \text{minimum\_payments} + \text{extra\_monthly\_payment}$$

Each month:
1. Every active loan receives its scheduled minimum payment (capped at payoff amount).
2. The remaining unallocated funds form the **extra allocation pool**.
3. The extra pool is directed to the highest priority active loan according to the strategy rules:

### 5.1 Debt Avalanche
1. **Primary Sort:** Highest annual interest rate descending.
2. **Tie-Break 1:** Smallest outstanding balance ascending.
3. **Tie-Break 2:** Stable creation order.

*Objective:* Minimizes total lifetime interest paid and provides the mathematically fastest debt-free date.

### 5.2 Debt Snowball
1. **Primary Sort:** Smallest outstanding balance ascending.
2. **Tie-Break 1:** Highest annual interest rate descending.
3. **Tie-Break 2:** Stable creation order.

*Objective:* Maximizes psychological momentum by completely eliminating individual loan accounts early.

---

## 6. Payment Rollover (The Snowball / Avalanche Effect)

When an active loan is paid off (either mid-month or over time):
- Its former minimum payment is **not lost or removed from the budget**.
- The newly freed funds immediately roll into the extra allocation pool for the same and subsequent months.
- Leftover funds that clear a priority loan mid-month cascade immediately to the next priority loan within that same monthly period.

---

## 7. Refinancing Amortization & Fee Treatment

### 7.1 Monthly Payment Formula
For a fixed-rate loan with principal $P$, monthly rate $r = \frac{\text{proposed\_rate}}{12}$, and term $n$ months:
$$\text{Payment} = P \times \frac{r}{1 - (1 + r)^{-n}}$$
If $r = 0$:
$$\text{Payment} = \frac{P}{n}$$

### 7.2 Fee Treatment
- **Upfront Fees:**
  - $P = \text{total current debt}$
  - Fees are added to the sum of the scheduled refinance payments.
- **Financed Fees:**
  - $P = \text{total current debt} + \text{Fees}$
  - Fees are included in principal and accrue interest.

The regular payment is rounded to cents. Monthly interest is then rounded to cents and the final
payment is adjusted to clear the remaining balance within the selected term. Total refinance cost
is the sum of those payments (plus any upfront fee), rather than the rounded regular payment
multiplied by the term. This avoids negative interest or a reported cost below principal for very
small balances.

If the current minimum-payment baseline is non-amortizing or exceeds the supported simulation
timeline, its total cost and the refinance total-cost difference are unavailable. Principal alone
is not treated as the current lifetime cost.

### 7.3 Break-Even Methodology
If upfront fees $> 0$ and proposed monthly payment $<$ current monthly payment:
$$\text{Break-Even Months} = \left\lceil \frac{\text{Upfront Fees}}{\text{Current Payment} - \text{Proposed Payment}} \right\rceil$$

---

## 8. Federal Loan Protections Notice
Refinancing federal loans into a private loan permanently eliminates access to:
- Income-Driven Repayment (IDR / SAVE / PAYE)
- Public Service Loan Forgiveness (PSLF)
- Federal forbearance and administrative deferment
- Total and Permanent Disability (TPD) discharge
