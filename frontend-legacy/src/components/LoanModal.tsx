import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Landmark, AlertCircle } from 'lucide-react';
import { LoanInput, LoanType } from '../types';

interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (loan: LoanInput) => void;
  initialLoan?: LoanInput | null;
}

export const LoanModal: React.FC<LoanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialLoan,
}) => {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [loanType, setLoanType] = useState<LoanType>('Federal');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (initialLoan) {
      setName(initialLoan.name);
      setBalance(initialLoan.balance.toString());
      setInterestRate(initialLoan.interest_rate.toString());
      setMinimumPayment(initialLoan.minimum_payment.toString());
      setLoanType(initialLoan.loan_type);
    } else {
      setName('');
      setBalance('');
      setInterestRate('');
      setMinimumPayment('');
      setLoanType('Federal');
    }
    setErrors({});
  }, [initialLoan, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    nameInputRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (!first || !last) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    return () => {
      dialog.removeEventListener('keydown', handleKeyDown);
      if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
      returnFocusRef.current = null;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Live calculation of initial monthly interest
  const parsedBal = parseFloat(balance) || 0;
  const parsedRate = parseFloat(interestRate) || 0;
  const parsedMin = parseFloat(minimumPayment) || 0;
  const monthlyRate = (parsedRate / 100) / 12;
  const estimatedMonthlyInterest = Math.round(parsedBal * monthlyRate * 100) / 100;
  const isInsufficient = parsedBal > 0 && parsedMin > 0 && parsedMin <= estimatedMonthlyInterest;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Loan name is required.';
    } else if (name.trim().length > 100) {
      newErrors.name = 'Loan name cannot exceed 100 characters.';
    }

    const b = parseFloat(balance);
    if (isNaN(b) || b <= 0) {
      newErrors.balance = 'Balance must be greater than $0.00.';
    } else if (b > 10000000) {
      newErrors.balance = 'Balance cannot exceed $10,000,000.';
    }

    const r = parseFloat(interestRate);
    if (isNaN(r) || r < 0) {
      newErrors.interestRate = 'Interest rate must be 0% or positive.';
    } else if (r > 100) {
      newErrors.interestRate = 'Interest rate cannot exceed 100%.';
    }

    const p = parseFloat(minimumPayment);
    if (!Number.isFinite(p) || p <= 0) {
      newErrors.minimumPayment = 'Minimum payment must be greater than $0.00.';
    } else if (p > 1000000) {
      newErrors.minimumPayment = 'Minimum payment cannot exceed $1,000,000.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      id: initialLoan ? initialLoan.id : `loan-${crypto.randomUUID()}`,
      name: name.trim(),
      balance: Math.round(parseFloat(balance) * 100) / 100,
      interest_rate: Math.round(parseFloat(interestRate) * 100) / 100,
      minimum_payment: Math.round(parseFloat(minimumPayment) * 100) / 100,
      loan_type: loanType,
    });

    onClose();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="loan-modal-title"
      ref={dialogRef}
      tabIndex={-1}
      className="modal-overlay-enter fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="modal-panel-enter bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Landmark className="w-4 h-4" />
            </div>
            <h3 id="loan-modal-title" className="font-bold text-slate-900 text-lg">
              {initialLoan ? 'Edit Student Loan' : 'Add Student Loan'}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Loan Name */}
          <div>
            <label htmlFor="loan-name-input" className="block text-xs font-semibold text-slate-700 mb-1">
              Loan Name or Label *
            </label>
            <input
              id="loan-name-input"
              ref={nameInputRef}
              type="text"
              placeholder="e.g. Federal Direct Subsidized, Sallie Mae, Grad PLUS"
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={errors.name ? 'true' : undefined}
              aria-describedby={errors.name ? 'loan-name-error' : undefined}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                errors.name
                  ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
              } focus:outline-hidden focus:ring-2`}
            />
            {errors.name && <p id="loan-name-error" className="text-xs text-rose-600 mt-1">{errors.name}</p>}
          </div>

          {/* Grid: Balance & Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="loan-balance-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Current Principal Balance ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-medium">$</span>
                <input
                  id="loan-balance-input"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10000000"
                  placeholder="5000.00"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  aria-invalid={errors.balance ? 'true' : undefined}
                  aria-describedby={errors.balance ? 'loan-balance-error' : undefined}
                  className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm font-medium font-mono transition-colors ${
                    errors.balance
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                  } focus:outline-hidden focus:ring-2`}
                />
              </div>
              {errors.balance && <p id="loan-balance-error" className="text-xs text-rose-600 mt-1">{errors.balance}</p>}
            </div>

            <div>
              <label htmlFor="loan-rate-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Annual Interest Rate (%) *
              </label>
              <div className="relative">
                <input
                  id="loan-rate-input"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="6.50"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  aria-invalid={errors.interestRate ? 'true' : undefined}
                  aria-describedby={errors.interestRate ? 'loan-rate-error' : undefined}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium font-mono transition-colors ${
                    errors.interestRate
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                  } focus:outline-hidden focus:ring-2`}
                />
                <span className="absolute right-3.5 top-2.5 text-slate-400 text-sm font-medium">%</span>
              </div>
              {errors.interestRate && <p id="loan-rate-error" className="text-xs text-rose-600 mt-1">{errors.interestRate}</p>}
            </div>
          </div>

          {/* Grid: Minimum Payment & Loan Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="loan-minpay-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Monthly Payment ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-medium">$</span>
                <input
                  id="loan-minpay-input"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1000000"
                  placeholder="85.00"
                  value={minimumPayment}
                  onChange={(e) => setMinimumPayment(e.target.value)}
                  aria-invalid={errors.minimumPayment ? 'true' : undefined}
                  aria-describedby={errors.minimumPayment ? 'loan-minimum-error' : undefined}
                  className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-sm font-medium font-mono transition-colors ${
                    errors.minimumPayment
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                  } focus:outline-hidden focus:ring-2`}
                />
              </div>
              {errors.minimumPayment && (
                <p id="loan-minimum-error" className="text-xs text-rose-600 mt-1">{errors.minimumPayment}</p>
              )}
            </div>

            <div>
              <label htmlFor="loan-type-select" className="block text-xs font-semibold text-slate-700 mb-1">
                Loan Classification
              </label>
              <select
                id="loan-type-select"
                value={loanType}
                onChange={(e) => setLoanType(e.target.value as LoanType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium bg-white focus:border-emerald-500 focus:ring-emerald-200 focus:outline-hidden focus:ring-2"
              >
                <option value="Federal">Federal (Protected)</option>
                <option value="Private">Private</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
          </div>

          {/* Real-time Payment Sufficiency Warning */}
          {isInsufficient && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Non-Amortizing Payment Warning:</strong> Initial monthly interest will be approximately $
                {estimatedMonthlyInterest.toFixed(2)}. Your entered minimum payment (${parsedMin.toFixed(2)}) is
                insufficient to cover interest. The balance will not decrease under this payment.
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-hidden"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-md transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden"
            >
              {initialLoan ? 'Save Changes' : 'Add Loan'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
