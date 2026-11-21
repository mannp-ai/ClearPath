import Decimal from 'decimal.js';

export enum LoanType { FEDERAL = 'Federal', PRIVATE = 'Private', UNKNOWN = 'Unknown' }
export enum StrategyType { BASELINE = 'baseline', AVALANCHE = 'avalanche', SNOWBALL = 'snowball' }
export enum FeeTreatment { UPFRONT = 'upfront', FINANCED = 'financed' }

export interface LoanInput {
  id: string;
  name: string;
  balance: string | number | Decimal;
  interest_rate: string | number | Decimal;
  minimum_payment: string | number | Decimal;
  loan_type?: LoanType;
}

export interface MonthlyLoanDetail {
  loan_id: string;
  loan_name: string;
  opening_balance: Decimal;
  interest_charged: Decimal;
  payment_applied: Decimal;
  principal_paid: Decimal;
  closing_balance: Decimal;
  is_paid_off: boolean;
}

export interface MonthSchedule {
  month_index: number;
  year_month: string;
  total_payment: Decimal;
  total_interest: Decimal;
  total_principal: Decimal;
  remaining_balance: Decimal;
  active_loans_count: number;
  loans_detail: MonthlyLoanDetail[];
}

export interface RepaymentSummary {
  strategy: StrategyType;
  is_amortizing: boolean;
  payoff_months?: number;
  estimated_debt_free_date?: string;
  total_interest_paid?: Decimal;
  total_amount_repaid?: Decimal;
  total_principal_paid?: Decimal;
  interest_saved_vs_baseline?: Decimal;
  time_saved_months_vs_baseline?: number;
  non_amortizing_loan_ids?: string[];
  warning_message?: string;
  schedule: MonthSchedule[];
}

export interface StrategyComparisonResult {
  baseline: RepaymentSummary;
  avalanche: RepaymentSummary;
  snowball: RepaymentSummary;
  total_debt: Decimal;
  total_minimum_payment: Decimal;
  weighted_average_interest_rate: Decimal;
  extra_monthly_payment: Decimal;
  loan_count: number;
}
