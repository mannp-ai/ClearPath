import Decimal from 'decimal.js';
import { LoanInput, MonthlyLoanDetail, MonthSchedule, RepaymentSummary, StrategyComparisonResult, StrategyType } from '../../types/finance';

Decimal.set({ precision: 50, rounding: Decimal.ROUND_HALF_UP });

const CENT = new Decimal('0.01');
const MAX_SIMULATION_MONTHS = 600;

export function quantizeCurrency(v: Decimal): Decimal {
  return v.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function calculateWeightedAverageRate(loans: LoanInput[]): Decimal {
  const total = loans.reduce((a, l) => a.plus(l.balance), new Decimal(0));
  if (total.lte(0)) return new Decimal(0);
  const w = loans.reduce((a, l) => a.plus(new Decimal(l.balance).times(l.interest_rate)), new Decimal(0));
  return w.div(total).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function checkLoanSufficiency(loan: LoanInput): { sufficient: boolean; interest: Decimal } {
  const monthlyRate = new Decimal(loan.interest_rate).div(100).div(12);
  const interest = quantizeCurrency(new Decimal(loan.balance).times(monthlyRate));
  return { sufficient: new Decimal(loan.minimum_payment).gt(interest), interest };
}

function dateLabel(start: Date, offset: number): string {
  const d = new Date(start);
  d.setMonth(d.getMonth() + offset);
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

export function calculateBaseline(loans: LoanInput[], start: Date = new Date()): RepaymentSummary {
  const nonAmort = loans.filter(l => !checkLoanSufficiency(l).sufficient).map(l => l.id);
  if (nonAmort.length) {
    return { strategy: StrategyType.BASELINE, is_amortizing: false, non_amortizing_loan_ids: nonAmort, warning_message: 'One or more loans have minimum payments insufficient to cover monthly interest. Debt-free date cannot be calculated.', schedule: [] };
  }
  const states: Record<string, any> = {};
  loans.forEach(l => {
    states[l.id] = { name: l.name, balance: new Decimal(l.balance), interest_rate: new Decimal(l.interest_rate), monthly_rate: new Decimal(l.interest_rate).div(100).div(12), minimum_payment: new Decimal(l.minimum_payment), is_paid_off: false };
  });
  const schedule: MonthSchedule[] = [];
  let monthIndex = 1;
  let totalInterest = new Decimal(0);
  let totalAmount = new Decimal(0);
  let totalPrincipal = new Decimal(0);
  while (monthIndex <= MAX_SIMULATION_MONTHS) {
    const active = Object.values(states).filter((s: any) => !s.is_paid_off);
    if (!active.length) break;
    const details: MonthlyLoanDetail[] = [];
    let monthPayment = new Decimal(0);
    let monthInterest = new Decimal(0);
    let monthPrincipal = new Decimal(0);
    let monthRemaining = new Decimal(0);
    for (const id of Object.keys(states)) {
      const state = states[id];
      if (state.is_paid_off) continue;
      const opening = state.balance;
      const interest = quantizeCurrency(opening.times(state.monthly_rate));
      const payoff = opening.plus(interest);
      const payment = Decimal.min(state.minimum_payment, payoff);
      const principal = payment.minus(interest);
      let closing = payoff.minus(payment);
      if (closing.lte(0)) { closing = new Decimal(0); state.is_paid_off = true; }
      state.balance = closing;
      monthPayment = monthPayment.plus(payment);
      monthInterest = monthInterest.plus(interest);
      monthPrincipal = monthPrincipal.plus(principal);
      monthRemaining = monthRemaining.plus(closing);
      details.push({ loan_id: id, loan_name: state.name, opening_balance: opening, interest_charged: interest, payment_applied: payment, principal_paid: principal, closing_balance: closing, is_paid_off: state.is_paid_off });
    }
    totalInterest = totalInterest.plus(monthInterest);
    totalAmount = totalAmount.plus(monthPayment);
    totalPrincipal = totalPrincipal.plus(monthPrincipal);
    const activeCount = Object.values(states).filter((s: any) => !s.is_paid_off).length;
    schedule.push({ month_index: monthIndex, year_month: dateLabel(start, monthIndex), total_payment: quantizeCurrency(monthPayment), total_interest: quantizeCurrency(monthInterest), total_principal: quantizeCurrency(monthPrincipal), remaining_balance: quantizeCurrency(monthRemaining), active_loans_count: activeCount, loans_detail: details });
    monthIndex++;
  }
  if (Object.values(states).some((s: any) => !s.is_paid_off)) {
    return { strategy: StrategyType.BASELINE, is_amortizing: false, warning_message: `Repayment exceeds maximum timeline limit of ${MAX_SIMULATION_MONTHS} months (50 years).`, schedule };
  }
  const payoffMonths = schedule.length;
  return { strategy: StrategyType.BASELINE, is_amortizing: true, payoff_months: payoffMonths, estimated_debt_free_date: dateLabel(start, payoffMonths), total_interest_paid: quantizeCurrency(totalInterest), total_amount_repaid: quantizeCurrency(totalAmount), total_principal_paid: quantizeCurrency(totalPrincipal), interest_saved_vs_baseline: new Decimal(0), time_saved_months_vs_baseline: 0, schedule };
}

export function calculateAccelerated(loans: LoanInput[], strategy: 'avalanche' | 'snowball', extra: Decimal = new Decimal(0), start: Date = new Date()): RepaymentSummary {
  const totalBudget = loans.reduce((a, l) => a.plus(l.minimum_payment), new Decimal(0)).plus(Decimal.max(new Decimal(0), extra));
  const states = loans.map((l, idx) => ({ id: l.id, name: l.name, balance: new Decimal(l.balance), interest_rate: new Decimal(l.interest_rate), monthly_rate: new Decimal(l.interest_rate).div(100).div(12), minimum_payment: new Decimal(l.minimum_payment), is_paid_off: false, creation_index: idx }));
  const schedule: MonthSchedule[] = [];
  let monthIndex = 1;
  let totalInterest = new Decimal(0);
  let totalAmount = new Decimal(0);
  let totalPrincipal = new Decimal(0);
  while (monthIndex <= MAX_SIMULATION_MONTHS) {
    const active = states.filter(s => !s.is_paid_off);
    if (!active.length) break;
    const calcs: Record<string, any> = {};
    let spentMins = new Decimal(0);
    active.forEach(l => {
      const opening = l.balance;
      const interest = quantizeCurrency(opening.times(l.monthly_rate));
      const payoff = opening.plus(interest);
      const minApply = Decimal.min(new Decimal(l.minimum_payment), payoff);
      spentMins = spentMins.plus(minApply);
      calcs[l.id] = { opening_balance: opening, interest, payoff_needed: payoff, min_applied: minApply, extra_applied: new Decimal(0), remaining_needed: payoff.minus(minApply) };
    });
    let extraPool = totalBudget.minus(spentMins);
    const sortKey = (l: any) => {
      if (strategy === 'avalanche') return [l.interest_rate.negated().toNumber(), l.balance.toNumber(), l.creation_index];
      return [l.balance.toNumber(), l.interest_rate.negated().toNumber(), l.creation_index];
    };
    const priority = [...active].sort((a, b) => {
      const ka = sortKey(a); const kb = sortKey(b);
      for (let i = 0; i < ka.length; i++) { if (ka[i] !== kb[i]) return ka[i] - kb[i]; }
      return 0;
    });
    for (const l of priority) {
      const c = calcs[l.id];
      if (c.remaining_needed.lte(0)) continue;
      if (extraPool.lte(0)) break;
      const alloc = Decimal.min(extraPool, c.remaining_needed);
      c.extra_applied = c.extra_applied.plus(alloc);
      c.remaining_needed = c.remaining_needed.minus(alloc);
      extraPool = extraPool.minus(alloc);
    }
    const details: MonthlyLoanDetail[] = [];
    let monthPayment = new Decimal(0);
    let monthInterest = new Decimal(0);
    let monthPrincipal = new Decimal(0);
    let monthRemaining = new Decimal(0);
    states.forEach(l => {
      if (!(l.id in calcs)) return;
      const c = calcs[l.id];
      const totalApplied = c.min_applied.plus(c.extra_applied);
      const principal = totalApplied.minus(c.interest);
      let closing = c.payoff_needed.minus(totalApplied);
      if (closing.lte(0)) { closing = new Decimal(0); l.is_paid_off = true; }
      l.balance = closing;
      monthPayment = monthPayment.plus(totalApplied);
      monthInterest = monthInterest.plus(c.interest);
      monthPrincipal = monthPrincipal.plus(principal);
      monthRemaining = monthRemaining.plus(closing);
      details.push({ loan_id: l.id, loan_name: l.name, opening_balance: c.opening_balance, interest_charged: c.interest, payment_applied: totalApplied, principal_paid: principal, closing_balance: closing, is_paid_off: l.is_paid_off });
    });
    totalInterest = totalInterest.plus(monthInterest);
    totalAmount = totalAmount.plus(monthPayment);
    totalPrincipal = totalPrincipal.plus(monthPrincipal);
    const activeCount = states.filter(s => !s.is_paid_off).length;
    schedule.push({ month_index: monthIndex, year_month: dateLabel(start, monthIndex), total_payment: quantizeCurrency(monthPayment), total_interest: quantizeCurrency(monthInterest), total_principal: quantizeCurrency(monthPrincipal), remaining_balance: quantizeCurrency(monthRemaining), active_loans_count: activeCount, loans_detail: details });
    monthIndex++;
  }
  if (states.some(s => !s.is_paid_off)) {
    return { strategy: strategy === 'avalanche' ? StrategyType.AVALANCHE : StrategyType.SNOWBALL, is_amortizing: false, warning_message: `Repayment exceeds maximum timeline limit of ${MAX_SIMULATION_MONTHS} months (50 years).`, schedule };
  }
  const payoffMonths = schedule.length;
  const st = strategy === 'avalanche' ? StrategyType.AVALANCHE : StrategyType.SNOWBALL;
  return { strategy: st, is_amortizing: true, payoff_months: payoffMonths, estimated_debt_free_date: dateLabel(start, payoffMonths), total_interest_paid: quantizeCurrency(totalInterest), total_amount_repaid: quantizeCurrency(totalAmount), total_principal_paid: quantizeCurrency(totalPrincipal), schedule };
}

export function compareStrategies(loans: LoanInput[], extra: Decimal = new Decimal(0), start: Date = new Date()): StrategyComparisonResult {
  const totalDebt = loans.reduce((a, l) => a.plus(l.balance), new Decimal(0));
  const totalMin = loans.reduce((a, l) => a.plus(l.minimum_payment), new Decimal(0));
  const baseline = calculateBaseline(loans, start);
  const avalanche = calculateAccelerated(loans, 'avalanche', extra, start);
  const snowball = calculateAccelerated(loans, 'snowball', extra, start);
  if (baseline.is_amortizing && baseline.total_interest_paid != null && baseline.payoff_months != null) {
    if (avalanche.is_amortizing && avalanche.total_interest_paid != null && avalanche.payoff_months != null) {
      avalanche.interest_saved_vs_baseline = Decimal.max(new Decimal(0), baseline.total_interest_paid.minus(avalanche.total_interest_paid));
      avalanche.time_saved_months_vs_baseline = Math.max(0, baseline.payoff_months - avalanche.payoff_months);
    }
    if (snowball.is_amortizing && snowball.total_interest_paid != null && snowball.payoff_months != null) {
      snowball.interest_saved_vs_baseline = Decimal.max(new Decimal(0), baseline.total_interest_paid.minus(snowball.total_interest_paid));
      snowball.time_saved_months_vs_baseline = Math.max(0, baseline.payoff_months - snowball.payoff_months);
    }
  }
  return { baseline, avalanche, snowball, total_debt: quantizeCurrency(totalDebt), total_minimum_payment: quantizeCurrency(totalMin), weighted_average_interest_rate: calculateWeightedAverageRate(loans), extra_monthly_payment: quantizeCurrency(extra), loan_count: loans.length };
}
