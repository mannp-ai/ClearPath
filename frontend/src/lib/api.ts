import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4000');
if (!API && process.env.NODE_ENV === 'production') throw new Error('NEXT_PUBLIC_API_URL must be set in production');

export const api = axios.create({ baseURL: API, withCredentials: true });

export function getGoogleLoginUrl(redirect?: string): string {
  const url = new URL('/api/v1/auth/google', API);
  if (redirect) {
    url.searchParams.set('redirect', redirect);
  }
  return url.toString();
}

let refreshRequest: Promise<void> | null = null;
let sessionFailed = false;

api.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error)) return Promise.reject(error);
  const config = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
  const url = config?.url ?? '';
  const isAuthRequest = /\/auth\/(login|register|refresh|logout|verify-email|password-reset)/.test(url);
  if (error.response?.status !== 401 || !config || config._retry || isAuthRequest || sessionFailed) {
    return Promise.reject(error);
  }

  config._retry = true;
  refreshRequest ??= api
    .post('/api/v1/auth/refresh')
    .then(() => {
      sessionFailed = false;
    })
    .catch((refreshErr) => {
      sessionFailed = true;
      return Promise.reject(refreshErr);
    })
    .finally(() => {
      refreshRequest = null;
    });

  try {
    await refreshRequest;
    return await api.request(config);
  } catch (refreshError) {
    return Promise.reject(refreshError);
  }
});

export type LoanInput = {
  name: string;
  type: 'Federal' | 'Private' | 'Unknown';
  currency?: string;
  balance: number;
  interest_rate: number;
  minimum_payment: number;
};

export type LoanRecord = LoanInput & { _id: string };

export type AdminUser = {
  _id: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'active' | 'deactivated';
};

export type Preferences = { country?: string; currency?: string };

export type SessionUser = {
  _id: string;
  email: string;
  preferences?: Preferences;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'active' | 'deactivated';
};

export type MoneyValue = number | string;

export type ScheduleLoanDetail = {
  loan_id: string;
  loan_name: string;
  opening_balance: MoneyValue;
  interest_charged: MoneyValue;
  payment_applied: MoneyValue;
  principal_paid: MoneyValue;
  closing_balance: MoneyValue;
  is_paid_off: boolean;
};

export type ScheduleMonth = {
  month_index: number;
  year_month: string;
  total_payment: MoneyValue;
  total_interest: MoneyValue;
  total_principal: MoneyValue;
  remaining_balance: MoneyValue;
  active_loans_count: number;
  loans_detail: ScheduleLoanDetail[];
};

export type RepaymentSummary = {
  strategy: 'baseline' | 'avalanche' | 'snowball';
  is_amortizing: boolean;
  payoff_months?: number;
  estimated_debt_free_date?: string;
  total_interest_paid?: MoneyValue;
  total_amount_repaid?: MoneyValue;
  total_principal_paid?: MoneyValue;
  interest_saved_vs_baseline?: MoneyValue;
  time_saved_months_vs_baseline?: number;
  warning_message?: string;
  schedule: ScheduleMonth[];
};

export type RepaymentComparison = {
  baseline: RepaymentSummary;
  avalanche: RepaymentSummary;
  snowball: RepaymentSummary;
  total_debt: MoneyValue;
  total_minimum_payment: MoneyValue;
  weighted_average_interest_rate: MoneyValue;
  extra_monthly_payment: MoneyValue;
  loan_count: number;
};

export type ScenarioRecord = {
  _id: string;
  name: string;
  strategy: string;
  extraPayment: number;
  loanSnapshot: LoanInput[];
  results: RepaymentComparison;
};

export type RefinanceInput = {
  proposed_interest_rate: number;
  term_months: number;
  fees: number;
  fee_treatment: 'upfront' | 'financed';
  has_federal_loans?: boolean;
};

export type RefinanceResult = {
  proposed_monthly_payment: MoneyValue;
  proposed_total_interest: MoneyValue;
  proposed_total_cost: MoneyValue;
  current_monthly_payment: MoneyValue;
  current_estimated_total_cost: MoneyValue | null;
  monthly_payment_difference: MoneyValue;
  total_cost_difference: MoneyValue | null;
  break_even_months: number | null;
  break_even_explanation: string | null;
  current_cost_warning: string | null;
  federal_loan_warning: string | null;
  is_hypothetical: boolean;
};

export async function login(email: string, password: string) {
  sessionFailed = false;
  const { data } = await api.post('/api/v1/auth/login', { email, password });
  return data;
}

export async function register(email: string, password: string, name?: string) {
  const { data } = await api.post('/api/v1/auth/register', { email, password, name });
  return data;
}

export async function verifyEmail(token: string) {
  const { data } = await api.post('/api/v1/auth/verify-email', { token });
  return data;
}

export async function requestPasswordReset(email: string) {
  const { data } = await api.post('/api/v1/auth/password-reset/request', { email });
  return data;
}

export async function resetPassword(token: string, password: string) {
  const { data } = await api.post('/api/v1/auth/password-reset/confirm', { token, password });
  return data;
}

export async function logout() {
  await api.post('/api/v1/auth/logout');
}

export async function fetchCurrentUser(): Promise<SessionUser> {
  const { data } = await api.get<{ user: SessionUser }>('/api/v1/auth/me');
  return data.user;
}

export async function updatePreferences(preferences: Preferences): Promise<SessionUser> {
  const { data } = await api.patch<{ user: SessionUser }>('/api/v1/auth/preferences', preferences);
  return data.user;
}

export async function fetchLoans(): Promise<LoanRecord[]> {
  const { data } = await api.get<{ loans: LoanRecord[] }>('/api/v1/loans');
  return data.loans;
}

export async function createLoan(loan: LoanInput): Promise<LoanRecord> {
  const { data } = await api.post<{ loan: LoanRecord }>('/api/v1/loans', loan);
  return data.loan;
}

export async function updateLoan(id: string, loan: Partial<LoanInput>): Promise<LoanRecord> {
  const { data } = await api.put<{ loan: LoanRecord }>(`/api/v1/loans/${id}`, loan);
  return data.loan;
}

export async function deleteLoan(id: string): Promise<void> {
  await api.delete(`/api/v1/loans/${id}`);
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const { data } = await api.get<{ users: AdminUser[] }>('/api/v1/admin/users');
  return data.users;
}

export async function updateUserStatus(id: string, status: AdminUser['status']): Promise<AdminUser> {
  const { data } = await api.patch<{ user: AdminUser }>(`/api/v1/admin/users/${id}/status`, { status });
  return data.user;
}

export async function updateUserRole(id: string, role: AdminUser['role']): Promise<AdminUser> {
  const { data } = await api.patch<{ user: AdminUser }>(`/api/v1/admin/users/${id}/role`, { role });
  return data.user;
}

export async function calculateRepayment(
  loans: LoanRecord[],
  extraMonthlyPayment: number,
): Promise<RepaymentComparison> {
  const input = loans.map((loan) => ({
    id: loan._id,
    name: loan.name,
    balance: loan.balance,
    interest_rate: loan.interest_rate,
    minimum_payment: loan.minimum_payment,
    loan_type: loan.type,
    currency: loan.currency,
  }));
  const { data } = await api.post<RepaymentComparison>('/api/v1/repayment/compare', {
    loans: input,
    extra_monthly_payment: extraMonthlyPayment,
  });
  return data;
}

export async function calculateRefinance(
  loans: LoanRecord[],
  input: RefinanceInput,
): Promise<RefinanceResult> {
  const { data } = await api.post<RefinanceResult>('/api/v1/refinancing/calculate', {
    loans: loans.map((loan) => ({
      id: loan._id,
      name: loan.name,
      balance: loan.balance,
      interest_rate: loan.interest_rate,
      minimum_payment: loan.minimum_payment,
      loan_type: loan.type,
      currency: loan.currency,
    })),
    ...input,
  });
  return data;
}

export async function fetchScenarios(): Promise<ScenarioRecord[]> {
  const { data } = await api.get<{ scenarios: ScenarioRecord[] }>('/api/v1/scenarios');
  return data.scenarios;
}

export async function saveScenario(input: {
  name: string;
  strategy: 'baseline' | 'avalanche' | 'snowball';
  extraPayment: number;
  loanSnapshot: LoanInput[];
  results: RepaymentComparison;
}): Promise<ScenarioRecord> {
  const { data } = await api.post<{ scenario: ScenarioRecord }>('/api/v1/scenarios', input);
  return data.scenario;
}

export async function deleteScenario(id: string): Promise<void> {
  await api.delete(`/api/v1/scenarios/${id}`);
}

export async function importLoans(loans: LoanInput[]) {
  const { data } = await api.post<{ imported: number }>('/api/v1/loans/import', { loans });
  return data;
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error ?? error.message;
  }
  return error instanceof Error ? error.message : 'An unexpected error occurred.';
}
