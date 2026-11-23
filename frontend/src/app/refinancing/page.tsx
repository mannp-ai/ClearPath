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
import { usePreferences } from '@/lib/preferences';
import { currencySymbol, formatMoney, portfolioCurrency } from '@/lib/currency';

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
  const { currency: prefCurrency, locale } = usePreferences();
  const pCur = portfolioCurrency(loans);
  const mixed = pCur === 'MIXED';
  const cur = !pCur || mixed ? prefCurrency : pCur;
  const money = (value: number | string | null | undefined) => formatMoney(value, cur, locale, 2);
  const symbol = currencySymbol(cur, locale);
  // shortcut: the engine's explanation text hardcodes '$'; re-format its amounts here, replace when the engine takes a currency.
  const localizeAmounts = (text: string) => text.replace(/\$(\d[\d,]*(?:\.\d+)?)/g, (_m, n: string) => money(Number(n.replace(/,/g, ''))));

  const effectiveTermMonths = useYears ? termYears * 12 : parseInt(customMonths) || 12;

  useEffect(() => {
    let active = true;
    fetchLoans()
      .then((currentLoans) => {
        if (active) {
          setLoans(currentLoans);
          if (currentLoans.length > 0 && portfolioCurrency(currentLoans) !== 'MIXED') {
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
      <div className="cp-masthead">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#bcd8c9] bg-[#e6f0e9] px-2.5 py-0.5 text-xs font-semibold text-[#14594a] mb-2">
          <RefreshCw className="h-3 w-3" />
          <span>Hypothetical Financial Modeling</span>
        </div>
        <h1 className="font-head">
          Refinancing Cost & Cash Flow Evaluation
        </h1>
        <p className="mt-1 text-sm text-[#62594e]">
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
                <div>• Income-Driven Repayment (SAVE, IDR, PAYE)</div>
                <div>• Public Service Loan Forgiveness (PSLF)</div>
                <div>• Federal administrative deferment and forbearance</div>
                <div>• Total and permanent disability discharge</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4 text-sm text-[#b91c1c]"
        >
          <strong className="font-semibold">Calculation error: </strong>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="cp-card p-12 text-center text-sm text-[#62594e]">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#14594a] border-t-transparent mb-3" />
          <p>Loading your loans…</p>
        </div>
      ) : mixed ? (
        <div role="status" className="cp-card p-8 text-center">
          <h3 className="font-head text-lg font-semibold text-[#231f1b]">Your loans use more than one currency</h3>
          <p className="mx-auto mt-2 max-w-lg text-sm text-[#4a4239]">
            ClearPath does not convert currencies, so it cannot evaluate a refinance across them. Review each loan&apos;s currency in your portfolio.
          </p>
          <Link href="/loans" className="cp-btn-secondary mt-4 inline-flex">Review loan currencies</Link>
        </div>
      ) : loans.length === 0 ? (
        <div className="cp-card p-12 text-center border-dashed">
          <h3 className="font-display text-base font-bold text-[#231f1b]">
            No loans to refinance
          </h3>
          <p className="mt-1 text-sm text-[#62594e] max-w-sm mx-auto">
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
            <div className="border-b border-[#efe8d8] pb-4">
              <h2 className="font-display text-base font-bold text-[#231f1b]">
                Hypothetical Refinancing Quote
              </h2>
              <p className="text-xs text-[#62594e] mt-0.5">
                Enter proposed interest rates and term lengths from any lender.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {/* Proposed Interest Rate */}
              <div>
                <label htmlFor="refinancing-field-1" className="block text-xs font-medium text-[#4a4239] mb-1.5">
                  Proposed interest rate (%)
                </label>
                <div className="relative">
                  <input id="refinancing-field-1"
                    className="cp-input pr-7 font-mono font-semibold tabular-nums"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    required
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#62594e]">%</span>
                </div>
                <span className="text-xs text-[#62594e] mt-1 block">
                  Current weighted portfolio average is{' '}
                  <strong className="text-[#231f1b]">{currentWeightedRate.toFixed(2)}%</strong>
                </span>
              </div>

              {/* Term Duration */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[#4a4239]">
                    New loan term
                  </label>
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setUseYears(true)}
                      className={`px-3 py-1.5 rounded font-medium transition-colors ${
                        useYears ? 'bg-[#14594a] text-white' : 'text-[#62594e] hover:text-[#231f1b]'
                      }`}
                    >
                      Years
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseYears(false)}
                      className={`px-3 py-1.5 rounded font-medium transition-colors ${
                        !useYears ? 'bg-[#14594a] text-white' : 'text-[#62594e] hover:text-[#231f1b]'
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
                            ? 'bg-[#f4b942] text-[#231f1b] border-[#14594a] shadow-xs'
                            : 'bg-[#fffdf8] border-[#e4dccb] text-[#3d3630] hover:bg-[#f6f1e7]'
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
                <span className="text-xs text-[#62594e] mt-1 block">
                  Active term: <strong>{effectiveTermMonths} months</strong> ({(effectiveTermMonths / 12).toFixed(1)} years)
                </span>
              </div>

              {/* Origination Fees */}
              <div>
                <label htmlFor="refinancing-field-2" className="block text-xs font-medium text-[#4a4239] mb-1.5">
                  Origination / closing fees ({symbol})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#62594e] select-none pointer-events-none">{symbol}</span>
                  <input id="refinancing-field-2"
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
                <span className="text-xs text-[#62594e] mt-1 block">
                  Most reputable student loan refinancers charge {money(0)} origination fees.
                </span>
              </div>

              {/* Fee Treatment */}
              {Number(fees) > 0 && (
                <div>
                  <label className="block text-xs font-medium text-[#4a4239] mb-1.5">
                    Fee treatment
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setFeeTreatment('upfront')}
                      className={`p-2.5 rounded-lg border text-left font-medium transition-colors ${
                        feeTreatment === 'upfront'
                          ? 'border-[#14594a] bg-[#e6f0e9] text-[#14594a]'
                          : 'border-[#e4dccb] bg-[#fffdf8] text-[#4a4239] hover:bg-[#f6f1e7]'
                      }`}
                    >
                      <div>Paid Upfront</div>
                      <div className="text-xs text-[#62594e] font-normal">Out of pocket at close</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeeTreatment('financed')}
                      className={`p-2.5 rounded-lg border text-left font-medium transition-colors ${
                        feeTreatment === 'financed'
                          ? 'border-[#14594a] bg-[#e6f0e9] text-[#14594a]'
                          : 'border-[#e4dccb] bg-[#fffdf8] text-[#4a4239] hover:bg-[#f6f1e7]'
                      }`}
                    >
                      <div>Financed in Loan</div>
                      <div className="text-xs text-[#62594e] font-normal">Added to principal</div>
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
                    <span>Calculating math…</span>
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
                    <span className="text-xs font-medium text-[#62594e]">
                      Monthly payment impact
                    </span>
                    <div className="font-display text-2xl sm:text-3xl font-bold tabular-nums text-[#231f1b]">
                      {money(result.proposed_monthly_payment)}
                      <span className="text-xs font-normal text-[#62594e]">/mo</span>
                    </div>

                    <div
                      className={`text-xs font-semibold flex items-center gap-1.5 ${
                        isLowerMonthly ? 'text-[#15803d]' : 'text-[#3d3630]'
                      }`}
                    >
                      {isLowerMonthly ? (
                        <>
                          <TrendingDown className="h-4 w-4 text-[#15803d]" />
                          Lowers monthly bill by {money(Math.abs(Number(result.monthly_payment_difference)))}/mo
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-4 w-4 text-[#62594e]" />
                          Increases monthly bill by {money(Math.abs(Number(result.monthly_payment_difference)))}/mo
                        </>
                      )}
                    </div>
                    <p className="text-xs text-[#62594e] pt-2 border-t border-[#efe8d8]">
                      Compared to current combined minimum of {money(result.current_monthly_payment)}/mo.
                    </p>
                  </div>

                  {/* Total Cost Impact */}
                  <div className="cp-card p-5 space-y-2">
                    <span className="text-xs font-medium text-[#62594e]">
                      Lifetime total cost impact
                    </span>
                    <div className="font-display text-2xl sm:text-3xl font-bold tabular-nums text-[#231f1b]">
                      {money(result.proposed_total_cost)}
                    </div>

                    <div
                      className={`text-xs font-semibold flex items-center gap-1.5 ${
                        isLowerTotalCost ? 'text-[#0f6b53]' : 'text-[#b91c1c]'
                      }`}
                    >
                      {isLowerTotalCost ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-[#0f6b53]" />
                          Saves {money(Math.abs(Number(result.total_cost_difference)))} in total lifetime interest
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-[#b91c1c]" />
                          Costs {money(Math.abs(Number(result.total_cost_difference)))} MORE over lifetime
                        </>
                      )}
                    </div>
                    <p className="text-xs text-[#62594e] pt-2 border-t border-[#efe8d8]">
                      Compared to baseline cost of {money(result.current_estimated_total_cost)}.
                    </p>
                  </div>
                </div>

                {/* Educational Callout: Lower Payment Trap */}
                {isLowerMonthly && !isLowerTotalCost && (
                  <div className="rounded-xl border border-[#fecaca] bg-[#fff5f5] p-4 text-xs text-[#991b1b] space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-[#b91c1c]" />
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
                  <div className="px-5 py-3.5 bg-[#f6f1e7] border-b border-[#e4dccb] flex items-center justify-between">
                    <h3 className="font-display text-sm font-bold text-[#231f1b]">
                      Side-by-Side Financial Breakdown
                    </h3>
                    <span className="text-xs text-[#62594e]">Current vs. Refinanced</span>
                  </div>

                  <div className="divide-y divide-[#efe8d8] text-xs sm:text-sm">
                    <div className="py-3 px-5 flex justify-between items-center">
                      <span className="text-[#62594e]">Principal Refinanced</span>
                      <span className="font-display font-semibold tabular-nums text-[#231f1b]">
                        {money(totalBalance)}
                      </span>
                    </div>

                    <div className="py-3 px-5 flex justify-between items-center">
                      <span className="text-[#62594e]">Interest Rate</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[#62594e] line-through tabular-nums">
                          {currentWeightedRate.toFixed(2)}%
                        </span>
                        <span className="font-display font-bold tabular-nums text-[#14594a]">
                          {Number(rate).toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <div className="py-3 px-5 flex justify-between items-center">
                      <span className="text-[#62594e]">Repayment Term</span>
                      <span className="text-[#3d3630]">
                        {effectiveTermMonths} months ({(effectiveTermMonths / 12).toFixed(1)} yrs)
                      </span>
                    </div>

                    <div className="py-3 px-5 flex justify-between items-center">
                      <span className="text-[#62594e]">Estimated Total Interest</span>
                      <span className="font-display font-semibold tabular-nums text-[#231f1b]">
                        {money(result.proposed_total_interest)}
                      </span>
                    </div>

                    <div className="py-3 px-5 flex justify-between items-center">
                      <span className="text-[#62594e]">Origination / Closing Fees</span>
                      <span className="font-display tabular-nums text-[#3d3630]">
                        {money(fees)} ({feeTreatment})
                      </span>
                    </div>

                    <div className="py-3.5 px-5 flex justify-between items-center bg-[#f6f1e7]">
                      <span className="font-bold text-[#231f1b]">Total Repayment Outflow</span>
                      <span className="font-display font-bold tabular-nums text-[#231f1b]">
                        {money(result.proposed_total_cost)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Break-even explanation */}
                {result.break_even_explanation && (
                  <div className="cp-card p-4 text-xs text-[#3d3630] space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-[#231f1b]">
                      <Clock className="h-4 w-4 text-[#14594a]" />
                      <span>Break-Even Analysis</span>
                    </div>
                    <p className="leading-relaxed text-[#62594e]">
                      {localizeAmounts(result.break_even_explanation)}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="cp-card p-8 text-center text-sm text-[#62594e]">
                Click &ldquo;Calculate Refinance Outcome&rdquo; to model results.
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

