'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Layers,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import {
  createLoan,
  deleteLoan,
  fetchLoans,
  getApiErrorMessage,
  updateLoan,
  type LoanInput,
  type LoanRecord,
} from '@/lib/api';
import { useCurrencyOptions, usePreferences } from '@/lib/preferences';
import { currencySymbol, DEFAULT_CURRENCY, formatMoney, portfolioCurrency } from '@/lib/currency';

const SHARE_COLORS = ['#14594a', '#f4b942', '#e8553d', '#7a3b69', '#2f8f9d', '#b5a98f'];

export default function LoansPage() {
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [rate, setRate] = useState('');
  const [minPay, setMinPay] = useState('');
  const [type, setType] = useState<LoanInput['type']>('Federal');
  const { currency: prefCurrency, locale } = usePreferences();
  const [loanCurrency, setLoanCurrency] = useState<string | null>(null);
  const formCurrency = loanCurrency ?? prefCurrency;
  const symbol = currencySymbol(formCurrency, locale);
  const fmt = (value: number, cur?: string) => formatMoney(value, cur ?? DEFAULT_CURRENCY, locale);
  const currencyOptions = useCurrencyOptions(formCurrency);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const router = useRouter();

  useEffect(() => {
    let active = true;
    fetchLoans()
      .then((result) => {
        if (active) setLoans(result);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        if (typeof loadError === 'object' && loadError !== null && 'response' in loadError) {
          const res = (loadError as { response?: { status?: number } }).response;
          if (res?.status === 401) {
            router.push('/login?redirect=/loans');
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

  const pCur = portfolioCurrency(loans);
  const mixed = pCur === 'MIXED';

  // Summary Metrics calculations
  const totalBalance = useMemo(() => {
    return loans.reduce((acc, l) => acc + (Number(l.balance) || 0), 0);
  }, [loans]);

  const totalMinPayment = useMemo(() => {
    return loans.reduce((acc, l) => acc + (Number(l.minimum_payment) || 0), 0);
  }, [loans]);

  const weightedAverageRate = useMemo(() => {
    if (totalBalance === 0) return 0;
    const weightedSum = loans.reduce(
      (acc, l) => acc + (Number(l.balance) || 0) * (Number(l.interest_rate) || 0),
      0
    );
    return weightedSum / totalBalance;
  }, [loans, totalBalance]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessNotice('');
    try {
      const input: LoanInput = {
        name: name.trim(),
        balance: Number(balance),
        interest_rate: Number(rate),
        minimum_payment: Number(minPay),
        type,
        currency: formCurrency,
      };
      if (editingId) {
        const updated = await updateLoan(editingId, input);
        setLoans((current) =>
          current.map((loan) => (loan._id === editingId ? updated : loan))
        );
        setEditingId(null);
        setSuccessNotice(`Updated “${updated.name}”.`);
      } else {
        const created = await createLoan(input);
        setLoans((current) => [...current, created]);
        setSuccessNotice(`Added “${created.name}” to your portfolio.`);
      }
      setName('');
      setBalance('');
      setRate('');
      setMinPay('');
      setType('Federal');
      setLoanCurrency(null);
    } catch (saveError: unknown) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const beginEdit = (loan: LoanRecord) => {
    setEditingId(loan._id);
    setName(loan.name);
    setBalance(String(loan.balance));
    setRate(String(loan.interest_rate));
    setMinPay(String(loan.minimum_payment));
    setType(loan.type);
    setLoanCurrency(loan.currency ?? DEFAULT_CURRENCY);
    setError('');
    setSuccessNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setBalance('');
    setRate('');
    setMinPay('');
    setType('Federal');
    setLoanCurrency(null);
  };

  const remove = async (loan: LoanRecord) => {
    if (!window.confirm(`Are you sure you want to delete ${loan.name}?`)) return;
    setError('');
    setSuccessNotice('');
    try {
      await deleteLoan(loan._id);
      setLoans((current) => current.filter((item) => item._id !== loan._id));
      if (editingId === loan._id) cancelEdit();
      setSuccessNotice(`Deleted “${loan.name}”.`);
    } catch (deleteError: unknown) {
      setError(getApiErrorMessage(deleteError));
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cp-masthead mb-8">
        <div>
          <h1 className="font-head">
            Student Loan Portfolio
          </h1>
          <p className="mt-1 text-sm text-[#62594e]">
            Manage your individual student loan accounts to model unified repayment.
          </p>
        </div>

        {loans.length > 0 && (
          <div className="flex items-center gap-3">
            <Link
              href="/repayment"
              className="cp-btn-primary text-xs"
            >
              <span>Compare Repayment Plans</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>

      {mixed && (
        <div role="status" className="cp-card mb-8 p-4 text-sm text-[#4a4239]">
          <strong className="font-semibold">Your loans use more than one currency.</strong>{' '}
          Each loan is shown in its own currency. ClearPath does not convert currencies, so combined totals, repayment and refinancing comparisons are unavailable until your loans share a currency.
        </div>
      )}

      {/* Summary KPI Ribbon */}
      {loans.length > 0 && !mixed && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="cp-card p-4 sm:p-5">
            <span className="text-xs font-medium text-[#62594e]">
              Total balance
            </span>
            <div className="mt-1 font-display text-xl sm:text-2xl font-bold tabular-nums text-[#231f1b]">
              {fmt(totalBalance, pCur)}
            </div>
            <span className="mt-1 text-xs text-[#62594e]">Across {loans.length} accounts</span>
          </div>

          <div className="cp-card p-4 sm:p-5">
            <span className="text-xs font-medium text-[#62594e]">
              Combined minimum
            </span>
            <div className="mt-1 font-display text-xl sm:text-2xl font-bold tabular-nums text-[#231f1b]">
              {fmt(totalMinPayment, pCur)}
              <span className="text-xs font-normal text-[#62594e]">/mo</span>
            </div>
            <span className="mt-1 text-xs text-[#62594e]">Baseline monthly cost</span>
          </div>

          <div className="cp-card p-4 sm:p-5">
            <span className="text-xs font-medium text-[#62594e]">
              Weighted APR
            </span>
            <div className="mt-1 font-display text-xl sm:text-2xl font-bold tabular-nums text-[#14594a]">
              {weightedAverageRate.toFixed(2)}%
            </div>
            <span className="mt-1 text-xs text-[#62594e]">Portfolio average</span>
          </div>

          <div className="cp-card p-4 sm:p-5">
            <span className="text-xs font-medium text-[#62594e]">
              Portfolio breakdown
            </span>
            <div className="mt-1 flex items-center gap-1.5 font-display text-sm font-semibold text-[#231f1b]">
              {loans.some((l) => l.type === 'Federal') && (
                <span className="rounded bg-[#e6f0e9] px-2 py-0.5 text-xs font-medium text-[#0f4a3d]">
                  Federal
                </span>
              )}
              {loans.some((l) => l.type === 'Private') && (
                <span className="rounded bg-[#f6eaf2] px-2 py-0.5 text-xs font-medium text-[#7a3b69]">
                  Private
                </span>
              )}
            </div>
            <span className="mt-1 text-xs text-[#62594e]">
              {loans.filter((l) => l.type === 'Federal').length} Federal,{' '}
              {loans.filter((l) => l.type === 'Private').length} Private
            </span>
          </div>
        </div>
      )}

      {/* Balance share by loan (real data only) */}
      {loans.length > 1 && !mixed && totalBalance > 0 && (
        <section aria-labelledby="balance-share" className="cp-card p-5 sm:p-6 mb-8 animate-fade-up">
          <h2 id="balance-share" className="font-head text-lg font-semibold text-[#231f1b]">Where your balance sits</h2>
          <div
            role="img"
            aria-label={loans.map((l) => `${l.name}: ${Math.round((l.balance / totalBalance) * 100)}%`).join(', ')}
            className="mt-4 flex h-4 overflow-hidden rounded-full bg-[#efe8d8]"
          >
            {loans.map((l, i) => (
              <span
                key={l._id}
                className="h-full border-r-2 border-white last:border-r-0"
                style={{ width: `${(l.balance / totalBalance) * 100}%`, backgroundColor: SHARE_COLORS[i % SHARE_COLORS.length] }}
              />
            ))}
          </div>
          <ul className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {loans.map((l, i) => (
              <li key={l._id} className="flex min-w-0 items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: SHARE_COLORS[i % SHARE_COLORS.length] }} aria-hidden="true" />
                <span className="truncate text-[#3d3630]">{l.name}</span>
                <span className="ml-auto font-medium tabular-nums text-[#231f1b]">{Math.round((l.balance / totalBalance) * 100)}%</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Feedback Messages */}
      {error && (
        <div
          role="alert"
          className="animate-fade-in mb-6 flex items-start gap-3 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4 text-sm text-[#b91c1c]"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-[#b91c1c] mt-0.5" />
          <div>
            <strong className="font-semibold">Unable to save: </strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {successNotice && (
        <div
          role="status"
          className="animate-fade-in mb-6 flex items-start gap-3 rounded-lg border border-[#a7f3d0] bg-[#ecfdf5] p-4 text-sm text-[#0f6b53]"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-[#0f6b53] mt-0.5" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Add / Edit Form Card */}
      <section className="cp-card p-5 sm:p-6 mb-10">
        <div className="flex items-center justify-between pb-4 border-b border-[#efe8d8] mb-5">
          <h2 className="font-display text-base font-bold text-[#231f1b]">
            {editingId ? 'Edit Loan Account' : 'Add a Loan Account'}
          </h2>
          {editingId && (
            <span className="rounded-full bg-[#fffbeb] px-2.5 py-0.5 text-xs font-medium text-[#b45309]">
              Editing Mode
            </span>
          )}
        </div>

        <form onSubmit={add} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Field: Name */}
            <div className="lg:col-span-2">
              <label htmlFor="loans-field-1" className="block text-xs font-medium text-[#4a4239] mb-1.5">
                Loan name
              </label>
              <input id="loans-field-1"
                className="cp-input"
                required
                maxLength={100}
                placeholder="e.g. Direct Subsidized Loan #1"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Field: Type */}
            <div className="lg:col-span-2">
              <label htmlFor="loans-field-2" className="block text-xs font-medium text-[#4a4239] mb-1.5">
                Loan type
              </label>
              <select id="loans-field-2"
                className="cp-input"
                value={type}
                onChange={(e) => setType(e.target.value as LoanInput['type'])}
              >
                <option value="Federal">Federal (Direct/PLUS)</option>
                <option value="Private">Private Lender</option>
                <option value="Unknown">Unknown / Other</option>
              </select>
            </div>

            {/* Field: Currency (per loan; never converts amounts) */}
            <div className="lg:col-span-2">
              <label htmlFor="loans-currency" className="block text-xs font-medium text-[#4a4239] mb-1.5">
                Loan currency
              </label>
              <select
                id="loans-currency"
                className="cp-input"
                value={formCurrency}
                onChange={(e) => setLoanCurrency(e.target.value)}
                aria-describedby={editingId ? 'loans-currency-note' : undefined}
              >
                {currencyOptions.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} · {c.name}</option>
                ))}
              </select>
              {editingId && (
                <p id="loans-currency-note" className="mt-1 text-xs text-[#62594e]">
                  Changing currency relabels this loan&apos;s amounts. It does not convert them.
                </p>
              )}
            </div>

            {/* Field: Balance */}
            <div className="lg:col-span-2">
              <label htmlFor="loans-field-3" className="block text-xs font-medium text-[#4a4239] mb-1.5">
                Current balance ({symbol})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#62594e] select-none pointer-events-none">{symbol}</span>
                <input id="loans-field-3"
                  className="cp-input pl-[34px] tabular-nums font-mono"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="10,000.00"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                />
              </div>
            </div>

            {/* Field: Rate */}
            <div className="lg:col-span-2">
              <label htmlFor="loans-field-4" className="block text-xs font-medium text-[#4a4239] mb-1.5">
                Annual interest rate (%)
              </label>
              <div className="relative">
                <input id="loans-field-4"
                  className="cp-input pr-7 tabular-nums font-mono"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                  placeholder="5.50"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#62594e]">%</span>
              </div>
            </div>

            {/* Field: Minimum Payment */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label htmlFor="loans-field-5" className="block text-xs font-medium text-[#4a4239] mb-1.5">
                Monthly minimum payment ({symbol})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#62594e] select-none pointer-events-none">{symbol}</span>
                <input id="loans-field-5"
                  className="cp-input pl-[34px] tabular-nums font-mono"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="120.00"
                  value={minPay}
                  onChange={(e) => setMinPay(e.target.value)}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="sm:col-span-2 lg:col-span-2 flex items-end gap-2.5">
              <button
                disabled={saving}
                className="cp-btn-primary flex-1 sm:flex-initial"
                type="submit"
              >
                {saving ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Saving...</span>
                  </span>
                ) : editingId ? (
                  <span>Save Changes</span>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Add Loan</span>
                  </>
                )}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="cp-btn-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </section>

      {/* Loans List Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-[#231f1b]">
            Active Loan Accounts ({loans.length})
          </h2>
          {loans.length > 0 && (
            <span className="text-xs text-[#62594e]">
              Click Edit to modify balance or interest rate
            </span>
          )}
        </div>

        {loading ? (
          <div className="cp-card p-12 text-center text-sm text-[#62594e]">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#14594a] border-t-transparent mb-3" />
            <p>Loading your loans…</p>
          </div>
        ) : loans.length === 0 ? (
          <div className="cp-card p-10 sm:p-14 text-center border-dashed">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#e6f0e9] text-[#14594a] mb-4">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="font-display text-base font-bold text-[#231f1b]">
              No loans entered yet
            </h3>
            <p className="mt-1 text-sm text-[#62594e] max-w-sm mx-auto">
              Add your student loan accounts using the form above to begin modeling repayment strategies.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (md and up) */}
            <div className="hidden md:block cp-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm" aria-label="Student Loan Accounts">
                  <thead>
                    <tr className="border-b border-[#e4dccb] bg-[#f6f1e7] text-xs font-medium text-[#4a4239]">
                      <th scope="col" className="py-3 px-4">Loan account</th>
                      <th scope="col" className="py-3 px-4">Type</th>
                      <th scope="col" className="py-3 px-4 text-right">Outstanding balance</th>
                      <th scope="col" className="py-3 px-4 text-right">Annual rate</th>
                      <th scope="col" className="py-3 px-4 text-right">Min. payment</th>
                      <th scope="col" className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#efe8d8]">
                    {loans.map((loan) => (
                      <tr key={loan._id} className="hover:bg-[#f6f1e7] transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-[#231f1b]">
                          {loan.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              loan.type === 'Federal'
                                ? 'bg-[#e6f0e9] text-[#0f4a3d]'
                                : loan.type === 'Private'
                                ? 'bg-[#f6eaf2] text-[#7a3b69]'
                                : 'bg-[#efe8d8] text-[#4a4239]'
                            }`}
                          >
                            {loan.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-display font-semibold tabular-nums text-[#231f1b]">
                          {fmt(loan.balance, loan.currency)}
                        </td>
                        <td className="py-3.5 px-4 text-right tabular-nums text-[#3d3630]">
                          {loan.interest_rate.toFixed(2)}%
                        </td>
                        <td className="py-3.5 px-4 text-right tabular-nums text-[#3d3630]">
                          {fmt(loan.minimum_payment, loan.currency)}
                          <span className="text-xs text-[#62594e]">/mo</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => beginEdit(loan)}
                              className="interactive-tap inline-flex items-center gap-1 rounded px-3 py-2 text-xs font-medium text-[#14594a] hover:bg-[#e6f0e9]"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(loan)}
                              className="interactive-tap inline-flex items-center gap-1 rounded px-3 py-2 text-xs font-medium text-[#b91c1c] hover:bg-[#fef2f2]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Stacked Card View (below md) */}
            <div className="grid grid-cols-1 gap-3.5 md:hidden">
              {loans.map((loan) => (
                <div key={loan._id} className="cp-card-interactive p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display font-bold text-base text-[#231f1b]">
                        {loan.name}
                      </h3>
                      <span
                        className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          loan.type === 'Federal'
                            ? 'bg-[#e6f0e9] text-[#0f4a3d]'
                            : loan.type === 'Private'
                            ? 'bg-[#f6eaf2] text-[#7a3b69]'
                            : 'bg-[#efe8d8] text-[#4a4239]'
                        }`}
                      >
                        {loan.type} Loan
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => beginEdit(loan)}
                        className="interactive-tap rounded p-1.5 text-[#14594a] hover:bg-[#e6f0e9]"
                        title="Edit loan"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(loan)}
                        className="interactive-tap rounded p-1.5 text-[#b91c1c] hover:bg-[#fef2f2]"
                        title="Delete loan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#efe8d8] text-xs">
                    <div>
                      <span className="text-[#62594e] block">Balance</span>
                      <strong className="font-display font-semibold tabular-nums text-sm text-[#231f1b]">
                        {fmt(loan.balance, loan.currency)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#62594e] block">APR</span>
                      <strong className="font-display font-semibold tabular-nums text-sm text-[#3d3630]">
                        {loan.interest_rate.toFixed(2)}%
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#62594e] block">Min. Due</span>
                      <strong className="font-display font-semibold tabular-nums text-sm text-[#3d3630]">
                        {fmt(loan.minimum_payment, loan.currency)}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

