'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Layers,
  ChevronDown,
  ChevronUp,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  calculateRepayment,
  deleteScenario,
  fetchLoans,
  fetchScenarios,
  getApiErrorMessage,
  saveScenario,
  type LoanInput,
  type LoanRecord,
  type RepaymentComparison,
  type RepaymentSummary,
  type ScenarioRecord,
} from '@/lib/api';

type Strategy = keyof Pick<RepaymentComparison, 'baseline' | 'avalanche' | 'snowball'>;

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const currencyDetail = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function money(value: number | string | null | undefined): string {
  return value == null ? 'â€”' : currency.format(Number(value));
}

function moneyDetailed(value: number | string | null | undefined): string {
  return value == null ? 'â€”' : currencyDetail.format(Number(value));
}

function formatDuration(months: number | undefined): string {
  if (months == null) return 'â€”';
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) return `${months} mo`;
  if (remainingMonths === 0) return `${years} yr`;
  return `${years} yr ${remainingMonths} mo`;
}

interface StrategyCardProps {
  title: string;
  subtitle: string;
  summary: RepaymentSummary;
  isRecommended?: boolean;
  strategyKey: Strategy;
  activeStrategy: Strategy;
  onSelect: (strategy: Strategy) => void;
}

function StrategyCard({
  title,
  subtitle,
  summary,
  isRecommended,
  strategyKey,
  activeStrategy,
  onSelect,
}: StrategyCardProps) {
  const isSelected = activeStrategy === strategyKey;

  return (
    <div
      onClick={() => onSelect(strategyKey)}
      className={`cp-card-interactive cursor-pointer p-5 sm:p-6 relative flex flex-col justify-between ${
        isSelected
          ? 'border-[#2563eb] ring-2 ring-[#2563eb]/20 bg-[#fbfdff]'
          : 'hover:border-[#cbd5e1]'
      }`}
    >
      {isRecommended && (
        <div className="absolute -top-3 right-5 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] px-2.5 py-0.5 text-[11px] font-semibold text-[#168568] flex items-center gap-1 shadow-xs">
          <Sparkles className="h-3 w-3" />
          <span>Saves Most Interest</span>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[#64748b]">
            {subtitle}
          </span>
          {isSelected && (
            <span className="h-2 w-2 rounded-full bg-[#2563eb]" />
          )}
        </div>

        <h3 className="font-display text-xl font-bold text-[#0f172a] mb-4">
          {title}
        </h3>

        {summary.is_amortizing ? (
          <div className="space-y-3.5">
            {/* Payoff Date KPI */}
            <div className="rounded-lg bg-[#f8fafc] p-3 border border-[#f1f5f9]">
              <span className="text-xs font-medium text-[#64748b] block">
                Estimated debt-free date
              </span>
              <div className="font-display text-lg font-bold text-[#0f172a] mt-0.5">
                {summary.estimated_debt_free_date || 'Calculated'}
              </div>
              <span className="text-xs text-[#64748b]">
                {formatDuration(summary.payoff_months)} ({summary.payoff_months} total months)
              </span>
            </div>

            {/* Interest & Total Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[#64748b] block">Total Interest</span>
                <strong className="font-display font-semibold tabular-nums text-sm text-[#0f172a]">
                  {money(summary.total_interest_paid)}
                </strong>
              </div>
              <div>
                <span className="text-[#64748b] block">Total Repaid</span>
                <strong className="font-display font-semibold tabular-nums text-sm text-[#0f172a]">
                  {money(summary.total_amount_repaid)}
                </strong>
              </div>
            </div>

            {/* Savings Delimited Row */}
            {strategyKey !== 'baseline' && summary.interest_saved_vs_baseline != null && (
              <div className="mt-2 pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-xs font-medium text-[#168568]">
                <span>Interest Saved:</span>
                <span className="font-bold tabular-nums">
                  {money(summary.interest_saved_vs_baseline)}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-[#fde68a] bg-[#fffbeb] p-3.5 text-xs text-[#b45309]">
            <p className="font-semibold">Negative Amortization Alert</p>
            <p className="mt-1 leading-relaxed">
              {summary.warning_message ?? 'Minimum payments do not cover accruing monthly interest.'}
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-xs text-[#2563eb] font-semibold">
        <span>{isSelected ? 'Viewing Schedule' : 'Inspect Schedule'}</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

export default function RepaymentPage() {
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioRecord[]>([]);
  const [results, setResults] = useState<RepaymentComparison | null>(null);
  const [extraPayment, setExtraPayment] = useState('100');
  const [scenarioName, setScenarioName] = useState('');
  const [activeStrategy, setActiveStrategy] = useState<Strategy>('avalanche');
  const [scheduleExpanded, setScheduleExpanded] = useState(true);
  const [displayCount, setDisplayCount] = useState<number>(24);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const router = useRouter();

  useEffect(() => {
    let active = true;
    Promise.all([fetchLoans(), fetchScenarios()])
      .then(([currentLoans, savedScenarios]) => {
        if (!active) return;
        setLoans(currentLoans);
        setScenarios(savedScenarios);
        if (currentLoans.length > 0) {
          calculateRepayment(currentLoans, 100)
            .then((comparison) => {
              if (active) setResults(comparison);
            })
            .catch(() => {});
        }
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        if (typeof loadError === 'object' && loadError !== null && 'response' in loadError) {
          const res = (loadError as { response?: { status?: number } }).response;
          if (res?.status === 401) {
            router.push('/login?redirect=/repayment');
            return;
          }
        }
        setError(getApiErrorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  const calculate = async (overrideExtra?: number) => {
    const extraVal = overrideExtra !== undefined ? overrideExtra : Number(extraPayment);
    setCalculating(true);
    setError('');
    setNotice('');
    try {
      const comparison = await calculateRepayment(loans, extraVal);
      setResults(comparison);
    } catch (calculationError: unknown) {
      setError(getApiErrorMessage(calculationError));
    } finally {
      setCalculating(false);
    }
  };

  const handleQuickExtra = (val: number) => {
    setExtraPayment(String(val));
    calculate(val);
  };

  const save = async () => {
    if (!results) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const loanSnapshot: LoanInput[] = loans.map(
        ({ name, type, balance, interest_rate, minimum_payment }) => ({
          name,
          type,
          balance,
          interest_rate,
          minimum_payment,
        })
      );
      const scenario = await saveScenario({
        name: scenarioName.trim(),
        strategy: activeStrategy,
        extraPayment: Number(extraPayment),
        loanSnapshot,
        results,
      });
      setScenarios((current) => [scenario, ...current]);
      setScenarioName('');
      setNotice(`Scenario â€œ${scenario.name}â€ saved to your account.`);
    } catch (saveError: unknown) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const removeScenario = async (scenario: ScenarioRecord) => {
    if (!window.confirm(`Delete scenario â€œ${scenario.name}â€?`)) return;
    setError('');
    try {
      await deleteScenario(scenario._id);
      setScenarios((current) => current.filter((item) => item._id !== scenario._id));
      setNotice('Scenario deleted.');
    } catch (deleteError: unknown) {
      setError(getApiErrorMessage(deleteError));
    }
  };

  const selectedSummary = results?.[activeStrategy];
  const scheduleData = selectedSummary?.schedule || [];
  const visibleSchedule = scheduleData.slice(0, displayCount);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#e6eaf0]">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0f172a]">
            Repayment Strategy Comparison
          </h1>
          <p className="mt-1 text-sm text-[#64748b]">
            Model payoff velocity, interest savings, and payment rollovers under accelerated strategies.
          </p>
        </div>

        {loans.length > 0 && (
          <Link
            href="/loans"
            className="cp-btn-secondary text-xs self-start sm:self-auto"
          >
            Manage Loans ({loans.length})
          </Link>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div
          role="alert"
          className="animate-fade-in flex items-start gap-3 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4 text-sm text-[#dc2626]"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-[#dc2626] mt-0.5" />
          <div>
            <strong className="font-semibold">Calculation error: </strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="animate-fade-in flex items-start gap-3 rounded-lg border border-[#a7f3d0] bg-[#ecfdf5] p-4 text-sm text-[#168568]"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-[#168568] mt-0.5" />
          <span>{notice}</span>
        </div>
      )}

      {loading ? (
        <div className="cp-card p-12 text-center text-sm text-[#64748b]">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#2563eb] border-t-transparent mb-3" />
          <p>Loading your loans and amortization modelsâ€¦</p>
        </div>
      ) : loans.length === 0 ? (
        <div className="cp-card p-12 text-center border-dashed">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#eff6ff] text-[#2563eb] mb-4">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="font-display text-lg font-bold text-[#0f172a]">
            You need active loans to compare repayment strategies
          </h3>
          <p className="mt-1 text-sm text-[#64748b] max-w-md mx-auto">
            Add your loan balances, interest rates, and required minimums to simulate accelerated payoff.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/loans"
              className="cp-btn-primary"
            >
              Add your loans now
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Accelerator Monthly Payment Control Card */}
          <section className="cp-card p-5 sm:p-6 bg-gradient-to-br from-white to-[#f8fafc]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-xl">
                <span className="text-xs font-medium text-[#2563eb]">
                  Payoff Acceleration Budget
                </span>
                <h2 className="font-display text-lg sm:text-xl font-bold text-[#0f172a] mt-0.5">
                  Extra Monthly Payment
                </h2>
                <p className="text-xs sm:text-sm text-[#64748b] mt-1 leading-relaxed">
                  Every dollar allocated above your combined minimums is concentrated onto one target loan.
                  When that loan is paid in full, its payment rolls into the next loan automatically.
                </p>
              </div>

              <div className="w-full lg:w-96 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#64748b]">Additional Budget</span>
                  <span className="font-display font-bold tabular-nums text-lg text-[#2563eb]">
                    ${extraPayment}/mo
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-semibold text-[#64748b] select-none pointer-events-none">$</span>
                  <input
                    className="cp-input pl-[34px] font-display font-semibold tabular-nums"
                    type="number"
                    min="0"
                    max="50000"
                    step="10"
                    value={extraPayment}
                    onChange={(e) => setExtraPayment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && calculate()}
                  />
                </div>

                {/* Quick select chips */}
                <div className="flex items-center gap-1.5 pt-1">
                  {[0, 50, 100, 200, 500].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => handleQuickExtra(quick)}
                      className={`interactive-tap flex-1 py-1 rounded text-xs font-medium transition-all duration-150 ${
                        Number(extraPayment) === quick
                          ? 'bg-[#2563eb] text-white shadow-xs'
                          : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
                      }`}
                    >
                      +${quick}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={calculating}
                  onClick={() => calculate()}
                  className="w-full cp-btn-primary mt-2"
                >
                  {calculating ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Calculating mathâ€¦</span>
                    </span>
                  ) : (
                    'Update Repayment Projections'
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* 3 Strategy Comparison Cards */}
          {results && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-[#0f172a]">
                  Three Repayment Trajectories
                </h2>
                <span className="text-xs text-[#64748b]">
                  Showing extra budget of ${extraPayment}/mo
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <StrategyCard
                  title="Minimum Baseline"
                  subtitle="Required Minimums Only"
                  summary={results.baseline}
                  strategyKey="baseline"
                  activeStrategy={activeStrategy}
                  onSelect={setActiveStrategy}
                />

                <StrategyCard
                  title="Debt Avalanche"
                  subtitle="Highest APR First"
                  summary={results.avalanche}
                  isRecommended={
                    results.avalanche.is_amortizing &&
                    results.baseline.is_amortizing &&
                    Number(results.avalanche.total_interest_paid || 0) <=
                      Number(results.snowball.total_interest_paid || 0)
                  }
                  strategyKey="avalanche"
                  activeStrategy={activeStrategy}
                  onSelect={setActiveStrategy}
                />

                <StrategyCard
                  title="Debt Snowball"
                  subtitle="Smallest Balance First"
                  summary={results.snowball}
                  strategyKey="snowball"
                  activeStrategy={activeStrategy}
                  onSelect={setActiveStrategy}
                />
              </div>

              {/* Side-by-Side Comparison Table */}
              <div className="cp-card overflow-hidden">
                <div className="px-5 py-3.5 bg-[#f8fafc] border-b border-[#e6eaf0] flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-[#0f172a]">
                    At-a-Glance Strategy Comparison
                  </h3>
                  <span className="text-xs text-[#64748b]">3 scenarios</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-[#e6eaf0] bg-white text-[#64748b] text-[11px] font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4 sm:px-5">Comparison Metric</th>
                        <th className="py-3 px-4 sm:px-5">1. Minimums Baseline</th>
                        <th className="py-3 px-4 sm:px-5 text-[#2563eb] bg-[#eff6ff]/40">
                          2. Debt Avalanche
                        </th>
                        <th className="py-3 px-4 sm:px-5 text-[#7c3aed] bg-[#f5f3ff]/40">
                          3. Debt Snowball
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      <tr>
                        <td className="py-3.5 px-4 sm:px-5 font-medium text-[#64748b]">
                          Repayment Strategy
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 text-[#334155]">
                          Independent minimums
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-semibold text-[#168568] bg-[#eff6ff]/20">
                          Highest APR target first
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-semibold text-[#7c3aed] bg-[#f5f3ff]/20">
                          Smallest balance first
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 sm:px-5 font-medium text-[#64748b]">
                          Estimated Debt-Free
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-display font-bold text-[#0f172a]">
                          {results.baseline.estimated_debt_free_date || 'â€”'}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-display font-bold text-[#168568] bg-[#eff6ff]/20">
                          {results.avalanche.estimated_debt_free_date || 'â€”'}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-display font-bold text-[#7c3aed] bg-[#f5f3ff]/20">
                          {results.snowball.estimated_debt_free_date || 'â€”'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 sm:px-5 font-medium text-[#64748b]">
                          Total Payoff Duration
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 text-[#334155]">
                          {formatDuration(results.baseline.payoff_months)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-medium text-[#168568] bg-[#eff6ff]/20">
                          {formatDuration(results.avalanche.payoff_months)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-medium text-[#7c3aed] bg-[#f5f3ff]/20">
                          {formatDuration(results.snowball.payoff_months)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 sm:px-5 font-medium text-[#64748b]">
                          Total Interest Paid
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-display tabular-nums text-[#334155]">
                          {money(results.baseline.total_interest_paid)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-display font-bold tabular-nums text-[#168568] bg-[#eff6ff]/20">
                          {money(results.avalanche.total_interest_paid)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-display font-bold tabular-nums text-[#7c3aed] bg-[#f5f3ff]/20">
                          {money(results.snowball.total_interest_paid)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 sm:px-5 font-medium text-[#64748b]">
                          Interest Saved vs. Baseline
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 text-[#94a3b8]">Baseline reference</td>
                        <td className="py-3.5 px-4 sm:px-5 font-display font-bold tabular-nums text-[#168568] bg-[#eff6ff]/20">
                          {money(results.avalanche.interest_saved_vs_baseline)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-display font-bold tabular-nums text-[#7c3aed] bg-[#f5f3ff]/20">
                          {money(results.snowball.interest_saved_vs_baseline)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 sm:px-5 font-medium text-[#64748b]">
                          Time Saved vs. Baseline
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 text-[#94a3b8]">Baseline reference</td>
                        <td className="py-3.5 px-4 sm:px-5 font-semibold text-[#168568] bg-[#eff6ff]/20">
                          {results.avalanche.time_saved_months_vs_baseline
                            ? `${results.avalanche.time_saved_months_vs_baseline} months faster`
                            : 'â€”'}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-semibold text-[#7c3aed] bg-[#f5f3ff]/20">
                          {results.snowball.time_saved_months_vs_baseline
                            ? `${results.snowball.time_saved_months_vs_baseline} months faster`
                            : 'â€”'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Save Scenario Form */}
              <section className="cp-card p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display text-base font-bold text-[#0f172a]">
                      Save this simulation to your account
                    </h3>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      Preserve this snapshot of {loans.length} loans with ${extraPayment}/mo extra budget.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <input
                      className="cp-input max-w-xs text-xs sm:text-sm"
                      required
                      maxLength={100}
                      placeholder="e.g. 2026 Aggressive Payoff"
                      value={scenarioName}
                      onChange={(event) => setScenarioName(event.target.value)}
                    />

                    <select
                      className="cp-input w-auto text-xs sm:text-sm"
                      value={activeStrategy}
                      onChange={(e) => setActiveStrategy(e.target.value as Strategy)}
                    >
                      <option value="avalanche">Avalanche Plan</option>
                      <option value="snowball">Snowball Plan</option>
                      <option value="baseline">Baseline Plan</option>
                    </select>

                    <button
                      type="button"
                      disabled={saving || !scenarioName.trim()}
                      onClick={save}
                      className="cp-btn-primary text-xs"
                    >
                      {saving ? 'Savingâ€¦' : 'Save Scenario'}
                    </button>
                  </div>
                </div>
              </section>

              {/* Amortization Schedule Table */}
              {selectedSummary && (
                <section className="cp-card overflow-hidden">
                  <div
                    onClick={() => setScheduleExpanded(!scheduleExpanded)}
                    className="cursor-pointer px-5 py-4 bg-[#f8fafc] border-b border-[#e6eaf0] flex items-center justify-between transition-colors duration-150 hover:bg-[#f1f5f9]"
                  >
                    <div>
                      <h3 className="font-display text-base font-bold text-[#0f172a] capitalize flex items-center gap-2">
                        <span>{activeStrategy} Amortization Schedule</span>
                        <span className="rounded-full bg-white border border-[#e6eaf0] px-2 py-0.5 text-xs font-semibold text-[#64748b]">
                          {scheduleData.length} months
                        </span>
                      </h3>
                      <p className="text-xs text-[#64748b] mt-0.5">
                        Month-by-month principal reduction and interest charges.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="interactive-tap p-1 rounded hover:bg-[#e2e8f0] text-[#64748b] transition-transform duration-200"
                    >
                      {scheduleExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>

                  {scheduleExpanded && (
                    <div className="animate-fade-in">
                      {scheduleData.length > 0 ? (
                        <>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs sm:text-sm">
                              <thead>
                                <tr className="border-b border-[#e6eaf0] bg-white text-[#64748b] text-[11px] font-semibold uppercase tracking-wider">
                                  <th className="py-3 px-4">Month</th>
                                  <th className="py-3 px-4 text-right">Payment</th>
                                  <th className="py-3 px-4 text-right">Principal</th>
                                  <th className="py-3 px-4 text-right">Interest</th>
                                  <th className="py-3 px-4 text-right">Ending Balance</th>
                                  <th className="py-3 px-4 text-center">Active Accounts</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#f1f5f9]">
                                {visibleSchedule.map((month) => (
                                  <tr key={month.month_index} className="hover:bg-[#f8fafc] transition-colors">
                                    <td className="py-2.5 px-4 font-semibold text-[#0f172a]">
                                      Month {month.month_index}{' '}
                                      <span className="text-[#64748b] font-normal text-xs ml-1">
                                        ({month.year_month})
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-display tabular-nums font-semibold text-[#0f172a]">
                                      {moneyDetailed(month.total_payment)}
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-display tabular-nums text-[#168568]">
                                      {moneyDetailed(month.total_principal)}
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-display tabular-nums text-[#64748b]">
                                      {moneyDetailed(month.total_interest)}
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-display tabular-nums font-bold text-[#0f172a]">
                                      {moneyDetailed(month.remaining_balance)}
                                    </td>
                                    <td className="py-2.5 px-4 text-center">
                                      <span className="inline-block rounded-full bg-[#f1f5f9] px-2 py-0.5 text-xs text-[#475569]">
                                        {month.active_loans_count} active
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {visibleSchedule.length < scheduleData.length && (
                            <div className="p-4 border-t border-[#f1f5f9] text-center bg-[#f8fafc]">
                              <button
                                type="button"
                                onClick={() => setDisplayCount((prev) => Math.min(prev + 24, scheduleData.length))}
                                className="text-xs font-semibold text-[#2563eb] hover:underline"
                              >
                                Load Next 24 Months ({scheduleData.length - visibleSchedule.length} remaining)
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="p-6 text-sm text-[#b45309] bg-[#fffbeb]">
                          {selectedSummary.warning_message ?? 'No schedule generated.'}
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}
            </section>
          )}

          {/* Saved Scenarios Archive */}
          <section className="pt-4 border-t border-[#e6eaf0]">
            <h2 className="font-display text-lg font-bold text-[#0f172a] mb-3">
              Saved Simulation Scenarios ({scenarios.length})
            </h2>

            {scenarios.length === 0 ? (
              <p className="text-sm text-[#64748b]">
                You haven&apos;t saved any customized repayment scenarios yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {scenarios.map((scenario) => (
                  <div
                    key={scenario._id}
                    className="cp-card-interactive p-4 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <strong className="font-display font-bold text-sm text-[#0f172a]">
                          {scenario.name}
                        </strong>
                        <span className="rounded-full bg-[#eff6ff] px-2 py-0.5 text-xs font-medium text-[#2563eb] capitalize">
                          {scenario.strategy}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748b] mt-1">
                        ${scenario.extraPayment}/mo extra Â· {scenario.loanSnapshot?.length || 0} loans
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#f1f5f9] text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setResults(scenario.results);
                          setExtraPayment(String(scenario.extraPayment));
                          setActiveStrategy(
                            scenario.strategy === 'baseline' || scenario.strategy === 'snowball'
                              ? scenario.strategy
                              : 'avalanche'
                          );
                          window.scrollTo({ top: 300, behavior: 'smooth' });
                        }}
                        className="interactive-tap font-semibold text-[#2563eb] hover:underline"
                      >
                        Load Simulation
                      </button>

                      <button
                        type="button"
                        onClick={() => removeScenario(scenario)}
                        className="interactive-tap text-[#dc2626] hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

