import React from 'react';
import { RepaymentSummary, StrategyType } from '../types';
import { formatCurrency, formatDuration } from '../utils/formatters';

interface StrategyCardProps {
  summary: RepaymentSummary;
  isRecommendedInterest?: boolean;
}

export const StrategyCard: React.FC<StrategyCardProps> = ({
  summary,
  isRecommendedInterest,
}) => {
  const getStrategyMeta = (strategy: StrategyType) => {
    switch (strategy) {
      case 'avalanche':
        return {
          title: 'Debt Avalanche',
          rule: 'Highest Interest First',
          badge: 'Lowest total interest',
          description:
            'Focuses extra payment on the loan with the highest interest rate. Mathematically minimizes total interest paid.',
        };
      case 'snowball':
        return {
          title: 'Debt Snowball',
          rule: 'Smallest Balance First',
          badge: 'Fastest account payoffs',
          description:
            'Focuses extra payment on the smallest loan balance first. Eliminates individual loan accounts earliest.',
        };
      case 'baseline':
      default:
        return {
          title: 'Minimum Baseline',
          rule: 'Scheduled Minimums Only',
          badge: 'No extra payments',
          description:
            'Pays only the minimum payment due on each loan. No extra monthly funds and no payment rollover.',
        };
    }
  };

  const meta = getStrategyMeta(summary.strategy);
  const firstPayoff = summary.schedule
    .flatMap((month) => month.loans_detail.map((loan) => ({ loan, month })))
    .find(({ loan }) => loan.is_paid_off);

  if (!summary.is_amortizing) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-zinc-900 text-base">{meta.title}</h3>
            <span className="text-[11px] text-zinc-500 font-mono">{meta.rule}</span>
          </div>

          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-700 space-y-1 my-4">
            <div className="font-semibold text-zinc-900">Non-Amortizing Strategy</div>
            <p className="text-zinc-500">
              {summary.warning_message ||
                'One or more loans have payments insufficient to cover monthly interest.'}
            </p>
          </div>
        </div>

        <p className="text-xs text-zinc-400 mt-2">{meta.description}</p>
      </div>
    );
  }

  return (
    <div
      className={`strategy-card bg-white rounded-xl border ${
        isRecommendedInterest ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200'
      } p-6 flex flex-col justify-between transition-shadow`}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-zinc-900 text-base">{meta.title}</h3>
            <span className="text-xs text-zinc-500">{meta.rule}</span>
          </div>

          {summary.strategy !== 'baseline' && summary.interest_saved_vs_baseline !== null && (
            <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
              Save {formatCurrency(summary.interest_saved_vs_baseline)}
            </span>
          )}
        </div>

        {/* Primary Timeline Block */}
        <div className="py-4 border-y border-zinc-100 my-2">
          <span className="text-[11px] text-zinc-400 font-sans block mb-1">
            Estimated Debt-Free
          </span>
          <div className="text-2xl font-bold text-zinc-950 font-mono tracking-tight">
            {summary.estimated_debt_free_date || 'N/A'}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">
            {formatDuration(summary.payoff_months)}
          </div>
        </div>

        {/* Breakdown rows */}
        <div className="space-y-2.5 text-xs font-mono pt-3">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 font-sans">Total Interest</span>
            <span className="font-semibold text-zinc-900 tabular-nums">
              {formatCurrency(summary.total_interest_paid)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-zinc-500 font-sans">Total Repaid</span>
            <span className="font-semibold text-zinc-900 tabular-nums">
              {formatCurrency(summary.total_amount_repaid)}
            </span>
          </div>

          {summary.strategy !== 'baseline' && summary.time_saved_months_vs_baseline !== null && (
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 font-sans">Time Saved</span>
              <span className="font-semibold text-emerald-700 tabular-nums font-sans">
                {formatDuration(summary.time_saved_months_vs_baseline)}
              </span>
            </div>
          )}
        </div>

        {firstPayoff && summary.strategy !== 'baseline' && (
          <div className="strategy-milestone">
            <span>First payoff</span>
            <strong>{firstPayoff.loan.loan_name}</strong>
            <p>{firstPayoff.month.year_month}</p>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-400 mt-6 pt-4 border-t border-zinc-100 leading-relaxed font-sans">
        {meta.description}
      </p>
    </div>
  );
};
