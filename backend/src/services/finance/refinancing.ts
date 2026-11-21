import Decimal from 'decimal.js';
import { calculateBaseline } from './repayment';
import { LoanInput } from '../../types/finance';

Decimal.set({ precision: 50, rounding: Decimal.ROUND_HALF_UP });
const CENT = new Decimal('0.01');

export function amortizationPayment(principal: Decimal, annualRatePct: Decimal, termMonths: number): Decimal {
  if (principal.lte(0) || termMonths <= 0) return new Decimal(0);
  if (annualRatePct.eq(0)) {
    const p = principal.div(termMonths).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    return Decimal.max(CENT, p);
  }
  const monthlyRate = annualRatePct.div(100).div(12);
  const denom = new Decimal(1).minus(new Decimal(1).plus(monthlyRate).pow(-termMonths));
  if (denom.eq(0)) {
    const p = principal.div(termMonths).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    return Decimal.max(CENT, p);
  }
  const payment = principal.times(monthlyRate.div(denom)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  return Decimal.max(CENT, payment);
}

export function amortizationTotals(principal: Decimal, annualRatePct: Decimal, monthlyPayment: Decimal, termMonths: number): { totalPayments: Decimal; totalInterest: Decimal } {
  const monthlyRate = annualRatePct.div(100).div(12);
  let balance = principal;
  let totalPayments = new Decimal(0);
  let totalInterest = new Decimal(0);
  for (let m = 1; m <= termMonths; m++) {
    const interest = balance.times(monthlyRate).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const payoffNeeded = balance.plus(interest);
    const paymentApplied = m === termMonths ? payoffNeeded : Decimal.min(monthlyPayment, payoffNeeded);
    balance = payoffNeeded.minus(paymentApplied);
    totalInterest = totalInterest.plus(interest);
    totalPayments = totalPayments.plus(paymentApplied);
    if (balance.lte(0)) break;
  }
  return { totalPayments: totalPayments.toDecimalPlaces(2, Decimal.ROUND_HALF_UP), totalInterest: totalInterest.toDecimalPlaces(2, Decimal.ROUND_HALF_UP) };
}

export function calculateRefinance(loans: LoanInput[], input: { proposed_interest_rate: number; term_months: number; fees: number; fee_treatment: 'upfront' | 'financed'; has_federal_loans?: boolean }) {
  const currentDebt = loans.reduce((a, l) => a.plus(l.balance), new Decimal(0));
  const currentMonthly = loans.reduce((a, l) => a.plus(l.minimum_payment), new Decimal(0));
  const baseline = calculateBaseline(loans);
  let currentTotalCost: Decimal | null = null;
  let currentCostWarning: string | null = null;
  if (baseline.is_amortizing && baseline.total_amount_repaid != null) {
    currentTotalCost = new Decimal(baseline.total_amount_repaid.toString());
  } else {
    currentCostWarning = 'Current-loan total cost cannot be estimated from the entered minimum payments. At least one loan does not amortize or exceeds the supported payoff timeline.';
  }
  const fees = new Decimal(input.fees).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const rate = new Decimal(input.proposed_interest_rate);
  const term = input.term_months;
  let principalRefinanced: Decimal;
  let monthlyPayment: Decimal;
  let totalLoanPayments: Decimal;
  let proposedTotalInterest: Decimal;
  let proposedTotalCost: Decimal;
  if (input.fee_treatment === 'upfront') {
    principalRefinanced = currentDebt;
    monthlyPayment = amortizationPayment(principalRefinanced, rate, term);
    const t = amortizationTotals(principalRefinanced, rate, monthlyPayment, term);
    totalLoanPayments = t.totalPayments;
    proposedTotalInterest = t.totalInterest;
    proposedTotalCost = totalLoanPayments.plus(fees).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  } else {
    principalRefinanced = currentDebt.plus(fees).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    monthlyPayment = amortizationPayment(principalRefinanced, rate, term);
    const t = amortizationTotals(principalRefinanced, rate, monthlyPayment, term);
    totalLoanPayments = t.totalPayments;
    proposedTotalInterest = t.totalInterest;
    proposedTotalCost = totalLoanPayments;
  }
  const monthlyDiff = monthlyPayment.minus(currentMonthly).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const totalCostDiff = currentTotalCost ? proposedTotalCost.minus(currentTotalCost).toDecimalPlaces(2, Decimal.ROUND_HALF_UP) : null;
  let breakEvenMonths: number | null = null;
  let breakEvenExplanation: string | null = null;
  if (fees.eq(0)) {
    breakEvenMonths = 0;
    breakEvenExplanation = 'No upfront fees were entered; cost adjustments take effect from the first payment.';
  } else if (input.fee_treatment === 'upfront') {
    const monthlySavings = currentMonthly.minus(monthlyPayment);
    if (monthlySavings.gt(0)) {
      breakEvenMonths = Math.ceil(fees.div(monthlySavings).toNumber());
      breakEvenExplanation = `At $${monthlySavings.toFixed(2)}/month lower payment, it takes approximately ${breakEvenMonths} months to recover the upfront fee of $${fees.toFixed(2)}.`;
    } else {
      breakEvenExplanation = 'Proposed monthly payment is higher than or equal to current payments; upfront fees are not recovered through monthly cash flow savings.';
    }
  } else {
    breakEvenExplanation = 'Fees are financed into the loan balance and amortized over the full term.';
  }
  const hasFederal = input.has_federal_loans || loans.some(l => l.loan_type === 'Federal' || (l as any).type === 'Federal');
  const federalWarning = hasFederal ? 'Caution: You have eligible federal student loans. Refinancing federal loans into a private loan permanently forfeits federal protections, including Income-Driven Repayment (IDR/SAVE), Public Service Loan Forgiveness (PSLF), federal forbearance/deferment, and death/disability discharge.' : null;

  return {
    proposed_rate: rate,
    term_months: term,
    fees,
    fee_treatment: input.fee_treatment,
    principal_refinanced: principalRefinanced,
    proposed_monthly_payment: monthlyPayment,
    proposed_total_interest: proposedTotalInterest,
    proposed_total_cost: proposedTotalCost,
    current_monthly_payment: currentMonthly.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
    current_estimated_total_cost: currentTotalCost ? currentTotalCost.toDecimalPlaces(2, Decimal.ROUND_HALF_UP) : null,
    monthly_payment_difference: monthlyDiff,
    total_cost_difference: totalCostDiff,
    current_cost_warning: currentCostWarning,
    break_even_months: breakEvenMonths,
    break_even_explanation: breakEvenExplanation,
    federal_loan_warning: federalWarning,
    is_hypothetical: true,
  };
}
