import { execFileSync } from 'node:child_process';
import path from 'node:path';
import Decimal from 'decimal.js';
import { LoanType } from '../src/types/finance';
import { calculateRefinance } from '../src/services/finance/refinancing';
import { compareStrategies } from '../src/services/finance/repayment';
import type { LoanInput } from '../src/types/finance';

const loans = [
  { id: 'loan-a', name: 'Federal high-rate', balance: 5000, interest_rate: 8, minimum_payment: 100, loan_type: 'Federal' as const },
  { id: 'loan-b', name: 'Private small-balance', balance: 2000, interest_rate: 4, minimum_payment: 100, loan_type: 'Private' as const },
  { id: 'loan-c', name: 'Zero-rate', balance: 1250, interest_rate: 0, minimum_payment: 50, loan_type: 'Unknown' as const },
];

const refinanceOffers = [
  { proposed_interest_rate: 4.5, term_months: 60, fees: 400, fee_treatment: 'upfront' as const, has_federal_loans: false },
  { proposed_interest_rate: 4.5, term_months: 60, fees: 400, fee_treatment: 'financed' as const, has_federal_loans: false },
];

type JsonMoney = string | number | null;
type JsonDetail = {
  loan_id: string;
  loan_name: string;
  opening_balance: JsonMoney;
  interest_charged: JsonMoney;
  payment_applied: JsonMoney;
  principal_paid: JsonMoney;
  closing_balance: JsonMoney;
  is_paid_off: boolean;
};
type JsonMonth = {
  month_index: number;
  year_month: string;
  total_payment: JsonMoney;
  total_interest: JsonMoney;
  total_principal: JsonMoney;
  remaining_balance: JsonMoney;
  active_loans_count: number;
  loans_detail: JsonDetail[];
};
type JsonSummary = {
  strategy: string;
  is_amortizing: boolean;
  payoff_months: number | null;
  estimated_debt_free_date: string | null;
  total_interest_paid: JsonMoney;
  total_amount_repaid: JsonMoney;
  total_principal_paid: JsonMoney;
  interest_saved_vs_baseline: JsonMoney;
  time_saved_months_vs_baseline: number | null;
  warning_message: string | null;
  schedule: JsonMonth[];
};
type JsonRefinance = {
  principal_refinanced: JsonMoney;
  proposed_monthly_payment: JsonMoney;
  proposed_total_interest: JsonMoney;
  proposed_total_cost: JsonMoney;
  current_monthly_payment: JsonMoney;
  current_estimated_total_cost: JsonMoney;
  monthly_payment_difference: JsonMoney;
  total_cost_difference: JsonMoney;
  break_even_months: number | null;
  federal_loan_warning: string | null;
  is_hypothetical: boolean;
};

function runPythonReference() {
  const runner = path.resolve(__dirname, '../scripts/financial_parity_runner.py');
  const payload = {
    loans,
    extra_monthly_payment: 200,
    start_date: '2025-01-01',
    refinance_offers: refinanceOffers,
  };
  const output = execFileSync(process.env.PYTHON || 'python', [runner], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    input: JSON.stringify(payload),
  });
  return JSON.parse(output) as {
    comparison: {
      baseline: JsonSummary;
      avalanche: JsonSummary;
      snowball: JsonSummary;
      total_debt: JsonMoney;
      total_minimum_payment: JsonMoney;
      weighted_average_interest_rate: JsonMoney;
      extra_monthly_payment: JsonMoney;
      loan_count: number;
    };
    refinancing: JsonRefinance[];
  };
}

function money(value: Decimal | number | string | null | undefined): string | null {
  return value == null ? null : new Decimal(value).toFixed(2);
}

function summaryProjection(summary: ReturnType<typeof compareStrategies>['baseline']) {
  return {
    strategy: summary.strategy,
    is_amortizing: summary.is_amortizing,
    payoff_months: summary.payoff_months ?? null,
    estimated_debt_free_date: summary.estimated_debt_free_date ?? null,
    total_interest_paid: money(summary.total_interest_paid),
    total_amount_repaid: money(summary.total_amount_repaid),
    total_principal_paid: money(summary.total_principal_paid),
    interest_saved_vs_baseline: money(summary.interest_saved_vs_baseline),
    time_saved_months_vs_baseline: summary.time_saved_months_vs_baseline ?? null,
    warning_message: summary.warning_message ?? null,
    schedule: summary.schedule.map((month) => ({
      month_index: month.month_index,
      year_month: month.year_month,
      total_payment: money(month.total_payment),
      total_interest: money(month.total_interest),
      total_principal: money(month.total_principal),
      remaining_balance: money(month.remaining_balance),
      active_loans_count: month.active_loans_count,
      loans_detail: month.loans_detail.map((loan) => ({
        loan_id: loan.loan_id,
        loan_name: loan.loan_name,
        opening_balance: money(loan.opening_balance),
        interest_charged: money(loan.interest_charged),
        payment_applied: money(loan.payment_applied),
        principal_paid: money(loan.principal_paid),
        closing_balance: money(loan.closing_balance),
        is_paid_off: loan.is_paid_off,
      })),
    })),
  };
}

function pythonSummaryProjection(summary: JsonSummary) {
  return {
    strategy: summary.strategy,
    is_amortizing: summary.is_amortizing,
    payoff_months: summary.payoff_months,
    estimated_debt_free_date: summary.estimated_debt_free_date,
    total_interest_paid: money(summary.total_interest_paid),
    total_amount_repaid: money(summary.total_amount_repaid),
    total_principal_paid: money(summary.total_principal_paid),
    interest_saved_vs_baseline: money(summary.interest_saved_vs_baseline),
    time_saved_months_vs_baseline: summary.time_saved_months_vs_baseline,
    warning_message: summary.warning_message,
    schedule: summary.schedule.map((month) => ({
      month_index: month.month_index,
      year_month: month.year_month,
      total_payment: money(month.total_payment),
      total_interest: money(month.total_interest),
      total_principal: money(month.total_principal),
      remaining_balance: money(month.remaining_balance),
      active_loans_count: month.active_loans_count,
      loans_detail: month.loans_detail.map((loan) => ({
        loan_id: loan.loan_id,
        loan_name: loan.loan_name,
        opening_balance: money(loan.opening_balance),
        interest_charged: money(loan.interest_charged),
        payment_applied: money(loan.payment_applied),
        principal_paid: money(loan.principal_paid),
        closing_balance: money(loan.closing_balance),
        is_paid_off: loan.is_paid_off,
      })),
    })),
  };
}

function refinanceProjection(result: ReturnType<typeof calculateRefinance>) {
  return {
    principal_refinanced: money(result.principal_refinanced),
    proposed_monthly_payment: money(result.proposed_monthly_payment),
    proposed_total_interest: money(result.proposed_total_interest),
    proposed_total_cost: money(result.proposed_total_cost),
    current_monthly_payment: money(result.current_monthly_payment),
    current_estimated_total_cost: money(result.current_estimated_total_cost),
    monthly_payment_difference: money(result.monthly_payment_difference),
    total_cost_difference: money(result.total_cost_difference),
    break_even_months: result.break_even_months,
    federal_loan_warning: result.federal_loan_warning,
    is_hypothetical: result.is_hypothetical,
  };
}

describe('financial engine parity with the original Python implementation', () => {
  it('matches full repayment schedules, payoff metrics, rollover allocation, and refinance totals', () => {
    const reference = runPythonReference();
    const inputs: LoanInput[] = loans.map((loan) => ({
      ...loan,
      balance: new Decimal(loan.balance),
      interest_rate: new Decimal(loan.interest_rate),
      minimum_payment: new Decimal(loan.minimum_payment),
      loan_type: loan.loan_type === 'Federal'
        ? LoanType.FEDERAL
        : loan.loan_type === 'Private'
          ? LoanType.PRIVATE
          : LoanType.UNKNOWN,
    }));
    const comparison = compareStrategies(inputs, new Decimal(200), new Date(2025, 0, 1));
    expect(summaryProjection(comparison.baseline)).toEqual(pythonSummaryProjection(reference.comparison.baseline));
    expect(summaryProjection(comparison.avalanche)).toEqual(pythonSummaryProjection(reference.comparison.avalanche));
    expect(summaryProjection(comparison.snowball)).toEqual(pythonSummaryProjection(reference.comparison.snowball));
    expect(money(comparison.total_debt)).toBe(money(reference.comparison.total_debt));
    expect(money(comparison.total_minimum_payment)).toBe(money(reference.comparison.total_minimum_payment));
    expect(money(comparison.weighted_average_interest_rate)).toBe(money(reference.comparison.weighted_average_interest_rate));
    expect(money(comparison.extra_monthly_payment)).toBe(money(reference.comparison.extra_monthly_payment));
    expect(comparison.loan_count).toBe(reference.comparison.loan_count);

    const projectedRefinancing = refinanceOffers.map((offer) => {
      const { has_federal_loans: _hasFederalLoans, ...input } = offer;
      return refinanceProjection(calculateRefinance(inputs, input));
    });
    const pythonRefinancing = reference.refinancing.map((result) => ({
      principal_refinanced: money(result.principal_refinanced),
      proposed_monthly_payment: money(result.proposed_monthly_payment),
      proposed_total_interest: money(result.proposed_total_interest),
      proposed_total_cost: money(result.proposed_total_cost),
      current_monthly_payment: money(result.current_monthly_payment),
      current_estimated_total_cost: money(result.current_estimated_total_cost),
      monthly_payment_difference: money(result.monthly_payment_difference),
      total_cost_difference: money(result.total_cost_difference),
      break_even_months: result.break_even_months,
      federal_loan_warning: result.federal_loan_warning,
      is_hypothetical: result.is_hypothetical,
    }));
    expect(projectedRefinancing).toEqual(pythonRefinancing);
  });
});
