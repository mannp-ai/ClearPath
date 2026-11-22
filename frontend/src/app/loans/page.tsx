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

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function LoansPage() {
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [rate, setRate] = useState('');
  const [minPay, setMinPay] = useState('');
  const [type, setType] = useState<LoanInput['type']>('Federal');
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
      };
      if (editingId) {
        const updated = await updateLoan(editingId, input);
        setLoans((current) =>
          current.map((loan) => (loan._id === editingId ? updated : loan))
        );
        setEditingId(null);
        setSuccessNotice(`Updated â€œ${updated.name}â€.`);
      } else {
        const created = await createLoan(input);
        setLoans((current) => [...current, created]);
        setSuccessNotice(`Added â€œ${created.name}â€ to your portfolio.`);
      }
      setName('');
      setBalance('');
      setRate('');
      setMinPay('');
      setType('Federal');
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
  };

  const remove = async (loan: LoanRecord) => {
    if (!window.confirm(`Are you sure you want to delete ${loan.name}?`)) return;
    setError('');
    setSuccessNotice('');
    try {
      await deleteLoan(loan._id);
      setLoans((current) => current.filter((item) => item._id !== loan._id));
      if (editingId === loan._id) cancelEdit();
      setSuccessNotice(`Deleted â€œ${loan.name}â€.`);
    } catch (deleteError: unknown) {
      setError(getApiErrorMessage(deleteError));
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#e6eaf0] mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0f172a]">
            Student Loan Portfolio
          </h1>
          <p className="mt-1 text-sm text-[#64748b]">
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

      {/* Summary KPI Ribbon */}
      {loans.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="cp-card p-4 sm:p-5">
            <span className="text-xs font-medium text-[#64748b]">
              Total balance
            </span>
            <div className="mt-1 font-display text-xl sm:text-2xl font-bold tabular-nums text-[#0f172a]">
              {currency.format(totalBalance)}
            </div>
            <span className="mt-1 text-xs text-[#64748b]">Across {loans.length} accounts</span>
          </div>

          <div className="cp-card p-4 sm:p-5">
            <span className="text-xs font-medium text-[#64748b]">
              Combined minimum
            </span>
            <div className="mt-1 font-display text-xl sm:text-2xl font-bold tabular-nums text-[#0f172a]">
              {currency.format(totalMinPayment)}
              <span className="text-xs font-normal text-[#64748b]">/mo</span>
            </div>
            <span className="mt-1 text-xs text-[#64748b]">Baseline monthly cost</span>
          </div>

          <div className="cp-card p-4 sm:p-5">
            <span className="text-xs font-medium text-[#64748b]">
              Weighted APR
            </span>
            <div className="mt-1 font-display text-xl sm:text-2xl font-bold tabular-nums text-[#2563eb]">
              {weightedAverageRate.toFixed(2)}%
            </div>
            <span className="mt-1 text-xs text-[#64748b]">Portfolio average</span>
          </div>

          <div className="cp-card p-4 sm:p-5">
            <span className="text-xs font-medium text-[#64748b]">
              Portfolio breakdown
            </span>
            <div className="mt-1 flex items-center gap-1.5 font-display text-sm font-semibold text-[#0f172a]">
              {loans.some((l) => l.type === 'Federal') && (
                <span className="rounded bg-[#eff6ff] px-2 py-0.5 text-xs font-medium text-[#1d4ed8]">
                  Federal
                </span>
              )}
              {loans.some((l) => l.type === 'Private') && (
                <span className="rounded bg-[#f5f3ff] px-2 py-0.5 text-xs font-medium text-[#7c3aed]">
                  Private
                </span>
              )}
            </div>
            <span className="mt-1 text-xs text-[#64748b]">
              {loans.filter((l) => l.type === 'Federal').length} Federal,{' '}
              {loans.filter((l) => l.type === 'Private').length} Private
            </span>
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {error && (
        <div
          role="alert"
          className="animate-fade-in mb-6 flex items-start gap-3 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4 text-sm text-[#dc2626]"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-[#dc2626] mt-0.5" />
          <div>
            <strong className="font-semibold">Unable to save: </strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {successNotice && (
        <div
          role="status"
          className="animate-fade-in mb-6 flex items-start gap-3 rounded-lg border border-[#a7f3d0] bg-[#ecfdf5] p-4 text-sm text-[#168568]"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-[#168568] mt-0.5" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Add / Edit Form Card */}
      <section className="cp-card p-5 sm:p-6 mb-10">
        <div className="flex items-center justify-between pb-4 border-b border-[#f1f5f9] mb-5">
          <h2 className="font-display text-base font-bold text-[#0f172a]">
            {editingId ? 'Edit Loan Account' : 'Add a Loan Account'}
          </h2>
          {editingId && (
            <span className="rounded-full bg-[#fffbeb] px-2.5 py-0.5 text-xs font-medium text-[#b45309]">
              Editing Mode
            </span>
          )}
        </div>

        <form onSubmit={add} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Field: Name */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                Loan name
              </label>
              <input
                className="cp-input"
                required
                maxLength={100}
                placeholder="e.g. Direct Subsidized Loan #1"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Field: Type */}
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                Loan type
              </label>
              <select
                className="cp-input"
                value={type}
                onChange={(e) => setType(e.target.value as LoanInput['type'])}
              >
                <option value="Federal">Federal (Direct/PLUS)</option>
                <option value="Private">Private Lender</option>
                <option value="Unknown">Unknown / Other</option>
              </select>
            </div>

            {/* Field: Balance */}
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                Current balance ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-medium text-[#64748b] select-none pointer-events-none">$</span>
                <input
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
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                Annual interest rate (%)
              </label>
              <div className="relative">
                <input
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
                <span className="absolute right-3 top-2.5 text-xs font-medium text-[#94a3b8]">%</span>
              </div>
            </div>

            {/* Field: Minimum Payment */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                Monthly minimum payment ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-medium text-[#64748b] select-none pointer-events-none">$</span>
                <input
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
            <div className="sm:col-span-2 lg:col-span-3 flex items-end gap-2.5">
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
          <h2 className="font-display text-lg font-bold text-[#0f172a]">
            Active Loan Accounts ({loans.length})
          </h2>
          {loans.length > 0 && (
            <span className="text-xs text-[#64748b]">
              Click Edit to modify balance or interest rate
            </span>
          )}
        </div>

        {loading ? (
          <div className="cp-card p-12 text-center text-sm text-[#64748b]">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#2563eb] border-t-transparent mb-3" />
            <p>Loading your loansâ€¦</p>
          </div>
        ) : loans.length === 0 ? (
          <div className="cp-card p-10 sm:p-14 text-center border-dashed">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#eff6ff] text-[#2563eb] mb-4">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="font-display text-base font-bold text-[#0f172a]">
              No loans entered yet
            </h3>
            <p className="mt-1 text-sm text-[#64748b] max-w-sm mx-auto">
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
                    <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-xs font-medium text-[#475569]">
                      <th scope="col" className="py-3 px-4">Loan account</th>
                      <th scope="col" className="py-3 px-4">Type</th>
                      <th scope="col" className="py-3 px-4 text-right">Outstanding balance</th>
                      <th scope="col" className="py-3 px-4 text-right">Annual rate</th>
                      <th scope="col" className="py-3 px-4 text-right">Min. payment</th>
                      <th scope="col" className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {loans.map((loan) => (
                      <tr key={loan._id} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-[#0f172a]">
                          {loan.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              loan.type === 'Federal'
                                ? 'bg-[#eff6ff] text-[#2563eb]'
                                : loan.type === 'Private'
                                ? 'bg-[#f5f3ff] text-[#7c3aed]'
                                : 'bg-[#f1f5f9] text-[#64748b]'
                            }`}
                          >
                            {loan.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-display font-semibold tabular-nums text-[#0f172a]">
                          {currency.format(loan.balance)}
                        </td>
                        <td className="py-3.5 px-4 text-right tabular-nums text-[#334155]">
                          {loan.interest_rate.toFixed(2)}%
                        </td>
                        <td className="py-3.5 px-4 text-right tabular-nums text-[#334155]">
                          {currency.format(loan.minimum_payment)}
                          <span className="text-xs text-[#94a3b8]">/mo</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => beginEdit(loan)}
                              className="interactive-tap inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium text-[#2563eb] hover:bg-[#eff6ff]"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(loan)}
                              className="interactive-tap inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium text-[#dc2626] hover:bg-[#fef2f2]"
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
                      <h3 className="font-display font-bold text-base text-[#0f172a]">
                        {loan.name}
                      </h3>
                      <span
                        className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          loan.type === 'Federal'
                            ? 'bg-[#eff6ff] text-[#2563eb]'
                            : loan.type === 'Private'
                            ? 'bg-[#f5f3ff] text-[#7c3aed]'
                            : 'bg-[#f1f5f9] text-[#64748b]'
                        }`}
                      >
                        {loan.type} Loan
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => beginEdit(loan)}
                        className="interactive-tap rounded p-1.5 text-[#2563eb] hover:bg-[#eff6ff]"
                        title="Edit loan"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(loan)}
                        className="interactive-tap rounded p-1.5 text-[#dc2626] hover:bg-[#fef2f2]"
                        title="Delete loan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#f1f5f9] text-xs">
                    <div>
                      <span className="text-[#64748b] block">Balance</span>
                      <strong className="font-display font-semibold tabular-nums text-sm text-[#0f172a]">
                        {currency.format(loan.balance)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#64748b] block">APR</span>
                      <strong className="font-display font-semibold tabular-nums text-sm text-[#334155]">
                        {loan.interest_rate.toFixed(2)}%
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#64748b] block">Min. Due</span>
                      <strong className="font-display font-semibold tabular-nums text-sm text-[#334155]">
                        {currency.format(loan.minimum_payment)}
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

