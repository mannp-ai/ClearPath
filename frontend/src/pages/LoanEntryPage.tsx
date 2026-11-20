import React, { useState } from 'react';
import { LoanInput } from '../types';
import { LoanCard } from '../components/LoanCard';
import { LoanModal } from '../components/LoanModal';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { calculateWeightedAverageRate } from '../services/calculationEngine';

interface LoanEntryPageProps {
  loans: LoanInput[];
  onAddLoan: (loan: LoanInput) => void;
  onEditLoan: (loan: LoanInput) => void;
  onDeleteLoan: (id: string) => void;
  onLoadSample: () => void;
  onClearAll: () => void;
  onProceed: () => void;
}

export const LoanEntryPage: React.FC<LoanEntryPageProps> = ({
  loans,
  onAddLoan,
  onEditLoan,
  onDeleteLoan,
  onLoadSample,
  onClearAll,
  onProceed,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<LoanInput | null>(null);

  const totalDebt = loans.reduce((acc, l) => acc + l.balance, 0);
  const totalMinPayment = loans.reduce((acc, l) => acc + l.minimum_payment, 0);
  const weightedRate = calculateWeightedAverageRate(loans);

  const handleOpenAdd = () => {
    setEditingLoan(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (loan: LoanInput) => {
    setEditingLoan(loan);
    setIsModalOpen(true);
  };

  const handleSave = (loan: LoanInput) => {
    if (editingLoan) {
      onEditLoan(loan);
    } else {
      onAddLoan(loan);
    }
  };

  return (
    <div className="plan-builder max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="section-kicker">Step 1 of 3 · Your loans</p>
          <h2>Build the picture before you pick a path.</h2>
          <p className="text-sm text-zinc-500 mt-1.5 max-w-lg">Add each loan separately so ClearPath can apply payment priorities accurately.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {loans.length === 0 && (
            <button
              onClick={onLoadSample}
              className="px-3.5 py-2 border border-zinc-200 rounded text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Load sample data
            </button>
          )}
          {loans.length > 0 && (
            <button
              onClick={onClearAll}
              className="px-3.5 py-2 border border-zinc-200 rounded text-xs font-medium text-zinc-400 hover:text-zinc-700 hover:border-zinc-300 transition-colors"
            >
              Clear all
            </button>
          )}
          <button
            onClick={handleOpenAdd}
            className="button-primary"
          >
            Add loan
          </button>
        </div>
      </div>

      {/* Summary strip */}
      {loans.length > 0 && (
        <div className="plan-totals">
          {[
            { label: 'Total debt', value: formatCurrency(totalDebt), mono: true },
            { label: 'Loans', value: `${loans.length}`, mono: false },
            { label: 'Min. monthly', value: `${formatCurrency(totalMinPayment)}/mo`, mono: true },
            { label: 'Avg. rate', value: formatPercent(weightedRate), mono: true },
          ].map(({ label, value, mono }) => (
            <div key={label}>
              <div className="text-[11px] text-zinc-400">{label}</div>
              <div className={`text-lg font-semibold text-zinc-900 mt-0.5 ${mono ? 'font-mono tabular-nums' : ''}`}>
                {value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {loans.length === 0 ? (
        <div className="plan-empty py-20 text-center space-y-5">
          <div>
            <p className="text-zinc-900 font-medium">No loans yet</p>
            <p className="text-sm text-zinc-400 mt-1 max-w-xs mx-auto">
              Add your loans one at a time, or load a realistic sample to try the calculator.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <button onClick={handleOpenAdd} className="button-primary">
              Add first loan
            </button>
            <button onClick={onLoadSample} className="button-secondary">
              Load sample data
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="loan-ledger">
            {loans.map((loan) => (
              <LoanCard
                key={loan.id}
                loan={loan}
                onEdit={handleOpenEdit}
                onDelete={onDeleteLoan}
              />
            ))}
          </div>

          {/* Proceed */}
          <div className="plan-continue">
            <div><span>Next</span><p>Set an extra monthly amount and compare payoff paths.</p></div>
            <button onClick={onProceed} className="button-primary">Continue to your plan</button>
          </div>
        </div>
      )}

      <LoanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialLoan={editingLoan}
      />
    </div>
  );
};
