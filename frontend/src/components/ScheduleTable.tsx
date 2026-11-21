import React, { useState } from 'react';
import { MonthSchedule } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ScheduleTableProps {
  schedule: MonthSchedule[];
  strategyName: string;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({ schedule, strategyName }) => {
  const [expandedMonths, setExpandedMonths] = useState<Record<number, boolean>>({});
  const [displayCount, setDisplayCount] = useState<number>(24);

  const toggleMonth = (mIdx: number) => {
    setExpandedMonths((prev) => ({ ...prev, [mIdx]: !prev[mIdx] }));
  };

  if (!schedule || schedule.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-400 bg-white border border-zinc-200 rounded-lg text-sm">
        No schedule available for {strategyName}.
      </div>
    );
  }

  const visibleSchedule = schedule.slice(0, displayCount);

  return (
    <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-zinc-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <span className="text-sm font-semibold text-zinc-900 capitalize">{strategyName}</span>
          <span className="text-xs text-zinc-400 ml-2">— {schedule.length} months</span>
        </div>
        <span className="text-xs text-zinc-400">
          Showing {Math.min(displayCount, schedule.length)} of {schedule.length}
        </span>
      </div>

      {/* Table */}
      <div
        className="overflow-x-auto"
        role="region"
        aria-label={`${strategyName} monthly repayment schedule`}
        tabIndex={0}
      >
        <table className="w-full text-left">
          <caption className="sr-only">{strategyName} monthly repayment schedule</caption>
          <thead className="border-b border-zinc-100">
            <tr className="text-[11px] text-zinc-400 font-medium">
              <th scope="col" className="py-2.5 px-4 w-8">Details</th>
              <th scope="col" className="py-2.5 px-4">Month</th>
              <th scope="col" className="py-2.5 px-4 text-right font-mono">Payment</th>
              <th scope="col" className="py-2.5 px-4 text-right font-mono">Principal</th>
              <th scope="col" className="py-2.5 px-4 text-right font-mono">Interest</th>
              <th scope="col" className="py-2.5 px-4 text-right font-mono">Balance</th>
              <th scope="col" className="py-2.5 px-4 text-center">Loans</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {visibleSchedule.map((row) => {
              const isExpanded = !!expandedMonths[row.month_index];
              return (
                <React.Fragment key={row.month_index}>
                  <tr className="hover:bg-zinc-50 text-xs">
                    <td className="py-2.5 px-4 text-center text-zinc-300 select-none">
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for month ${row.month_index}`}
                        onClick={() => toggleMonth(row.month_index)}
                        className="min-w-6 min-h-6 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-700"
                      >
                        {isExpanded ? '▾' : '▸'}
                      </button>
                    </td>
                    <th scope="row" className="py-2.5 px-4 text-zinc-700 font-normal">
                      <span className="font-medium">{row.month_index}</span>
                      <span className="text-zinc-400 ml-1.5 font-mono text-[11px]">{row.year_month}</span>
                    </th>
                    <td className="py-2.5 px-4 text-right font-mono text-zinc-900 font-semibold tabular-nums">
                      {formatCurrency(row.total_payment)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-zinc-700 tabular-nums">
                      {formatCurrency(row.total_principal)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-zinc-400 tabular-nums">
                      {formatCurrency(row.total_interest)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-zinc-900 tabular-nums">
                      {formatCurrency(row.remaining_balance)}
                    </td>
                    <td className="py-2.5 px-4 text-center text-zinc-400 tabular-nums">
                      {row.active_loans_count}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-zinc-50/60">
                      <td colSpan={7} className="px-5 py-3">
                        <div className="border border-zinc-100 rounded bg-white divide-y divide-zinc-50">
                          {row.loans_detail.map((loan) => (
                            <div
                              key={loan.loan_id}
                              className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex items-center gap-2 text-zinc-800">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${loan.is_paid_off ? 'bg-zinc-300' : 'bg-zinc-500'}`}
                                />
                                <span className={loan.is_paid_off ? 'text-zinc-400 line-through' : 'font-medium'}>
                                  {loan.loan_name}
                                </span>
                                {loan.is_paid_off && (
                                  <span className="text-[10px] font-semibold text-zinc-500 border border-zinc-200 px-1.5 py-px rounded">
                                    paid off
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-5 font-mono text-[11px] text-zinc-500 tabular-nums">
                                <span>
                                  <span className="text-zinc-300 mr-1">pmt</span>
                                  {formatCurrency(loan.payment_applied)}
                                </span>
                                <span>
                                  <span className="text-zinc-300 mr-1">prin</span>
                                  {formatCurrency(loan.principal_paid)}
                                </span>
                                <span>
                                  <span className="text-zinc-300 mr-1">int</span>
                                  {formatCurrency(loan.interest_charged)}
                                </span>
                                <span className="font-semibold text-zinc-700">
                                  {formatCurrency(loan.closing_balance)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Load more */}
      {visibleSchedule.length < schedule.length && (
        <div className="p-4 border-t border-zinc-100 text-center">
          <button
            onClick={() => setDisplayCount((prev) => Math.min(prev + 24, schedule.length))}
            className="text-xs text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
          >
            Load 24 more &middot; {schedule.length - visibleSchedule.length} remaining
          </button>
        </div>
      )}
    </div>
  );
};
