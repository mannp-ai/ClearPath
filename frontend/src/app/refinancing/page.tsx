'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  RefreshCw,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  calculateRefinance,
  fetchLoans,
  getApiErrorMessage,
  type LoanRecord,
  type RefinanceResult,
} from '@/lib/api';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function money(value: number | string | null | undefined): string {
  return value == null ? 'â€”' : currency.format(Number(value));
}

export default function RefinancingPage() {
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [rate, setRate] = useState('5.25');
  const [termYears, setTermYears] = useState(7);
  const [useYears, setUseYears] = useState(true);
  const [customMonths, setCustomMonths] = useState('84');
  const [fees, setFees] = useState('0');
  const [feeTreatment, setFeeTreatment] = useState<'upfront' | 'financed'>('upfront');
  const [result, setResult] = useState<RefinanceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const effectiveTermMonths = useYears ? termYears * 12 : parseInt(customMonths) || 12;

  useEffect(() => {
    let active = true;
    fetchLoans()
      .then((currentLoans) => {
        if (active) {
          setLoans(currentLoans);
          if (currentLoans.length > 0) {
            calculateRefinance(currentLoans, {
              proposed_interest_rate: 5.25,
              term_months: 84,
              fees: 0,
              fee_treatment: 'upfront',
            })
              .then((calc) => {
                if (active) setResult(calc);
              })
              .catch(() => {});
          }
        }
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        if (typeof loadError === 'object' && loadError !== null && 'response' in loadError) {
          const res = (loadError as { response?: { status?: number } }).response;
          if (res?.status === 401) {
            router.push('/login?redirect=/refinancing');
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

  const totalBalance = useMemo(() => {
    return loans.reduce((acc, l) => acc + (Number(l.balance) || 0), 0);
  }, [loans]);

  const currentWeightedRate = useMemo(() => {
    if (totalBalance === 0) return 0;
    const weightedSum = loans.reduce(
      (acc, l) => acc + (Number(l.balance) || 0) * (Number(l.interest_rate) || 0),
      0
    );
    return weightedSum / totalBalance;
  }, [loans, totalBalance]);

  const hasFederalLoans = useMemo(() => {
    return loans.some((l) => l.type === 'Federal');
  }, [loans]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCalculating(true);
    setError('');
    try {
      const calculation = await calculateRefinance(loans, {
        proposed_interest_rate: Number(rate),
        term_months: effectiveTermMonths,
        fees: Number(fees),
        fee_treatment: feeTreatment,
      });
      setResult(calculation);
    } catch (calculationError: unknown) {
      setError(getApiErrorMessage(calculationError));
    } finally {
      setCalculating(false);
    }
  };

  const isLowerMonthly = Number(result?.monthly_payment_difference || 0) < 0;
  const isLowerTotalCost = Number(result?.total_cost_difference || 0) < 0;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="pb-6 border-b border-[#e6eaf0]">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-2.5 py-0.5 text-xs font-semibold text-[#2563eb] mb-2">
          <RefreshCw className="h-3 w-3" />
          <span>Hypothetical Financial Modeling</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0f172a]">
          Refinancing Cost & Cash Flow Evaluation
        </h1>
        <p className="mt-1 text-sm text-[#64748b]">
          Test whether a proposed interest rate, term length, and closing fees actually save you money.
        </p>
      </div>

      {/* Critical Federal Loan Warning Banner */}
      {hasFederalLoans && (
        <section
          role="region"
          aria-label="Federal loan warning"
          className="rounded-xl border-2 border-[#fde68a] bg-[#fffbeb] p-5 sm:p-6 text-[#78350f] shadow-xs"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#fef3c7] text-[#b45309]">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-base font-bold text-[#92400e]">
                Critical Warning: Permanent Loss of Federal Protections
              </h2>
              <p className="text-xs sm:text-sm text-[#78350f] leading-relaxed">
                Your portfolio contains eligible federal student loans. If you refinance federal student loans into
                a private loan, you <strong className="underline">permanently forfeit all federal benefits</strong>, including:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs font-medium text-[#92400e]">
                <div>â€¢ Income-Driven Repayment (SAVE, IDR, PAYE)</div>
                <div>â€¢ Public Service Loan Forgiveness (PSLF)</div>
                <div>â€¢ Federal administrative deferment and forbearance</div>
                <div>â€¢ Total and permanent disability discharge</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4 text-sm text-[#dc2626]"
        >
          <strong className="font-semibold">Calculation error: </strong>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="cp-card p-12 text-center text-sm text-[#64748b]">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#2563eb] border-t-transparent mb-3" />
          <p>Loading your loansâ€¦</p>
        </div>
      ) : loans.length === 0 ? (
        <div className="cp-card p-12 text-center border-dashed">
          <h3 className="font-display text-base font-bold text-[#0f172a]">
            No loans to refinance
          </h3>
          <p className="mt-1 text-sm text-[#64748b] max-w-sm mx-auto">
            Add your current student loans first so we can evaluate hypothetical refinance scenarios against them.
          </p>
          <div className="mt-5 flex justify-center">
            <Link
              href="/loans"
              className="cp-btn-primary"
            >
              Add your loans
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form Column: Proposed Terms */}
          <div className="lg:col-span-5 cp-card p-5 sm:p-6 space-y-6">
            <div className="border-b border-[#f1f5f9] pb-4">
              <h2 className="font-display text-base font-bold text-[#0f172a]">
                Hypothetical Refinancing Quote
              </h2>
              <p className="text-xs text-[#64748b] mt-0.5">
                Enter proposed interest rates and term lengths from any lender.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {/* Proposed Interest Rate */}
              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1.5">
                  Proposed interest rate (%)
                </label>
                <div className="relative">
                  <input
                    className="cp-input pr-7 font-mono font-semibold tabular-nums"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-medium text-[#94a3b8]">%</span>
                </div>
                <span className="text-[11px] text-[#64748b] mt-1 block">
                  Current weighted portfolio average is{' '}
                  <strong className="text-[#0f172a]">{currentWeightedRate.toFixed(2)}%</strong>
                </span>
              </div>

              {/* Term Duration */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[#475569]">
                    New loan term
                  </label>
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setUseYears(true)}
                      className={`px-2 py-0.5 rounded font-medium transition-colors ${
                        useYears ? 'bg-[#0f172a] text-white' : 'text-[#64748b] hover:text-[#0f172a]'
                      }`}
                    >
                      Years
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseYears(false)}
                      className={`px-2 py-0.5 rounded font-medium transition-colors ${
                        !useYears ? 'bg-[#0f172a] text-white' : 'text-[#64748b] hover:text-[#0f172a]'
                      }`}
                    >
                      Months
                    </button>
                  </div>
                </div>

                {useYears ? (
                  <div className="grid grid-cols-5 gap-1.5">
                    {[5, 7, 10, 15, 20].map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setTermYears(yr)}
                        className={`interactive-tap py-2 text-xs font-semibold rounded-md border transition-all duration-150 ${
                          termYears === yr
                            ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-xs'
                            : 'bg-white border-[#e6eaf0] text-[#334155] hover:bg-[#f8fafc]'
                        }`}
                      >
                        {yr} yrs
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    className="cp-input tabular-nums"
                    type="number"
                    min="6"
                    max="600"
                    step="1"
                    required
                    value={customMonths}
                    onChange={(e) => setCustomMonths(e.target.value)}
                  />
                )}
                <span className="text-[11px] text-[#64748b] mt-1 block">
                  Active term: <strong>{effectiveTermMonths} months</strong> ({(effectiveTermMonths / 12).toFixed(1)} years)
                </span>
              </div>

              {/* Origination Fees */}
              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1.5">
                  Origination / closing fees ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-medium text-[#64748b] select-none pointer-events-none">$</span>
                  <input
                    className="cp-input pl-[34px] font-mono tabular-nums"
                    type="number"
                    min="0"
                    max="500000"
                    step="50"
                    required
                    value={fees}
                    onChange={(e) => setFees(e.target.value)}
                  />
                </div>
                <span className="text-[11px] text-[#64748b] mt-1 block">
                  Most reputable student loan refinancers charge $0 origination fees.
                </span>
              </div>

              {/* Fee Treatment */}
              {Number(fees) > 0 && (
                <div>
                  <label className="block text-xs font-medium text-[#475569] mb-1.5">
                    Fee treatment
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setFeeTreatment('upfront')}
                      className={`p-2.5 rounded-lg border text-left font-medium transition-colors ${
                        feeTreatment === 'upfront'
                          ? 'border-[#2563eb] bg-[#eff6ff] text-[#2563eb]'
                          : 'border-[#e6eaf0] bg-white text-[#475569] hover:bg-[#f8fafc]'
                      }`}
                    >
                      <div>Paid Upfront</div>
                      <div className="text-[10px] text-[#64748b] font-normal">Out of pocket at close</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeeTreatment('financed')}
                      className={`p-2.5 rounded-lg border text-left font-medium transition-colors ${
                        feeTreatment === 'financed'
                          ? 'border-[#2563eb] bg-[#eff6ff] text-[#2563eb]'
                          : 'border-[#e6eaf0] bg-white text-[#475569] hover:bg-[#f8fafc]'
                      }`}
                    >
                      <div>Financed in Loan</div>
                      <div className="text-[10px] text-[#64748b] font-normal">Added to principal</div>
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={calculating}
                className="w-full cp-btn-primary mt-2"
              >
                {calculating ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Calculating mathâ€¦</span>
                  </span>
                ) : (
                  'Calculate Refinance Outcome'
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Comparative Results */}
          <div className="lg:col-span-7 space-y-5">
            {result ? (
              <>
                {/* 2 Primary Impact Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Monthly Payment Impact */}
                  <div className="cp-card p-5 space-y-2">
                    <span className="text-xs font-medium text-[#64748b]">
                      Monthly payment impact
                    </span>
                    <div className="font-display text-2xl sm:text-3xl font-bold tabular-nums text-[#0f172a]">
                      {money(result.proposed_monthly_payment)}
                      <span className="text-xs font-normal text-[#64748b]">/mo</span>
                    </div>

                    <div
                      className={`text-xs font-semibold flex items-center gap-1.5 ${
                        isLowerMonthly ? 'text-[#15803d]' : 'text-[#334155]'
                      }`}
                    >
                      {isLowerMonthly ? (
                        <>
                          <TrendingDown className="h-4 w-4 text-[#15803d]" />
                          Lowers monthly bill by {money(Math.abs(Number(result.monthly_payment_difference)))}/mo
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-4 w-4 text-[#64748b]" />
                          Increases monthly bill by {money(Math.abs(Number(result.monthly_payment_difference)))}/mo
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-[#64748b] pt-2 border-t border-[#f1f5f9]">
                      Compared to current combined minimum of {money(result.current_monthly_payment)}/mo.
                    </p>
                  </div>

                  {/* Total Cost Impact */}
                  <div className="cp-card p-5 space-y-2">
                    <span className="text-xs font-medium text-[#64748b]">
                      Lifetime total cost impact
                    </span>
                    <div className="font-display text-2xl sm:text-3xl font-bold tabular-nums text-[#0f172a]">
                      {money(result.proposed_total_cost)}
                    </div>

                    <div
                      className={`text-xs font-semibold flex items-center gap-1.5 ${
                        isLowerTotalCost ? 'text-[#168568]' : 'text-[#dc2626]'
                      }`}
                    >
                      {isLowerTotalCost ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-[#168568]" />
                          Saves {money(Math.abs(Number(result.total_cost_difference)))} in total lifetime interest
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-[#dc2626]" />
                          Costs {money(Math.abs(Number(result.total_cost_difference)))} MORE over lifetime
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-[#64748b] pt-2 border-t border-[#f1f5f9]">
                      Compared to baseline cost of {money(result.current_estimated_total_cost)}.
                    </p>
                  </div>
                </div>

                {/* Educational Callout: Lower Payment Trap */}
                {isLowerMonthly && !isLowerTotalCost && (
                  <div className="rounded-xl border border-[#fecaca] bg-[#fff5f5] p-4 text-xs text-[#991b1b] space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-[#dc2626]" />
                      <span>The &ldquo;Lower Monthly Payment&rdquo; Trap Detected</span>
                    </div>
                    <p className="leading-relaxed text-[#7f1d1d]">
                      Although this proposed offer lowers your monthly bill by{' '}
                      <strong>{money(Math.abs(Number(result.monthly_payment_difference)))}/month</strong>,
                      stretching your loan term to {effectiveTermMonths} months causes you to pay{' '}
                      <strong>{money(Math.abs(Number(result.total_cost_difference)))} MORE</strong> in total interest!
                    </p>
                  </div>
                )}

                {/* Detailed Comparison Table */}
                <div className="cp-card overflow-hidden">
                  <div className="px-5 py-3.5 bg-[#f8fafc] border-b border-[#e6eaf0] flex items-center justify-between">
                    <h3 className="font-display text-sm font-bold text-[#0f172a]">
                      Side-by-Side Financial Breakdown
                    </h3>
                    <span className="text-xs text-[#64748b]">Current vs. Refinanced</span>
                  </div>

                  <div className="divide-y divide-[#f1f5f9] text-xs sm:text-sm">
                    <div className="py-3 px-5 flex justify-between items-center">
                      <span className="text-[#64748b]">Principal Refinanced</span>
                      <span className="font-display font-semibold tabular-nums text-[#0f172a]">
                        {money(totalBalance)}
                      </span>
                    </div>

                    <div className="py-3 px-5 flex justify-between items-center">
                      <span className="text-[#64748b]">Interest Rate</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[#94a3b8] line-through tabular-nums">
                          {currentWeightedRate.toFixed(2)}%
                        </span>
                        <span className="font-display font-bold tabular-nums text-[#2563eb]">
                          {Number(rate).toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <div className="py-3 px-5 flex justify-between items-center">
                      <span className="text-[#64748b]">Repayment Term</span>
                      <span className="text-[#334155]">
                        {effectiveTermMonths} months ({(effectiveTermMonths / 12).toFixed(1)} yrs)
                      </span>
                    </div>

                    <div className="py-3 px-5 flex justify-between items-center">
                      <span className="text-[#64748b]">Estimated Total Interest</span>
                      <span className="font-display font-semibold tabular-nums text-[#0f172a]">
                        {money(result.proposed_total_interest)}
                      </span>
                    </div>

                    <div className="py-3 px-5 flex justify-between items-center">
                      <span className="text-[#64748b]">Origination / Closing Fees</span>
                      <span className="font-display tabular-nums text-[#334155]">
                        {money(fees)} ({feeTreatment})
                      </span>
                    </div>

                    <div className="py-3.5 px-5 flex justify-between items-center bg-[#f8fafc]">
                      <span className="font-bold text-[#0f172a]">Total Repayment Outflow</span>
                      <span className="font-display font-bold tabular-nums text-[#0f172a]">
                        {money(result.proposed_total_cost)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Break-even explanation */}
                {result.break_even_explanation && (
                  <div className="cp-card p-4 text-xs text-[#334155] space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-[#0f172a]">
                      <Clock className="h-4 w-4 text-[#2563eb]" />
                      <span>Break-Even Analysis</span>
                    </div>
                    <p className="leading-relaxed text-[#64748b]">
                      {result.break_even_explanation}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="cp-card p-8 text-center text-sm text-[#64748b]">
                Click &ldquo;Calculate Refinance Outcome&rdquo; to model results.
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

