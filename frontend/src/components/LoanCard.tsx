import React, { useState } from 'react';
import { AlertCircle, ChevronRight, Pencil, ShieldCheck, Trash2 } from 'lucide-react';
import { LoanInput } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { checkLoanSufficiency } from '../services/calculationEngine';

interface LoanCardProps {
  loan: LoanInput;
  onEdit: (loan: LoanInput) => void;
  onDelete: (id: string) => void;
}

export const LoanCard: React.FC<LoanCardProps> = ({ loan, onEdit, onDelete }) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const { isSufficient, initialInterest } = checkLoanSufficiency(loan);

  return (
    <article className="loan-ledger-row">
      <div className="loan-ledger-name">
        <span className={`loan-type-dot loan-type-dot--${loan.loan_type.toLowerCase()}`} />
        <div>
          <div className="flex items-center gap-2"><h3>{loan.name}</h3>{!isSufficient && <span className="warning-inline"><AlertCircle size={13} /> Payment may not reduce balance</span>}</div>
          <p>{loan.loan_type === 'Federal' ? <><ShieldCheck size={13} /> Federal loan</> : `${loan.loan_type} loan`} · est. interest {formatCurrency(initialInterest)}/mo</p>
        </div>
      </div>
      <div className="loan-ledger-amount"><span>Balance</span><strong>{formatCurrency(loan.balance)}</strong></div>
      <div className="loan-ledger-metric"><span>Rate</span><strong>{formatPercent(loan.interest_rate)}</strong></div>
      <div className="loan-ledger-metric"><span>Minimum</span><strong>{formatCurrency(loan.minimum_payment)}<small>/mo</small></strong></div>
      <div className="loan-ledger-actions">
        {isConfirmingDelete ? (
          <div className="delete-confirm"><span>Remove?</span><button onClick={() => onDelete(loan.id)}>Yes</button><button onClick={() => setIsConfirmingDelete(false)}>No</button></div>
        ) : (
          <><button onClick={() => onEdit(loan)} aria-label={`Edit ${loan.name}`}><Pencil size={16} /><span>Edit</span></button><button onClick={() => setIsConfirmingDelete(true)} aria-label={`Delete ${loan.name}`} className="delete-action"><Trash2 size={16} /></button><ChevronRight size={17} className="ledger-chevron" /></>
        )}
      </div>
    </article>
  );
};
