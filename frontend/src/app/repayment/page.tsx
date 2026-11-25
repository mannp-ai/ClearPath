'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
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
import { usePreferences } from '@/lib/preferences';
import { currencySymbol, DEFAULT_CURRENCY, formatMoney, portfolioCurrency } from '@/lib/currency';
import { BalanceChart } from '@/components/balance-chart';

type Strategy = keyof Pick<RepaymentComparison, 'baseline' | 'avalanche' | 'snowball'>;

function useMoney(cur: string) {
  const { locale } = usePreferences();
  return {
    money: (v: number | string | null | undefined) => formatMoney(v, cur, locale, 0),
    moneyDetailed: (v: number | string | null | undefined) => formatMoney(v, cur, locale, 2),
    symbol: currencySymbol(cur, locale),
  };
}

function formatDuration(months: number | undefined): string {
  if (months == null) return '—';
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
  currency: string;
  strategyKey: Strategy;
  activeStrategy: Strategy;
  onSelect: (strategy: Strategy) => void;
}

function StrategyCard({
  title,
  subtitle,
  summary,
  isRecommended,
  currency,
  strategyKey,
  activeStrategy,
  onSelect,
}: StrategyCardProps) {
  const { money } = useMoney(currency);
  const isSelected = activeStrategy === strategyKey;

  return (
    <div
      onClick={() => onSelect(strategyKey)}
      className={`cp-card cursor-pointer p-5 sm:p-6 relative flex flex-col justify-between ${
        isSelected
          ? 'border-[#0f3d32] ring-2 ring-[#0f3d32]/20 bg-[#ffffff]'
          : 'hover:border-[#cfd4dc]'
      }`}
    >
      {isRecommended && (
        <div className="absolute -top-3 right-5 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] px-2.5 py-0.5 text-xs font-semibold text-[#0f6b53] flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          <span>Least interest</span>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[#55606e]">
            {subtitle}
          </span>
          {isSelected && (
            <span className="h-2 w-2 rounded-full bg-[#0f3d32]" />
          )}
        </div>

        <h3 className="font-display text-xl font-bold text-[#0b0f1a] mb-4">
          {title}
        </h3>

        {summary.is_amortizing ? (
          <div className="space-y-3.5">
            {/* Payoff Date KPI */}
            <div className="rounded-lg bg-[#f3efe7] p-3 border border-[#eef0ec]">
              <span className="text-xs font-medium text-[#55606e] block">
                Estimated debt-free date
              </span>
              <div className="font-display text-lg font-bold text-[#0b0f1a] mt-0.5">
                {summary.estimated_debt_free_date || 'Calculated'}
              </div>
              <span className="text-xs text-[#55606e]">
                {formatDuration(summary.payoff_months)} ({summary.payoff_months} total months)
              </span>
            </div>

            {/* Interest & Total Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[#55606e] block">Interest</span>
                <strong className="font-display font-semibold tabular-nums text-sm text-[#0b0f1a]">
                  {money(summary.total_interest_paid)}
                </strong>
              </div>
              <div>
                <span className="text-[#55606e] block">Total repaid</span>
                <strong className="font-display font-semibold tabular-nums text-sm text-[#0b0f1a]">
                  {money(summary.total_amount_repaid)}
                </strong>
              </div>
            </div>

            {/* Savings Delimited Row */}
            {strategyKey !== 'baseline' && summary.interest_saved_vs_baseline != null && (
              <div className="mt-2 pt-3 border-t border-[#eef0ec] flex items-center justify-between text-xs font-medium text-[#0f6b53]">
                <span>Interest Saved:</span>
                <span className="font-bold tabular-nums">
                  {money(summary.interest_saved_vs_baseline)}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-[#fde68a] bg-[#fffbeb] p-3.5 text-xs text-[#b45309]">
            <p className="font-semibold">A payment does not cover its interest</p>
            <p className="mt-1 leading-relaxed">
              {summary.warning_message ?? 'Minimum payments do not cover accruing monthly interest.'}
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 pt-3 border-t border-[#eef0ec] flex items-center justify-between text-xs text-[#0f3d32] font-semibold">
        <span>{isSelected ? 'Showing schedule' : 'Show schedule'}</span>
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
  const { currency: prefCurrency, locale } = usePreferences();
  const pCur = portfolioCurrency(loans);
  const mixed = pCur === 'MIXED';
  const cur = !pCur || mixed ? prefCurrency : pCur;
  const { money, moneyDetailed, symbol } = useMoney(cur);

  useEffect(() => {
    let active = true;
    Promise.all([fetchLoans(), fetchScenarios()])
      .then(([currentLoans, savedScenarios]) => {
        if (!active) return;
        setLoans(currentLoans);
        setScenarios(savedScenarios);
        if (currentLoans.length > 0 && portfolioCurrency(currentLoans) !== 'MIXED') {
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
        ({ name, type, currency, balance, interest_rate, minimum_payment }) => ({
          name,
          type,
          currency,
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
      setNotice(`Scenario “${scenario.name}” saved to your account.`);
    } catch (saveError: unknown) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const removeScenario = async (scenario: ScenarioRecord) => {
    if (!window.confirm(`Delete scenario “${scenario.name}”?`)) return;
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
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cp-masthead">
        <div>
          <h1 className="font-head">
            Repayment plan
          </h1>
          <p className="mt-1 text-sm text-[#55606e]">
            Choose an extra monthly amount and compare when you would be debt-free.
          </p>
        </div>

        {loans.length > 0 && (
          <Link
            href="/loans"
            className="cp-btn-secondary text-xs self-start sm:self-auto"
          >
            Manage loans ({loans.length})
          </Link>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div
          role="alert"
          className=" flex items-start gap-3 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4 text-sm text-[#b91c1c]"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-[#b91c1c] mt-0.5" />
          <div>
            <strong className="font-semibold">Calculation error: </strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className=" flex items-start gap-3 rounded-lg border border-[#a7f3d0] bg-[#ecfdf5] p-4 text-sm text-[#0f6b53]"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-[#0f6b53] mt-0.5" />
          <span>{notice}</span>
        </div>
      )}

      {loading ? (
        <div className="cp-card p-12 text-center text-sm text-[#55606e]">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0f3d32] border-t-transparent mb-3" />
          <p>Loading your loans and amortization models…</p>
        </div>
      ) : mixed ? (
        <div role="status" className="cp-card p-8 text-center">
          <h2 className="font-head text-lg font-semibold text-[#0b0f1a]">Your loans use more than one currency</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-[#2b3140]">
            ClearPath does not convert currencies, so it cannot compare repayment strategies across them. Review each loan&apos;s currency in your portfolio.
          </p>
          <Link href="/loans" className="cp-btn-secondary mt-4 inline-flex">Review loan currencies</Link>
        </div>
      ) : loans.length === 0 ? (
        <div className="cp-card p-12 text-center border-dashed">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef8dc] text-[#0f3d32] mb-4">
            <Layers className="h-6 w-6" />
          </div>
          <h2 className="font-display text-lg font-bold text-[#0b0f1a]">
            You need active loans to compare repayment strategies
          </h2>
          <p className="mt-1 text-sm text-[#55606e] max-w-md mx-auto">
            Add your loan balances, interest rates, and required minimums to simulate accelerated payoff.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/loans"
              className="cp-btn-primary"
            >
              Add your loans
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Accelerator Monthly Payment Control Card */}
          <section className="cp-card p-5 sm:p-6 bg-gradient-to-br from-white to-[#f3efe7]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-xl">
                <h2 className="font-display text-lg sm:text-xl font-bold text-[#0b0f1a] mt-0.5">
                  Extra monthly payment
                </h2>
                <p className="text-xs sm:text-sm text-[#55606e] mt-1 leading-relaxed">
                  Every dollar allocated above your combined minimums is concentrated onto one target loan.
                  When that loan is paid in full, its payment rolls into the next loan automatically.
                </p>
              </div>

              <div className="w-full lg:w-96 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#55606e]">Extra each month</span>
                  <span className="font-display font-bold tabular-nums text-lg text-[#0f3d32]">
                    {money(extraPayment)}/mo
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#55606e] select-none pointer-events-none">{symbol}</span>
                  <input
                    aria-label={`Additional monthly payment in ${cur}`}
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
                      className={` flex-1 py-2 rounded text-xs font-medium transition-all duration-150 ${
                        Number(extraPayment) === quick
                          ? 'bg-[#d8f2a7] text-[#0b0f1a]'
                          : 'bg-[#eef0ec] text-[#2b3140] hover:bg-[#e5e8ee]'
                      }`}
                    >
                      +{money(quick)}
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
                      <span>Calculating math…</span>
                    </span>
                  ) : (
                    'Update results'
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* 3 Strategy Comparison Cards */}
          {results && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-[#0b0f1a]">
                  Your three options
                </h2>
                <span className="text-xs text-[#55606e]">
                  Showing extra budget of {money(extraPayment)}/mo
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <StrategyCard
                  title="Minimums only"
                  subtitle="No extra payment"
                  summary={results.baseline}
                  currency={cur}
                  strategyKey="baseline"
                  activeStrategy={activeStrategy}
                  onSelect={setActiveStrategy}
                />

                <StrategyCard
                  title="Avalanche"
                  subtitle="Highest rate first"
                  summary={results.avalanche}
                  isRecommended={
                    results.avalanche.is_amortizing &&
                    results.baseline.is_amortizing &&
                    Number(results.avalanche.total_interest_paid || 0) <=
                      Number(results.snowball.total_interest_paid || 0)
                  }
                  currency={cur}
                  strategyKey="avalanche"
                  activeStrategy={activeStrategy}
                  onSelect={setActiveStrategy}
                />

                <StrategyCard
                  title="Snowball"
                  subtitle="Smallest balance first"
                  summary={results.snowball}
                  currency={cur}
                  strategyKey="snowball"
                  activeStrategy={activeStrategy}
                  onSelect={setActiveStrategy}
                />
              </div>

              {/* Remaining balance over time, from the calculated schedules */}
              <section className="cp-card p-5 sm:p-6" aria-labelledby="balance-over-time">
                <h2 id="balance-over-time" className="mb-3 text-base font-semibold text-[#0b0f1a]">Balance over time</h2>
                <BalanceChart
                  start={Number(results.total_debt)}
                  money={(value) => money(value)}
                  series={[
                    { label: 'Minimum payments', color: '#9aa3af', summary: results.baseline, dashed: true },
                    { label: 'Avalanche', color: '#0f3d32', summary: results.avalanche },
                    { label: 'Snowball', color: '#3b82f6', summary: results.snowball },
                  ]}
                />
              </section>

              {/* Side-by-Side Comparison Table */}
              <div className="cp-card overflow-hidden">
                <div className="px-5 py-3.5 bg-[#f3efe7] border-b border-[#e5e8ee] flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-[#0b0f1a]">
                    Side by side
                  </h3>
                  <span className="text-xs text-[#55606e]">3 scenarios</span>
                </div>

                <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Strategy comparison table">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-[#e5e8ee] bg-[#ffffff] text-[#55606e] text-xs font-semiboldr">
                        <th className="py-3 px-4 sm:px-5">Measure</th>
                        <th className="py-3 px-4 sm:px-5">1. Minimums only</th>
                        <th className="py-3 px-4 sm:px-5 text-[#0f3d32] bg-[#eef8dc]/40">
                          2. Avalanche
                        </th>
                        <th className="py-3 px-4 sm:px-5 text-[#2563a8] bg-[#eaf1fa]/40">
                          3. Snowball
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eef0ec]">
                      <tr>
                        <td className="py-3.5 px-4 sm:px-5 font-medium text-[#55606e]">
                          Approach
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 text-[#2b3140]">
                          Independent minimums
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-semibold text-[#0f6b53] bg-[#eef8dc]/20">
                          Highest rate first
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-semibold text-[#2563a8] bg-[#eaf1fa]/20">
                          Smallest balance first
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 sm:px-5 font-medium text-[#55606e]">
                          Debt-free
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-display font-bold text-[#0b0f1a]">
                          {results.baseline.estimated_debt_free_date || '—'}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-display font-bold text-[#0f6b53] bg-[#eef8dc]/20">
                          {results.avalanche.estimated_debt_free_date || '—'}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-display font-bold text-[#2563a8] bg-[#eaf1fa]/20">
                          {results.snowball.estimated_debt_free_date || '—'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 sm:px-5 font-medium text-[#55606e]">
                          Time to pay off
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 text-[#2b3140]">
                          {formatDuration(results.baseline.payoff_months)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-medium text-[#0f6b53] bg-[#eef8dc]/20">
                          {formatDuration(results.avalanche.payoff_months)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-medium text-[#2563a8] bg-[#eaf1fa]/20">
                          {formatDuration(results.snowball.payoff_months)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 sm:px-5 font-medium text-[#55606e]">
                          Interest paid
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-display tabular-nums text-[#2b3140]">
                          {money(results.baseline.total_interest_paid)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-display font-bold tabular-nums text-[#0f6b53] bg-[#eef8dc]/20">
                          {money(results.avalanche.total_interest_paid)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-display font-bold tabular-nums text-[#2563a8] bg-[#eaf1fa]/20">
                          {money(results.snowball.total_interest_paid)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 sm:px-5 font-medium text-[#55606e]">
                          Interest saved
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 text-[#55606e]">Starting point</td>
                        <td className="py-3.5 px-4 sm:px-5 font-display font-bold tabular-nums text-[#0f6b53] bg-[#eef8dc]/20">
                          {money(results.avalanche.interest_saved_vs_baseline)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-display font-bold tabular-nums text-[#2563a8] bg-[#eaf1fa]/20">
                          {money(results.snowball.interest_saved_vs_baseline)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 sm:px-5 font-medium text-[#55606e]">
                          Time saved
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 text-[#55606e]">Starting point</td>
                        <td className="py-3.5 px-4 sm:px-5 font-semibold text-[#0f6b53] bg-[#eef8dc]/20">
                          {results.avalanche.time_saved_months_vs_baseline
                            ? `${results.avalanche.time_saved_months_vs_baseline} months faster`
                            : '—'}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-semibold text-[#2563a8] bg-[#eaf1fa]/20">
                          {results.snowball.time_saved_months_vs_baseline
                            ? `${results.snowball.time_saved_months_vs_baseline} months faster`
                            : '—'}
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
                    <h3 className="font-display text-base font-bold text-[#0b0f1a]">
                      Save this scenario
                    </h3>
                    <p className="text-xs text-[#55606e] mt-0.5">
                      Preserve this snapshot of {loans.length} loans with {money(extraPayment)}/mo extra budget.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <input
                      aria-label="Scenario name"
                      className="cp-input max-w-xs text-sm"
                      required
                      maxLength={100}
                      placeholder="e.g. 2026 Aggressive Payoff"
                      value={scenarioName}
                      onChange={(event) => setScenarioName(event.target.value)}
                    />

                    <select
                      aria-label="Strategy to save"
                      className="cp-input w-auto text-sm"
                      value={activeStrategy}
                      onChange={(e) => setActiveStrategy(e.target.value as Strategy)}
                    >
                      <option value="avalanche">Avalanche</option>
                      <option value="snowball">Snowball</option>
                      <option value="baseline">Minimums only</option>
                    </select>

                    <button
                      type="button"
                      disabled={saving || !scenarioName.trim()}
                      onClick={save}
                      className="cp-btn-primary text-xs"
                    >
                      {saving ? 'Saving…' : 'Save scenario'}
                    </button>
                  </div>
                </div>
              </section>

              {/* schedule Table */}
              {selectedSummary && (
                <section className="cp-card overflow-hidden">
                  <div
                    onClick={() => setScheduleExpanded(!scheduleExpanded)}
                    className="cursor-pointer px-5 py-4 bg-[#f3efe7] border-b border-[#e5e8ee] flex items-center justify-between transition-colors duration-150 hover:bg-[#eef0ec]"
                  >
                    <div>
                      <h3 className="font-display text-base font-bold text-[#0b0f1a] capitalize flex items-center gap-2">
                        <span>{activeStrategy} schedule</span>
                        <span className="rounded-full bg-[#ffffff] border border-[#e5e8ee] px-2 py-0.5 text-xs font-semibold text-[#55606e]">
                          {scheduleData.length} months
                        </span>
                      </h3>
                      <p className="text-xs text-[#55606e] mt-0.5">
                        Month-by-month principal reduction and interest charges.
                      </p>
                    </div>

                    <button
                      type="button" aria-label={scheduleExpanded ? "Hide schedule" : "Show schedule"} aria-expanded={scheduleExpanded}
                      className=" p-1 rounded hover:bg-[#e5e8ee] text-[#55606e] transition-transform duration-200"
                    >
                      {scheduleExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>

                  {scheduleExpanded && (
                    <div className="">
                      {scheduleData.length > 0 ? (
                        <>
                          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Monthly schedule table">
                            <table className="w-full text-left text-xs sm:text-sm">
                              <thead>
                                <tr className="border-b border-[#e5e8ee] bg-[#ffffff] text-[#55606e] text-xs font-semiboldr">
                                  <th className="py-3 px-4">Month</th>
                                  <th className="py-3 px-4 text-right">Payment</th>
                                  <th className="py-3 px-4 text-right">Principal</th>
                                  <th className="py-3 px-4 text-right">Interest</th>
                                  <th className="py-3 px-4 text-right">Balance after</th>
                                  <th className="py-3 px-4 text-center">Loans left</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#eef0ec]">
                                {visibleSchedule.map((month) => (
                                  <tr key={month.month_index} className="hover:bg-[#f3efe7] transition-colors">
                                    <td className="py-2.5 px-4 font-semibold text-[#0b0f1a]">
                                      Month {month.month_index}{' '}
                                      <span className="text-[#55606e] font-normal text-xs ml-1">
                                        ({month.year_month})
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-display tabular-nums font-semibold text-[#0b0f1a]">
                                      {moneyDetailed(month.total_payment)}
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-display tabular-nums text-[#0f6b53]">
                                      {moneyDetailed(month.total_principal)}
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-display tabular-nums text-[#55606e]">
                                      {moneyDetailed(month.total_interest)}
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-display tabular-nums font-bold text-[#0b0f1a]">
                                      {moneyDetailed(month.remaining_balance)}
                                    </td>
                                    <td className="py-2.5 px-4 text-center">
                                      <span className="inline-block rounded-full bg-[#eef0ec] px-2 py-0.5 text-xs text-[#2b3140]">
                                        {month.active_loans_count} active
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {visibleSchedule.length < scheduleData.length && (
                            <div className="p-4 border-t border-[#eef0ec] text-center bg-[#f3efe7]">
                              <button
                                type="button"
                                onClick={() => setDisplayCount((prev) => Math.min(prev + 24, scheduleData.length))}
                                className="py-2 text-xs font-semibold text-[#0f3d32] hover:underline"
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
          <section className="pt-4 border-t border-[#e5e8ee]">
            <h2 className="font-display text-lg font-bold text-[#0b0f1a] mb-3">
              Saved scenarios ({scenarios.length})
            </h2>

            {scenarios.length === 0 ? (
              <p className="text-sm text-[#55606e]">
                You haven&apos;t saved any customized repayment scenarios yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {scenarios.map((scenario) => (
                  <div
                    key={scenario._id}
                    className="cp-card p-4 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <strong className="font-display font-bold text-sm text-[#0b0f1a]">
                          {scenario.name}
                        </strong>
                        <span className="rounded-full bg-[#eef8dc] px-2 py-0.5 text-xs font-medium text-[#0f3d32] capitalize">
                          {scenario.strategy}
                        </span>
                      </div>
                      <p className="text-xs text-[#55606e] mt-1">
                        {formatMoney(scenario.extraPayment, scenario.loanSnapshot?.[0]?.currency ?? DEFAULT_CURRENCY, locale, 0)}/mo extra · {scenario.loanSnapshot?.length || 0} loans
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#eef0ec] text-xs">
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
                        className=" font-semibold text-[#0f3d32] hover:underline"
                      >
                        Load scenario
                      </button>

                      <button
                        type="button"
                        onClick={() => removeScenario(scenario)}
                        className=" text-[#b91c1c] hover:underline flex items-center gap-1"
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

