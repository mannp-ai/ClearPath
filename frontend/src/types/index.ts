export type LoanType = 'Federal' | 'Private' | 'Unknown';

export type StrategyType = 'baseline' | 'avalanche' | 'snowball';

export type FeeTreatment = 'upfront' | 'financed';

export interface LoanInput {
  id: string;
  name: string;
  balance: number;
  interest_rate: number; // Percentage e.g. 6.5
  minimum_payment: number;
  loan_type: LoanType;
}

export interface MonthlyLoanDetail {
  loan_id: string;
  loan_name: string;
  opening_balance: number;
  interest_charged: number;
  payment_applied: number;
  principal_paid: number;
  closing_balance: number;
  is_paid_off: boolean;
}

export interface MonthSchedule {
  month_index: number;
  year_month: string;
  total_payment: number;
  total_interest: number;
  total_principal: number;
  remaining_balance: number;
  active_loans_count: number;
  loans_detail: MonthlyLoanDetail[];
}

export interface RepaymentSummary {
  strategy: StrategyType;
  is_amortizing: boolean;
  payoff_months: number | null;
  estimated_debt_free_date: string | null;
  total_interest_paid: number | null;
  total_amount_repaid: number | null;
  total_principal_paid: number | null;
  interest_saved_vs_baseline: number | null;
  time_saved_months_vs_baseline: number | null;
  non_amortizing_loan_ids: string[];
  warning_message: string | null;
  schedule: MonthSchedule[];
}

export interface StrategyComparisonResult {
  baseline: RepaymentSummary;
  avalanche: RepaymentSummary;
  snowball: RepaymentSummary;
  total_debt: number;
  total_minimum_payment: number;
  weighted_average_interest_rate: number;
  extra_monthly_payment: number;
  loan_count: number;
}

export interface RefinanceInput {
  proposed_interest_rate: number;
  term_months: number;
  fees: number;
  fee_treatment: FeeTreatment;
  has_federal_loans: boolean;
}

export interface RefinanceSummary {
  proposed_rate: number;
  term_months: number;
  fees: number;
  fee_treatment: FeeTreatment;
  principal_refinanced: number;
  proposed_monthly_payment: number;
  proposed_total_interest: number;
  proposed_total_cost: number;
  current_monthly_payment: number;
  current_estimated_total_cost: number | null;
  monthly_payment_difference: number;
  total_cost_difference: number | null;
  current_cost_warning: string | null;
  break_even_months: number | null;
  break_even_explanation: string | null;
  federal_loan_warning: string | null;
  is_hypothetical: boolean;
}
