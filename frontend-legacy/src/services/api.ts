import {
  LoanInput,
  StrategyComparisonResult,
  RefinanceInput,
  RefinanceSummary,
  RepaymentSummary,
} from '../types';
import {
  calculateClientBaseline,
  calculateClientAccelerated,
  calculateClientComparison,
  calculateClientRefinance,
} from './calculationEngine';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const apiService = {
  async getHealth(): Promise<{ status: string; version: string; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
      if (!res.ok) throw new Error('API offline');
      return await res.json();
    } catch {
      return { status: 'client-mode', version: '1.0.0', message: 'Running on local client engine' };
    }
  },

  async compareStrategies(
    loans: LoanInput[],
    extraMonthlyPayment: number
  ): Promise<StrategyComparisonResult> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/calculate/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loans: loans.map((l) => ({
            id: l.id,
            name: l.name,
            balance: l.balance,
            interest_rate: l.interest_rate,
            minimum_payment: l.minimum_payment,
            loan_type: l.loan_type,
          })),
          extra_monthly_payment: extraMonthlyPayment,
        }),
      });
    } catch (err) {
      if (!(err instanceof TypeError)) throw err;
      console.warn('Backend API unavailable, using client calculation engine:', err);
      return calculateClientComparison(loans, extraMonthlyPayment);
    }

    if (!res.ok) throw new Error(`Strategy calculation API returned ${res.status}.`);

    const data = await res.json();
    return {
      baseline: parseRepaymentSummary(data.baseline),
      avalanche: parseRepaymentSummary(data.avalanche),
      snowball: parseRepaymentSummary(data.snowball),
      total_debt: Number(data.total_debt),
      total_minimum_payment: Number(data.total_minimum_payment),
      weighted_average_interest_rate: Number(data.weighted_average_interest_rate),
      extra_monthly_payment: Number(data.extra_monthly_payment),
      loan_count: data.loan_count,
    };
  },

  async calculateRefinance(
    loans: LoanInput[],
    refinance: RefinanceInput
  ): Promise<RefinanceSummary> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/calculate/refinance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loans: loans.map((l) => ({
            id: l.id,
            name: l.name,
            balance: l.balance,
            interest_rate: l.interest_rate,
            minimum_payment: l.minimum_payment,
            loan_type: l.loan_type,
          })),
          refinance,
        }),
      });
    } catch (err) {
      if (!(err instanceof TypeError)) throw err;
      console.warn('Backend API unavailable, using client refinance engine:', err);
      return calculateClientRefinance(loans, refinance);
    }

    if (!res.ok) throw new Error(`Refinance calculation API returned ${res.status}.`);

    const data = await res.json();
    return {
      proposed_rate: Number(data.proposed_rate),
      term_months: data.term_months,
      fees: Number(data.fees),
      fee_treatment: data.fee_treatment,
      principal_refinanced: Number(data.principal_refinanced),
      proposed_monthly_payment: Number(data.proposed_monthly_payment),
      proposed_total_interest: Number(data.proposed_total_interest),
      proposed_total_cost: Number(data.proposed_total_cost),
      current_monthly_payment: Number(data.current_monthly_payment),
      current_estimated_total_cost:
        data.current_estimated_total_cost !== null ? Number(data.current_estimated_total_cost) : null,
      monthly_payment_difference: Number(data.monthly_payment_difference),
      total_cost_difference: data.total_cost_difference !== null ? Number(data.total_cost_difference) : null,
      current_cost_warning: data.current_cost_warning,
      break_even_months: data.break_even_months,
      break_even_explanation: data.break_even_explanation,
      federal_loan_warning: data.federal_loan_warning,
      is_hypothetical: true,
    };
  },
};

function parseRepaymentSummary(data: any): RepaymentSummary {
  return {
    strategy: data.strategy,
    is_amortizing: data.is_amortizing,
    payoff_months: data.payoff_months,
    estimated_debt_free_date: data.estimated_debt_free_date,
    total_interest_paid: data.total_interest_paid !== null ? Number(data.total_interest_paid) : null,
    total_amount_repaid: data.total_amount_repaid !== null ? Number(data.total_amount_repaid) : null,
    total_principal_paid: data.total_principal_paid !== null ? Number(data.total_principal_paid) : null,
    interest_saved_vs_baseline:
      data.interest_saved_vs_baseline !== null ? Number(data.interest_saved_vs_baseline) : null,
    time_saved_months_vs_baseline: data.time_saved_months_vs_baseline,
    non_amortizing_loan_ids: data.non_amortizing_loan_ids || [],
    warning_message: data.warning_message,
    schedule: (data.schedule || []).map((s: any) => ({
      month_index: s.month_index,
      year_month: s.year_month,
      total_payment: Number(s.total_payment),
      total_interest: Number(s.total_interest),
      total_principal: Number(s.total_principal),
      remaining_balance: Number(s.remaining_balance),
      active_loans_count: s.active_loans_count,
      loans_detail: (s.loans_detail || []).map((d: any) => ({
        loan_id: d.loan_id,
        loan_name: d.loan_name,
        opening_balance: Number(d.opening_balance),
        interest_charged: Number(d.interest_charged),
        payment_applied: Number(d.payment_applied),
        principal_paid: Number(d.principal_paid),
        closing_balance: Number(d.closing_balance),
        is_paid_off: d.is_paid_off,
      })),
    })),
  };
}
