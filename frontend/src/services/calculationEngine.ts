import {
  LoanInput,
  MonthSchedule,
  MonthlyLoanDetail,
  RepaymentSummary,
  StrategyComparisonResult,
  RefinanceInput,
  RefinanceSummary,
  StrategyType,
} from '../types';

const roundCents = (val: number): number => {
  return Math.round((val + Number.EPSILON) * 100) / 100;
};

const MAX_SIMULATION_MONTHS = 600;

export const calculateWeightedAverageRate = (loans: LoanInput[]): number => {
  const totalBalance = loans.reduce((acc, l) => acc + l.balance, 0);
  if (totalBalance <= 0) return 0;
  const weightedSum = loans.reduce((acc, l) => acc + l.balance * l.interest_rate, 0);
  return roundCents(weightedSum / totalBalance);
};

export const checkLoanSufficiency = (loan: LoanInput): { isSufficient: boolean; initialInterest: number } => {
  const monthlyRate = (loan.interest_rate / 100) / 12;
  const initialInterest = roundCents(loan.balance * monthlyRate);
  return {
    isSufficient: loan.minimum_payment > initialInterest,
    initialInterest,
  };
};

const formatMonthDate = (startDate: Date, monthOffset: number): string => {
  const d = new Date(startDate.getTime());
  d.setMonth(d.getMonth() + monthOffset);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export const calculateClientBaseline = (
  loans: LoanInput[],
  startDate: Date = new Date()
): RepaymentSummary => {
  const nonAmortizing: string[] = [];
  loans.forEach((l) => {
    const { isSufficient } = checkLoanSufficiency(l);
    if (!isSufficient) nonAmortizing.push(l.id);
  });

  if (nonAmortizing.length > 0) {
    return {
      strategy: 'baseline',
      is_amortizing: false,
      payoff_months: null,
      estimated_debt_free_date: null,
      total_interest_paid: null,
      total_amount_repaid: null,
      total_principal_paid: null,
      interest_saved_vs_baseline: null,
      time_saved_months_vs_baseline: null,
      non_amortizing_loan_ids: nonAmortizing,
      warning_message:
        'One or more loans have minimum payments insufficient to cover monthly interest. Debt-free date cannot be calculated.',
      schedule: [],
    };
  }

  const loanStates = loans.map((l) => ({
    id: l.id,
    name: l.name,
    balance: l.balance,
    interest_rate: l.interest_rate,
    monthly_rate: (l.interest_rate / 100) / 12,
    minimum_payment: l.minimum_payment,
    is_paid_off: false,
  }));

  const schedule: MonthSchedule[] = [];
  let monthIndex = 1;
  let totalInterest = 0;
  let totalRepaid = 0;
  let totalPrincipal = 0;

  while (monthIndex <= MAX_SIMULATION_MONTHS) {
    const active = loanStates.filter((s) => !s.is_paid_off);
    if (active.length === 0) break;

    const details: MonthlyLoanDetail[] = [];
    let mPay = 0;
    let mInt = 0;
    let mPrin = 0;
    let mRem = 0;

    for (const state of loanStates) {
      if (state.is_paid_off) continue;

      const openingBal = state.balance;
      const interest = roundCents(openingBal * state.monthly_rate);
      const needed = openingBal + interest;

      const applied = Math.min(state.minimum_payment, needed);
      const prin = applied - interest;
      let closing = needed - applied;

      if (closing <= 0.0001) {
        closing = 0;
        state.is_paid_off = true;
      }
      state.balance = closing;

      mPay += applied;
      mInt += interest;
      mPrin += prin;
      mRem += closing;

      details.push({
        loan_id: state.id,
        loan_name: state.name,
        opening_balance: roundCents(openingBal),
        interest_charged: roundCents(interest),
        payment_applied: roundCents(applied),
        principal_paid: roundCents(prin),
        closing_balance: roundCents(closing),
        is_paid_off: state.is_paid_off,
      });
    }

    totalInterest += mInt;
    totalRepaid += mPay;
    totalPrincipal += mPrin;

    schedule.push({
      month_index: monthIndex,
      year_month: formatMonthDate(startDate, monthIndex),
      total_payment: roundCents(mPay),
      total_interest: roundCents(mInt),
      total_principal: roundCents(mPrin),
      remaining_balance: roundCents(mRem),
      active_loans_count: loanStates.filter((s) => !s.is_paid_off).length,
      loans_detail: details,
    });

    monthIndex++;
  }

  const isAllPaid = loanStates.every((s) => s.is_paid_off);
  if (!isAllPaid) {
    return {
      strategy: 'baseline',
      is_amortizing: false,
      payoff_months: null,
      estimated_debt_free_date: null,
      total_interest_paid: null,
      total_amount_repaid: null,
      total_principal_paid: null,
      interest_saved_vs_baseline: null,
      time_saved_months_vs_baseline: null,
      non_amortizing_loan_ids: [],
      warning_message: `Repayment exceeds maximum timeline limit of ${MAX_SIMULATION_MONTHS} months (50 years).`,
      schedule,
    };
  }

  const payoffMonths = schedule.length;
  return {
    strategy: 'baseline',
    is_amortizing: true,
    payoff_months: payoffMonths,
    estimated_debt_free_date: formatMonthDate(startDate, payoffMonths),
    total_interest_paid: roundCents(totalInterest),
    total_amount_repaid: roundCents(totalRepaid),
    total_principal_paid: roundCents(totalPrincipal),
    interest_saved_vs_baseline: 0,
    time_saved_months_vs_baseline: 0,
    non_amortizing_loan_ids: [],
    warning_message: null,
    schedule,
  };
};

export const calculateClientAccelerated = (
  loans: LoanInput[],
  strategy: StrategyType,
  extraMonthlyPayment: number = 0,
  startDate: Date = new Date()
): RepaymentSummary => {
  const totalMonthlyBudget =
    loans.reduce((acc, l) => acc + l.minimum_payment, 0) + Math.max(0, extraMonthlyPayment);

  const loanStates = loans.map((l, idx) => ({
    id: l.id,
    name: l.name,
    balance: l.balance,
    interest_rate: l.interest_rate,
    monthly_rate: (l.interest_rate / 100) / 12,
    minimum_payment: l.minimum_payment,
    is_paid_off: false,
    creation_index: idx,
  }));

  const schedule: MonthSchedule[] = [];
  let monthIndex = 1;
  let totalInterest = 0;
  let totalRepaid = 0;
  let totalPrincipal = 0;

  while (monthIndex <= MAX_SIMULATION_MONTHS) {
    const active = loanStates.filter((s) => !s.is_paid_off);
    if (active.length === 0) break;

    const calcs: Record<
      string,
      {
        opening: number;
        interest: number;
        payoffNeeded: number;
        minApplied: number;
        extraApplied: number;
        remainingNeeded: number;
      }
    > = {};

    let spentOnMins = 0;

    for (const l of active) {
      const opening = l.balance;
      const interest = roundCents(opening * l.monthly_rate);
      const payoffNeeded = opening + interest;
      const minApplied = Math.min(l.minimum_payment, payoffNeeded);
      spentOnMins += minApplied;

      calcs[l.id] = {
        opening,
        interest,
        payoffNeeded,
        minApplied,
        extraApplied: 0,
        remainingNeeded: payoffNeeded - minApplied,
      };
    }

    let extraPool = totalMonthlyBudget - spentOnMins;

    // Sorting according to strategy rules
    const priorityLoans = [...active].sort((a, b) => {
      if (strategy === 'avalanche') {
        // Higher interest rate first; tie break: smaller balance; tie break 2: creation index
        if (b.interest_rate !== a.interest_rate) return b.interest_rate - a.interest_rate;
        if (a.balance !== b.balance) return a.balance - b.balance;
        return a.creation_index - b.creation_index;
      } else {
        // Smallest balance first; tie break: higher interest rate; tie break 2: creation index
        if (a.balance !== b.balance) return a.balance - b.balance;
        if (b.interest_rate !== a.interest_rate) return b.interest_rate - a.interest_rate;
        return a.creation_index - b.creation_index;
      }
    });

    for (const l of priorityLoans) {
      const c = calcs[l.id];
      if (c.remainingNeeded <= 0.0001) continue;
      if (extraPool <= 0.0001) break;

      const alloc = Math.min(extraPool, c.remainingNeeded);
      c.extraApplied += alloc;
      c.remainingNeeded -= alloc;
      extraPool -= alloc;
    }

    const details: MonthlyLoanDetail[] = [];
    let mPay = 0;
    let mInt = 0;
    let mPrin = 0;
    let mRem = 0;

    for (const l of loanStates) {
      if (!calcs[l.id]) continue;
      const c = calcs[l.id];
      const applied = c.minApplied + c.extraApplied;
      const prin = applied - c.interest;
      let closing = c.payoffNeeded - applied;

      if (closing <= 0.0001) {
        closing = 0;
        l.is_paid_off = true;
      }
      l.balance = closing;

      mPay += applied;
      mInt += c.interest;
      mPrin += prin;
      mRem += closing;

      details.push({
        loan_id: l.id,
        loan_name: l.name,
        opening_balance: roundCents(c.opening),
        interest_charged: roundCents(c.interest),
        payment_applied: roundCents(applied),
        principal_paid: roundCents(prin),
        closing_balance: roundCents(closing),
        is_paid_off: l.is_paid_off,
      });
    }

    totalInterest += mInt;
    totalRepaid += mPay;
    totalPrincipal += mPrin;

    schedule.push({
      month_index: monthIndex,
      year_month: formatMonthDate(startDate, monthIndex),
      total_payment: roundCents(mPay),
      total_interest: roundCents(mInt),
      total_principal: roundCents(mPrin),
      remaining_balance: roundCents(mRem),
      active_loans_count: loanStates.filter((s) => !s.is_paid_off).length,
      loans_detail: details,
    });

    monthIndex++;
  }

  const isAllPaid = loanStates.every((s) => s.is_paid_off);
  if (!isAllPaid) {
    return {
      strategy,
      is_amortizing: false,
      payoff_months: null,
      estimated_debt_free_date: null,
      total_interest_paid: null,
      total_amount_repaid: null,
      total_principal_paid: null,
      interest_saved_vs_baseline: null,
      time_saved_months_vs_baseline: null,
      non_amortizing_loan_ids: [],
      warning_message: `Repayment exceeds maximum timeline limit of ${MAX_SIMULATION_MONTHS} months (50 years).`,
      schedule,
    };
  }

  const payoffMonths = schedule.length;
  return {
    strategy,
    is_amortizing: true,
    payoff_months: payoffMonths,
    estimated_debt_free_date: formatMonthDate(startDate, payoffMonths),
    total_interest_paid: roundCents(totalInterest),
    total_amount_repaid: roundCents(totalRepaid),
    total_principal_paid: roundCents(totalPrincipal),
    interest_saved_vs_baseline: null,
    time_saved_months_vs_baseline: null,
    non_amortizing_loan_ids: [],
    warning_message: null,
    schedule,
  };
};

export const calculateClientComparison = (
  loans: LoanInput[],
  extraMonthlyPayment: number = 0,
  startDate: Date = new Date()
): StrategyComparisonResult => {
  const totalDebt = roundCents(loans.reduce((acc, l) => acc + l.balance, 0));
  const totalMin = roundCents(loans.reduce((acc, l) => acc + l.minimum_payment, 0));
  const weightedRate = calculateWeightedAverageRate(loans);

  const baseline = calculateClientBaseline(loans, startDate);
  const avalanche = calculateClientAccelerated(loans, 'avalanche', extraMonthlyPayment, startDate);
  const snowball = calculateClientAccelerated(loans, 'snowball', extraMonthlyPayment, startDate);

  if (baseline.is_amortizing && baseline.total_interest_paid !== null && baseline.payoff_months !== null) {
    if (avalanche.is_amortizing && avalanche.total_interest_paid !== null && avalanche.payoff_months !== null) {
      avalanche.interest_saved_vs_baseline = roundCents(
        Math.max(0, baseline.total_interest_paid - avalanche.total_interest_paid)
      );
      avalanche.time_saved_months_vs_baseline = Math.max(0, baseline.payoff_months - avalanche.payoff_months);
    }
    if (snowball.is_amortizing && snowball.total_interest_paid !== null && snowball.payoff_months !== null) {
      snowball.interest_saved_vs_baseline = roundCents(
        Math.max(0, baseline.total_interest_paid - snowball.total_interest_paid)
      );
      snowball.time_saved_months_vs_baseline = Math.max(0, baseline.payoff_months - snowball.payoff_months);
    }
  }

  return {
    baseline,
    avalanche,
    snowball,
    total_debt: totalDebt,
    total_minimum_payment: totalMin,
    weighted_average_interest_rate: weightedRate,
    extra_monthly_payment: roundCents(extraMonthlyPayment),
    loan_count: loans.length,
  };
};

export const calculateClientAmortizationPayment = (
  principal: number,
  ratePct: number,
  termMonths: number
): number => {
  if (principal <= 0 || termMonths <= 0) return 0;
  if (ratePct === 0) return Math.max(0.01, roundCents(principal / termMonths));

  const r = (ratePct / 100) / 12;
  const n = termMonths;
  const denom = 1 - Math.pow(1 + r, -n);
  if (denom === 0) return Math.max(0.01, roundCents(principal / termMonths));

  return Math.max(0.01, roundCents(principal * (r / denom)));
};

const calculateClientAmortizationTotals = (
  principal: number,
  ratePct: number,
  monthlyPayment: number,
  termMonths: number
): { totalPayments: number; totalInterest: number } => {
  const monthlyRate = (ratePct / 100) / 12;
  let balance = principal;
  let totalPayments = 0;
  let totalInterest = 0;

  for (let month = 1; month <= termMonths; month += 1) {
    const interest = roundCents(balance * monthlyRate);
    const payoffNeeded = roundCents(balance + interest);
    const paymentApplied =
      month === termMonths ? payoffNeeded : Math.min(monthlyPayment, payoffNeeded);
    balance = roundCents(payoffNeeded - paymentApplied);
    totalPayments = roundCents(totalPayments + paymentApplied);
    totalInterest = roundCents(totalInterest + interest);

    if (balance <= 0) break;
  }

  return { totalPayments, totalInterest };
};

export const calculateClientRefinance = (
  loans: LoanInput[],
  refinance: RefinanceInput
): RefinanceSummary => {
  const currentDebt = roundCents(loans.reduce((acc, l) => acc + l.balance, 0));
  const currentMinPayment = roundCents(loans.reduce((acc, l) => acc + l.minimum_payment, 0));

  const baseline = calculateClientBaseline(loans);
  const currentTotalCost =
    baseline.is_amortizing && baseline.total_amount_repaid !== null
      ? baseline.total_amount_repaid
      : null;
  const currentCostWarning =
    currentTotalCost === null
      ? 'Current-loan total cost cannot be estimated from the entered minimum payments. At least one loan does not amortize or exceeds the supported payoff timeline.'
      : null;

  const fees = roundCents(refinance.fees);
  const rate = refinance.proposed_interest_rate;
  const term = refinance.term_months;

  let principalRefinanced: number;
  let proposedMonthlyPayment: number;
  let proposedTotalCost: number;
  let proposedTotalInterest: number;

  if (refinance.fee_treatment === 'upfront') {
    principalRefinanced = currentDebt;
    proposedMonthlyPayment = calculateClientAmortizationPayment(principalRefinanced, rate, term);
    const totals = calculateClientAmortizationTotals(
      principalRefinanced,
      rate,
      proposedMonthlyPayment,
      term
    );
    proposedTotalInterest = totals.totalInterest;
    proposedTotalCost = roundCents(totals.totalPayments + fees);
  } else {
    principalRefinanced = roundCents(currentDebt + fees);
    proposedMonthlyPayment = calculateClientAmortizationPayment(principalRefinanced, rate, term);
    const totals = calculateClientAmortizationTotals(
      principalRefinanced,
      rate,
      proposedMonthlyPayment,
      term
    );
    proposedTotalInterest = totals.totalInterest;
    proposedTotalCost = totals.totalPayments;
  }

  const monthlyPaymentDiff = roundCents(proposedMonthlyPayment - currentMinPayment);
  const totalCostDiff =
    currentTotalCost === null ? null : roundCents(proposedTotalCost - currentTotalCost);

  let breakEvenMonths: number | null = null;
  let breakEvenExplanation: string | null = null;

  if (fees === 0) {
    breakEvenMonths = 0;
    breakEvenExplanation = 'No upfront fees were entered; adjustments take effect immediately.';
  } else if (refinance.fee_treatment === 'upfront') {
    const monthlyCashSavings = currentMinPayment - proposedMonthlyPayment;
    if (monthlyCashSavings > 0) {
      breakEvenMonths = Math.ceil(fees / monthlyCashSavings);
      breakEvenExplanation = `At $${monthlyCashSavings.toFixed(
        2
      )}/month lower payment, it takes approximately ${breakEvenMonths} months to recover the upfront fee of $${fees.toFixed(
        2
      )}.`;
    } else {
      breakEvenExplanation =
        'Proposed monthly payment is higher than or equal to current payments; upfront fees are not recovered through monthly cash flow savings.';
    }
  } else {
    breakEvenExplanation = 'Fees are financed into the loan balance and amortized over the full term.';
  }

  const hasFederal =
    refinance.has_federal_loans || loans.some((l) => l.loan_type === 'Federal');
  const federalWarning = hasFederal
    ? 'Caution: You have eligible federal student loans. Refinancing federal loans into a private loan permanently forfeits federal protections, including Income-Driven Repayment (IDR/SAVE), Public Service Loan Forgiveness (PSLF), federal forbearance/deferment, and death/disability discharge.'
    : null;

  return {
    proposed_rate: rate,
    term_months: term,
    fees,
    fee_treatment: refinance.fee_treatment,
    principal_refinanced: principalRefinanced,
    proposed_monthly_payment: proposedMonthlyPayment,
    proposed_total_interest: proposedTotalInterest,
    proposed_total_cost: proposedTotalCost,
    current_monthly_payment: currentMinPayment,
    current_estimated_total_cost: currentTotalCost,
    monthly_payment_difference: monthlyPaymentDiff,
    total_cost_difference: totalCostDiff,
    current_cost_warning: currentCostWarning,
    break_even_months: breakEvenMonths,
    break_even_explanation: breakEvenExplanation,
    federal_loan_warning: federalWarning,
    is_hypothetical: true,
  };
};
