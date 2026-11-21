# Student Loan Refinancing & Accelerated Payoff Planner (MVP)

A modern, responsive fintech web application designed to help student loan borrowers master their debt, evaluate accelerated payoff strategies (Debt Avalanche vs. Debt Snowball), and stress-test hypothetical refinancing offers with currency amounts rounded to cents.

---

## 1. Problem Statement & Overview

Borrowers with multiple student loans often struggle to understand how balances, interest rates, minimum payments, and extra payments interact. They frequently face two critical dilemmas:
1. **Accelerated Repayment Strategy:** Should they pay off the highest-interest loan first (**Debt Avalanche**) to save the most money, or target the smallest balance first (**Debt Snowball**) for psychological momentum?
2. **Refinancing Trade-Offs:** Does an advertised refinancing offer with a lower monthly payment actually save money, or does stretching the term out over 10 or 15 years increase total lifetime interest? Furthermore, does refinancing federal loans into a private loan forfeit crucial protections?

The **Student Loan Refinancing & Accelerated Payoff Planner** solves this by providing:
- Unified loan entry with automatic balance-weighted rate calculation.
- Month-by-month deterministic simulation of both Avalanche and Snowball strategies with realistic payment rollover.
- Clear comparison against a minimum-payment baseline.
- Objective evaluation of hypothetical refinancing offers (incorporating fees and term elongation risks).
- Prominent disclaimers regarding the permanent forfeiture of federal loan protections.

---

## 2. Key Features

### 🏛️ Loan Portfolio Management
- **Manual Loan Entry:** Add, edit, and delete multiple student loans.
- **Classification:** Distinguish between **Federal**, **Private**, or **Unknown** loans.
- **Input Validation:** Enforces positive balances, non-negative interest rates, and required minimums.
- **Sufficiency Alert:** Instantly detects non-amortizing loans where the minimum payment cannot cover monthly interest.
- **Sample Dataset Loader:** One-click pre-fill with realistic student loans for instant demonstration.

### ⚡ Repayment Strategy Engine
- **Baseline Scenario:** Models independent minimum payments with no rollover.
- **Debt Avalanche:** Prioritizes highest interest rates first (tie-break: smaller balance). Mathematically minimizes total interest.
- **Debt Snowball:** Prioritizes smallest balances first (tie-break: higher rate). Accelerates account closures.
- **Intra-Month Payment Rollover:** When a loan is paid off, remaining payment capacity rolls over within that same month and into future months.
- **Interactive Budget Slider:** Adjust extra monthly payment dynamically and see real-time updates.

### 📊 Financial Visualizations & Schedules
- **Balance-Over-Time Chart:** Interactive Recharts curves comparing Baseline, Avalanche, and Snowball.
- **Expandable Month-by-Month Schedule:** Drill down into monthly interest charged, principal paid, applied payment, and closing balance per loan.

### 🔄 Hypothetical Refinancing Evaluator
- **Custom Loan Terms:** Enter proposed interest rate, term length (years or months), and closing fees.
- **Transparent Fee Treatment:** Compare fees paid upfront out-of-pocket vs. financed into the loan balance.
- **Cash Flow vs. Total Cost:** Explicitly shows when lower monthly payments mask higher lifetime interest costs.
- **Break-Even Analysis:** Calculates the timeline required to recoup upfront origination fees.
- **Federal Protection Warning:** Prominently warns borrowers about forfeiting IDR/SAVE, PSLF, and federal forbearance.

### 🔒 Client-Side Persistence & Privacy
- **Zero Registration:** Usable instantly with no login or account creation.
- **Local Storage:** Loans persist locally on the user's browser with a one-click "Reset Data" option.

---

## 3. Technology Stack

- **Frontend:**
  - React 18
  - TypeScript
  - Vite
  - Tailwind CSS
  - Lucide React (Fintech iconography)
  - Recharts (Interactive financial charts)
- **Backend:**
  - Python 3.14
  - FastAPI
  - Pydantic v2 (Strict data schemas)
  - Uvicorn (ASGI server)
- **Financial Calculation Engine:**
  - Python `decimal.Decimal` with 2-decimal quantized cent precision (`ROUND_HALF_UP`).
  - Isolated client-side mirror for zero-latency slider interactions and offline resilience.
- **Testing:**
  - Pytest (33 test cases covering repayment, refinance, validation, API behavior, and financial edge cases).

---

## 4. Project Structure

```text
student-loan-planner/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI application & CORS
│   │   ├── schemas.py               # Request & Response schemas
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── endpoints.py         # REST routes
│   │   └── calculations/
│   │       ├── __init__.py
│   │       ├── models.py            # Financial domain models
│   │       ├── repayment.py         # Amortization, Avalanche, Snowball
│   │       └── refinancing.py       # Refinancing & break-even logic
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_repayment.py        # Repayment unit tests
│   │   ├── test_refinancing.py      # Refinancing unit tests
│   │   ├── test_edge_cases.py       # Edge cases & tie-breaks
│   │   └── test_api.py              # API endpoint tests
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx           # Brand, nav, reset, status
│   │   │   ├── Footer.tsx           # Disclaimers & notices
│   │   │   ├── DisclaimerBanner.tsx # Top disclaimer bar
│   │   │   ├── LoanCard.tsx         # Individual loan cards
│   │   │   ├── LoanModal.tsx        # Add/Edit modal with validation
│   │   │   ├── StrategyCard.tsx     # Strategy summary comparison
│   │   │   ├── RepaymentChart.tsx   # Recharts balance curves
│   │   │   └── ScheduleTable.tsx    # Expandable amortization table
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx      # Overview, education, CTAs
│   │   │   ├── LoanEntryPage.tsx    # Manage loan portfolio
│   │   │   ├── DashboardPage.tsx    # Overview metrics & extra slider
│   │   │   ├── StrategyComparisonPage.tsx # 3-way strategy comparison
│   │   │   └── RefinancingPage.tsx  # Hypothetical refinancing
│   │   ├── services/
│   │   │   ├── api.ts               # Backend API client with fallback
│   │   │   └── calculationEngine.ts # High-fidelity client engine
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript definitions
│   │   ├── utils/
│   │   │   ├── formatters.ts        # Currency, percent, duration
│   │   │   └── sampleData.ts        # Realistic demo loan portfolio
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── docs/
│   ├── assumptions.md               # Complete financial formulas
│   └── technical-notes.md           # Architecture & test documentation
│
├── Student_Loan_Refinancing_MVP_PRD.md # Master Product Requirements
├── pytest.ini
└── README.md
```

---

## 5. Getting Started (Local Development)

### Prerequisites
- Node.js (v18+) & npm
- Python (v3.10+) & pip

---

### Step 1: Start the Python Backend API

```powershell
# In project root
python -m pip install -r backend/requirements.txt

# Start FastAPI server on port 8000
python -m uvicorn app.main:app --app-dir backend --reload --port 8000
```

The API will be accessible at:
- API Base: `http://127.0.0.1:8000`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/api/health`

---

### Step 2: Start the React Frontend

Open a second terminal window:

```powershell
cd frontend
npm install
npm run dev
```

The frontend application will start at: `http://localhost:3000`

---

## 6. Running Financial Calculation Tests

Run the complete Pytest suite from the project root:

```powershell
python -m pytest -v
```

The current suite contains 33 test cases. The exact test names and results are printed by pytest;
do not rely on a copied output transcript.

To build and verify the frontend TypeScript bundle:

```powershell
cd frontend
npm run build
```

---

## 7. Deployment Instructions

### Frontend (Vercel)
1. Push this repository to GitHub or GitLab.
2. In the Vercel dashboard, click **Add New Project** and select the repository.
3. Configure the project settings:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. (Optional) If deploying with a live backend, set the environment variable:
   `VITE_API_URL=https://your-backend-api-url`
5. Click **Deploy**.
*(Note: If deployed without a backend, the frontend uses its built-in fallback engine. Deploy the FastAPI service when decimal-safe server calculations are required.)* 

### Backend (Render, Railway, or VPS)
1. Deploy `backend/` as a Python web service.
2. Start Command:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
3. Set `CORS_ORIGINS` to the exact deployed frontend origin or origins, for example `https://your-project.vercel.app`.

---

## 8. Financial Disclaimers

- **Educational Tool Only:** All calculations are hypothetical estimates and do not represent guaranteed terms, lender loan offers, or credit underwriting.
- **No Financial Advice:** This software does not provide financial, legal, investment, or tax advice.
- **Federal Student Loans:** Refinancing federal student loans into a private loan permanently eliminates federal protections, including Income-Driven Repayment (IDR), Public Service Loan Forgiveness (PSLF), and federal forbearance.
