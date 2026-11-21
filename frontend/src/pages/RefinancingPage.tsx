import React, { useEffect, useState } from 'react';
import { LoanInput, RefinanceInput, RefinanceSummary, FeeTreatment } from '../types';
import { formatCurrency, formatPercent, formatDuration } from '../utils/formatters';
import { calculateClientRefinance } from '../services/calculationEngine';
import { apiService } from '../services/api';

interface RefinancingPageProps {
  loans: LoanInput[];
  onNavigate: (tab: string) => void;
}

export const RefinancingPage: React.FC<RefinancingPageProps> = ({ loans, onNavigate }) => {
  const [proposedRate, setProposedRate] = useState<string>('5.25');
  const [termYears, setTermYears] = useState<number>(7);
  const [customMonths, setCustomMonths] = useState<string>('84');
  const [useYears, setUseYears] = useState<boolean>(true);
  const [fees, setFees] = useState<string>('0');
  const [feeTreatment, setFeeTreatment] = useState<FeeTreatment>('upfront');
  const [apiSummary, setApiSummary] = useState<{ requestKey: string; summary: RefinanceSummary } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const rawTermMonths = useYears ? termYears * 12 : Number.parseInt(customMonths, 10);
  const parsedRate = Number.parseFloat(proposedRate);
  const parsedFees = Number.parseFloat(fees);
  const validationErrors = [
    !Number.isFinite(parsedRate) || parsedRate < 0 || parsedRate > 30
      ? 'Enter a proposed rate between 0% and 30%.'
      : null,
    !Number.isInteger(rawTermMonths) || rawTermMonths < 6 || rawTermMonths > 360
      ? 'Enter a term between 6 and 360 months.'
      : null,
    !Number.isFinite(parsedFees) || parsedFees < 0 || parsedFees > 500000
      ? 'Enter fees between $0 and $500,000.'
      : null,
  ].filter((message): message is string => message !== null);
  const isOfferValid = validationErrors.length === 0;
  const effectiveTermMonths = Number.isInteger(rawTermMonths) && rawTermMonths > 0 ? rawTermMonths : 12;
  const hasFederalLoans = loans.some((l) => l.loan_type === 'Federal');

  const currentWeightedRate =
    loans.reduce((a, l) => a + l.balance * l.interest_rate, 0) /
    loans.reduce((a, l) => a + l.balance, 0);

  const refinanceInput: RefinanceInput = {
    proposed_interest_rate: isOfferValid ? parsedRate : 0,
    term_months: effectiveTermMonths,
    fees: isOfferValid ? parsedFees : 0,
    fee_treatment: feeTreatment,
    has_federal_loans: hasFederalLoans,
  };
  const requestKey = JSON.stringify({ loans, refinanceInput });

  useEffect(() => {
    let isCurrent = true;

    if (loans.length === 0 || !isOfferValid) {
      setApiSummary(null);
      setIsCalculating(false);
      setApiError(null);
      return () => {
        isCurrent = false;
      };
    }

    setIsCalculating(true);
    setApiError(null);
    apiService.calculateRefinance(loans, refinanceInput).then((result) => {
      if (isCurrent) {
        setApiSummary({ requestKey, summary: result });
        setIsCalculating(false);
      }
    }).catch((error: unknown) => {
      if (isCurrent) {
        console.error('Refinance calculation failed:', error);
        setApiError('We could not calculate this refinance scenario. Review the offer details or try again.');
        setIsCalculating(false);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [loans, isOfferValid, parsedRate, effectiveTermMonths, parsedFees, feeTreatment, hasFederalLoans, requestKey]);

  if (loans.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-zinc-900 font-semibold text-lg">No loans to refinance</p>
        <p className="text-sm text-zinc-400 mt-2 max-w-sm mx-auto">
          Enter your existing loans first so we can compare terms against a hypothetical offer.
        </p>
        <button
          onClick={() => onNavigate('loans')}
          className="mt-6 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-700 text-white rounded text-sm font-semibold transition-colors"
        >
          Add loans
        </button>
      </div>
    );
  }

  const summary = isOfferValid && !apiError
    ? apiSummary?.requestKey === requestKey
      ? apiSummary.summary
      : calculateClientRefinance(loans, refinanceInput)
    : null;

  const isLowerMonthly = summary !== null && summary.monthly_payment_difference < 0;
  const isLowerTotalCost =
    summary !== null && summary.total_cost_difference !== null && summary.total_cost_difference < 0;

  return (
    <div className="product-page max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Refinancing analysis</h2>
        <p className="text-sm text-zinc-400 mt-0.5">
          Hypothetical — no credit inquiry or lender application is initiated.
        </p>
      </div>

      {/* Federal warning */}
      {hasFederalLoans && (
        <div className="border-l-2 border-amber-400 bg-amber-50 px-5 py-4 rounded-r text-sm">
          <p className="font-semibold text-amber-900">Federal loan warning</p>
          <p className="text-amber-800 text-xs mt-1 leading-relaxed">
            Your portfolio includes federal loans. Refinancing them into a private loan permanently
            eliminates income-driven repayment (IDR/SAVE/PAYE), Public Service Loan Forgiveness
            (PSLF), federal deferment, and disability discharge. This cannot be reversed.
          </p>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h3 className="text-sm font-semibold text-zinc-900">Hypothetical offer</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Enter proposed terms from any quote or scenario.</p>
          </div>

          <div className="px-5 py-5 space-y-5">
            {/* Proposed rate */}
            <div>
              <label htmlFor="proposed-rate" className="block text-xs font-medium text-zinc-700 mb-1.5">
                Proposed interest rate
              </label>
              <div className="relative">
                <input
                  id="proposed-rate"
                  type="number"
                  step="0.05"
                  min="0"
                  max="30"
                  value={proposedRate}
                  onChange={(e) => setProposedRate(e.target.value)}
                  aria-invalid={!Number.isFinite(parsedRate) || parsedRate < 0 || parsedRate > 30}
                  aria-describedby={!isOfferValid ? 'refinance-validation-errors' : undefined}
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded text-sm text-zinc-900 font-mono focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200"
                />
                <span className="absolute right-3.5 top-2.5 text-zinc-400 text-sm">%</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Current weighted average is <strong>{formatPercent(currentWeightedRate)}</strong>.
              </p>
            </div>

            {/* Term */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-zinc-700">New term</label>
                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setUseYears(true)}
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                      useYears ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-zinc-700'
                    }`}
                  >
                    Years
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseYears(false)}
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                      !useYears ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-zinc-700'
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
                      className={`py-2 text-xs font-medium rounded border transition-colors ${
                        termYears === yr
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
                      }`}
                    >
                      {yr} yr
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  aria-label="New term in months"
                  type="number"
                  min="6"
                  max="360"
                  value={customMonths}
                  onChange={(e) => setCustomMonths(e.target.value)}
                  placeholder="e.g. 84"
                  aria-invalid={!Number.isInteger(rawTermMonths) || rawTermMonths < 6 || rawTermMonths > 360}
                  aria-describedby={!isOfferValid ? 'refinance-validation-errors' : undefined}
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded text-sm text-zinc-900 font-mono focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200"
                />
              )}
              <p className="text-[11px] text-zinc-400 mt-1">
                {effectiveTermMonths} monthly payments ({(effectiveTermMonths / 12).toFixed(1)} years)
              </p>
            </div>

            {/* Fees */}
            <div>
              <label htmlFor="refi-fees" className="block text-xs font-medium text-zinc-700 mb-1.5">
                Origination / closing fees
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-zinc-400 text-sm">$</span>
                <input
                  id="refi-fees"
                  type="number"
                  step="50"
                  min="0"
                  max="500000"
                  value={fees}
                  onChange={(e) => setFees(e.target.value)}
                  aria-invalid={!Number.isFinite(parsedFees) || parsedFees < 0 || parsedFees > 500000}
                  aria-describedby={!isOfferValid ? 'refinance-validation-errors' : undefined}
                  className="w-full pl-8 pr-3.5 py-2.5 border border-zinc-200 rounded text-sm text-zinc-900 font-mono focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200"
                />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">Most lenders charge $0 origination fees.</p>
            </div>

            {/* Fee treatment */}
            {parsedFees > 0 && (
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">Fee treatment</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['upfront', 'financed'] as FeeTreatment[]).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFeeTreatment(opt)}
                      className={`p-3 rounded border text-left text-xs transition-colors ${
                        feeTreatment === opt
                          ? 'border-zinc-900 bg-zinc-50 text-zinc-900'
                          : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'
                      }`}
                    >
                      <div className="font-medium capitalize">{opt === 'upfront' ? 'Paid upfront' : 'Financed'}</div>
                      <div className="text-zinc-400 text-[11px] mt-0.5">
                        {opt === 'upfront' ? 'Out of pocket at closing' : 'Added to principal balance'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-7 space-y-5">
          {isCalculating && isOfferValid && (
            <p className="flex items-center gap-2 text-xs text-zinc-400" role="status" aria-busy="true">
              <span className="loading-spinner loading-spinner--small" aria-hidden="true" />
              Refreshing the server-calculated estimate…
            </p>
          )}
          {!isOfferValid && (
            <div className="refinance-input-notice" role="status">
              <p>Complete the offer details to see a reliable comparison.</p>
              <ul id="refinance-validation-errors">{validationErrors.map((error) => <li key={error}>{error}</li>)}</ul>
            </div>
          )}
          {apiError && <div className="refinance-input-notice" role="alert">{apiError}</div>}
          {summary && (
            <>
          {/* Two impact cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Monthly payment */}
            <div className="bg-white border border-zinc-200 rounded-lg px-5 py-5 space-y-2">
              <div className="text-[11px] text-zinc-400">Monthly payment</div>
              <div className="text-2xl font-mono font-semibold text-zinc-900 tabular-nums">
                {formatCurrency(summary.proposed_monthly_payment)}
                <span className="text-zinc-400 text-sm font-normal">/mo</span>
              </div>
              <div className={`text-xs font-medium ${isLowerMonthly ? 'text-zinc-700' : 'text-zinc-500'}`}>
                {isLowerMonthly
                  ? `↓ ${formatCurrency(Math.abs(summary.monthly_payment_difference))}/mo less`
                  : `↑ ${formatCurrency(Math.abs(summary.monthly_payment_difference))}/mo more`}
              </div>
              <p className="text-[11px] text-zinc-400 pt-2 border-t border-zinc-50">
                vs. current {formatCurrency(summary.current_monthly_payment)}/mo combined minimum
              </p>
            </div>

            {/* Total cost */}
            <div className="bg-white border border-zinc-200 rounded-lg px-5 py-5 space-y-2">
              <div className="text-[11px] text-zinc-400">Lifetime total cost</div>
              <div className="text-2xl font-mono font-semibold text-zinc-900 tabular-nums">
                {formatCurrency(summary.proposed_total_cost)}
              </div>
              <div className={`text-xs font-medium ${isLowerTotalCost ? 'text-zinc-700' : 'text-zinc-500'}`}>
                {summary.total_cost_difference === null
                  ? 'Current payoff cost is not calculable'
                  : isLowerTotalCost
                    ? `↓ ${formatCurrency(Math.abs(summary.total_cost_difference))} total savings`
                    : `↑ ${formatCurrency(Math.abs(summary.total_cost_difference))} more over time`}
              </div>
              <p className="text-[11px] text-zinc-400 pt-2 border-t border-zinc-50">
                vs. current{' '}
                {summary.current_estimated_total_cost === null
                  ? 'cost unavailable'
                  : `${formatCurrency(summary.current_estimated_total_cost)} baseline`}
              </p>
            </div>
          </div>

          {summary.current_cost_warning && (
            <div className="refinance-input-notice" role="note">
              <p>Current total-cost comparison unavailable</p>
              <p>{summary.current_cost_warning}</p>
            </div>
          )}

          {/* Lower payment trap */}
          {isLowerMonthly && summary.total_cost_difference !== null && !isLowerTotalCost && (
            <div className="border border-zinc-200 rounded bg-zinc-50 px-5 py-4 text-xs text-zinc-700 space-y-1">
              <p className="font-semibold text-zinc-900">Lower payment, higher total cost</p>
              <p className="leading-relaxed text-zinc-500">
                This offer reduces your monthly bill by{' '}
                <strong className="text-zinc-700">{formatCurrency(Math.abs(summary.monthly_payment_difference))}/month</strong>,
                but extending to {effectiveTermMonths} months means you pay{' '}
                <strong className="text-zinc-700">{formatCurrency(Math.abs(summary.total_cost_difference))} more</strong> in
                total interest over the life of the loan.
              </p>
            </div>
          )}

          {/* Detailed breakdown */}
          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-900">Cost breakdown</span>
              <span className="text-xs text-zinc-400 font-mono">Current → Refinanced</span>
            </div>
            <div className="divide-y divide-zinc-50 text-xs">
              {[
                ['Principal refinanced', formatCurrency(summary.principal_refinanced)],
                [
                  'Interest rate',
                  <span className="flex items-center gap-3 font-mono tabular-nums">
                    <span className="text-zinc-300 line-through">{formatPercent(currentWeightedRate)}</span>
                    <span className="text-zinc-900 font-semibold">{formatPercent(summary.proposed_rate)}</span>
                  </span>,
                ],
                ['Repayment term', formatDuration(summary.term_months)],
                ['Estimated total interest', <span className="font-mono tabular-nums">{formatCurrency(summary.proposed_total_interest)}</span>],
                ['Origination fees', <span className="font-mono tabular-nums">{formatCurrency(summary.fees)} ({summary.fee_treatment})</span>],
              ].map(([label, value]) => (
                <div key={String(label)} className="py-3 px-5 flex justify-between items-center">
                  <span className="text-zinc-500">{label}</span>
                  <span className="text-zinc-700">{value}</span>
                </div>
              ))}
              <div className="py-3.5 px-5 flex justify-between items-center bg-zinc-50/60">
                <span className="font-semibold text-zinc-900 text-sm">Total repayment outflow</span>
                <span className="font-mono font-semibold text-zinc-900 text-sm tabular-nums">
                  {formatCurrency(summary.proposed_total_cost)}
                </span>
              </div>
            </div>
          </div>

          {/* Break-even */}
          {summary.break_even_explanation && (
            <div className="border border-zinc-200 rounded bg-white px-5 py-4 text-xs space-y-1">
              <p className="font-semibold text-zinc-900">Break-even</p>
              <p className="text-zinc-500 leading-relaxed">{summary.break_even_explanation}</p>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
