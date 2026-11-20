import React, { useState } from 'react';
import { StrategyComparisonResult, StrategyType } from '../types';
import { StrategyCard } from '../components/StrategyCard';
import { RepaymentChart } from '../components/RepaymentChart';
import { ScheduleTable } from '../components/ScheduleTable';
import { formatCurrency, formatDuration } from '../utils/formatters';

interface StrategyComparisonPageProps {
  comparison: StrategyComparisonResult | null;
  extraPayment: number;
  setExtraPayment: (amount: number) => void;
  onNavigate: (tab: string) => void;
  calculationError: string | null;
  isCalculating: boolean;
}

export const StrategyComparisonPage: React.FC<StrategyComparisonPageProps> = ({
  comparison,
  extraPayment,
  setExtraPayment,
  onNavigate,
  calculationError,
  isCalculating,
}) => {
  const [selectedScheduleStrategy, setSelectedScheduleStrategy] = useState<StrategyType>('avalanche');

  if (isCalculating) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center" role="status" aria-busy="true">
        <span className="loading-spinner mx-auto mb-4" aria-hidden="true" />
        <p className="text-zinc-900 font-semibold text-lg">Calculating repayment scenarios</p>
        <p className="text-sm text-zinc-400 mt-2">Your current loan details are being processed.</p>
      </div>
    );
  }

  if (!comparison || comparison.loan_count === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-zinc-900 font-semibold text-lg">
          {calculationError ? 'Calculation unavailable' : 'No loans to compare'}
        </p>
        <p className="text-sm text-zinc-400 mt-2 max-w-sm mx-auto">
          {calculationError
            ? 'Review your loan details or retry the calculation.'
            : 'Add your student loans first to generate repayment scenarios.'}
        </p>
        <button
          onClick={() => onNavigate('loans')}
          className="mt-6 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-700 text-white rounded text-sm font-semibold transition-colors"
        >
          {calculationError ? 'Review loans' : 'Add loans'}
        </button>
      </div>
    );
  }

  const { baseline, avalanche, snowball } = comparison;

  return (
    <div className="product-page max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Header + extra payment control */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-zinc-100">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Strategy comparison</h2>
          <p className="text-sm text-zinc-400 mt-0.5">
            Three repayment approaches modeled from your loan data.
          </p>
        </div>

        <div className="w-full lg:w-80 bg-white border border-zinc-200 rounded-lg p-4 space-y-2.5 shrink-0">
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-500">Extra monthly payment</span>
            <span className="font-mono font-semibold text-zinc-900 tabular-nums text-sm">
              {formatCurrency(extraPayment)}/mo
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1500"
            step="25"
            value={extraPayment}
            onChange={(e) => setExtraPayment(Number(e.target.value))}
            className="w-full cursor-pointer accent-zinc-900"
          />
          <div className="flex items-center justify-between text-[11px] text-zinc-300 font-mono">
            <span>$0</span>
            <span>$1,500</span>
          </div>
        </div>
      </div>

      {/* Strategy cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StrategyCard summary={baseline} />
        <StrategyCard
          summary={avalanche}
          isRecommendedInterest={
            avalanche.is_amortizing &&
            baseline.is_amortizing &&
            (avalanche.total_interest_paid || 0) <= (snowball.total_interest_paid || 0)
          }
        />
        <StrategyCard summary={snowball} />
      </div>

      {/* Comparison table */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-900">At a glance</span>
          <span className="text-xs text-zinc-400">3 scenarios</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-100">
              <tr className="text-[11px] text-zinc-400 font-medium">
                <th className="py-3 px-5">Metric</th>
                <th className="py-3 px-5">Baseline</th>
                <th className="py-3 px-5">Avalanche</th>
                <th className="py-3 px-5">Snowball</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              <tr>
                <td className="py-3 px-5 text-zinc-500">Priority</td>
                <td className="py-3 px-5 text-zinc-400">None</td>
                <td className="py-3 px-5 text-zinc-700 font-medium">Highest rate first</td>
                <td className="py-3 px-5 text-zinc-700 font-medium">Smallest balance first</td>
              </tr>
              <tr>
                <td className="py-3 px-5 text-zinc-500">Debt-free date</td>
                <td className="py-3 px-5 font-mono font-semibold text-zinc-900 tabular-nums">
                  {baseline.estimated_debt_free_date || '—'}
                </td>
                <td className="py-3 px-5 font-mono font-semibold text-zinc-900 tabular-nums">
                  {avalanche.estimated_debt_free_date || '—'}
                </td>
                <td className="py-3 px-5 font-mono font-semibold text-zinc-900 tabular-nums">
                  {snowball.estimated_debt_free_date || '—'}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-5 text-zinc-500">Duration</td>
                <td className="py-3 px-5 text-zinc-700">{formatDuration(baseline.payoff_months)}</td>
                <td className="py-3 px-5 text-zinc-700">{formatDuration(avalanche.payoff_months)}</td>
                <td className="py-3 px-5 text-zinc-700">{formatDuration(snowball.payoff_months)}</td>
              </tr>
              <tr>
                <td className="py-3 px-5 text-zinc-500">Total interest</td>
                <td className="py-3 px-5 font-mono text-zinc-700 tabular-nums">
                  {formatCurrency(baseline.total_interest_paid)}
                </td>
                <td className="py-3 px-5 font-mono font-semibold text-zinc-900 tabular-nums">
                  {formatCurrency(avalanche.total_interest_paid)}
                </td>
                <td className="py-3 px-5 font-mono font-semibold text-zinc-900 tabular-nums">
                  {formatCurrency(snowball.total_interest_paid)}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-5 text-zinc-500">Total repaid</td>
                <td className="py-3 px-5 font-mono text-zinc-700 tabular-nums">
                  {formatCurrency(baseline.total_amount_repaid)}
                </td>
                <td className="py-3 px-5 font-mono text-zinc-700 tabular-nums">
                  {formatCurrency(avalanche.total_amount_repaid)}
                </td>
                <td className="py-3 px-5 font-mono text-zinc-700 tabular-nums">
                  {formatCurrency(snowball.total_amount_repaid)}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-5 text-zinc-500">Interest saved</td>
                <td className="py-3 px-5 text-zinc-300">—</td>
                <td className="py-3 px-5 font-mono font-semibold text-zinc-900 tabular-nums">
                  {formatCurrency(avalanche.interest_saved_vs_baseline)}
                </td>
                <td className="py-3 px-5 font-mono font-semibold text-zinc-900 tabular-nums">
                  {formatCurrency(snowball.interest_saved_vs_baseline)}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-5 text-zinc-500">Time saved</td>
                <td className="py-3 px-5 text-zinc-300">—</td>
                <td className="py-3 px-5 text-zinc-700">
                  {formatDuration(avalanche.time_saved_months_vs_baseline)}
                </td>
                <td className="py-3 px-5 text-zinc-700">
                  {formatDuration(snowball.time_saved_months_vs_baseline)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart */}
      <RepaymentChart comparison={comparison} />

      {/* Amortization schedule */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Amortization schedule</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Month-by-month balances and payment breakdown.</p>
          </div>

          {/* Strategy tabs */}
          <div className="flex bg-zinc-100 p-0.5 rounded gap-0.5 text-xs font-medium">
            {(['avalanche', 'snowball', 'baseline'] as StrategyType[]).map((s) => (
              <button
                key={s}
                onClick={() => setSelectedScheduleStrategy(s)}
                className={`px-3 py-1.5 rounded transition-colors capitalize ${
                  selectedScheduleStrategy === s
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <ScheduleTable
          schedule={comparison[selectedScheduleStrategy].schedule}
          strategyName={selectedScheduleStrategy}
        />
      </div>
    </div>
  );
};
