import React from 'react';
import { ArrowRight, ArrowUpRight, Landmark, Plus, SlidersHorizontal } from 'lucide-react';
import { LoanInput, StrategyComparisonResult } from '../types';
import { formatCurrency, formatDuration, formatPercent } from '../utils/formatters';

interface DashboardPageProps {
  loans: LoanInput[];
  comparison: StrategyComparisonResult | null;
  extraPayment: number;
  setExtraPayment: (amount: number) => void;
  onNavigate: (tab: string) => void;
  onOpenAddLoan: () => void;
}

const ResultValue = ({ value, fallback = 'Calculating…' }: { value: string | null | undefined; fallback?: string }) => (
  <>{value || fallback}</>
);

export const DashboardPage: React.FC<DashboardPageProps> = ({ loans, comparison, extraPayment, setExtraPayment, onNavigate }) => {
  if (loans.length === 0) {
    return (
      <div className="empty-plan max-w-3xl mx-auto px-4 py-24 sm:py-32">
        <Landmark size={26} strokeWidth={1.5} />
        <p className="section-kicker">Your plan starts here</p>
        <h2>Nothing to forecast yet.</h2>
        <p>Add the loans you want to understand. ClearPath will keep the math and the next best question in one place.</p>
        <button onClick={() => onNavigate('loans')} className="button-primary">Add your first loan <Plus size={16} /></button>
      </div>
    );
  }

  const totalDebt = loans.reduce((sum, loan) => sum + loan.balance, 0);
  const totalMinimum = loans.reduce((sum, loan) => sum + loan.minimum_payment, 0);
  const avalanche = comparison?.avalanche;
  const snowball = comparison?.snowball;
  const baseline = comparison?.baseline;
  const federalBalance = loans.filter((loan) => loan.loan_type === 'Federal').reduce((sum, loan) => sum + loan.balance, 0);
  const privateBalance = loans.filter((loan) => loan.loan_type === 'Private').reduce((sum, loan) => sum + loan.balance, 0);

  return (
    <div className="dashboard-page max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <header className="dashboard-intro">
        <div>
          <p className="section-kicker">Repayment plan</p>
          <h1>Know where your money is taking you.</h1>
          <p>Adjust one monthly choice, then see the change in years, interest, and momentum.</p>
        </div>
        <div className="dashboard-actions">
          <button onClick={() => onNavigate('loans')} className="text-action">Manage loans</button>
          <button onClick={() => onNavigate('refinance')} className="button-secondary">Test a refinance offer <ArrowUpRight size={15} /></button>
        </div>
      </header>

      <section className="debt-statement" aria-label="Debt overview">
        <div className="statement-total">
          <span>Outstanding debt</span>
          <strong>{formatCurrency(totalDebt)}</strong>
          <p>{loans.length} loan{loans.length === 1 ? '' : 's'} · {formatCurrency(totalMinimum)} required each month</p>
        </div>
        <div className="statement-metrics">
          <div><span>Weighted rate</span><strong>{formatPercent(comparison?.weighted_average_interest_rate)}</strong></div>
          <div><span>Avalanche debt-free</span><strong><ResultValue value={avalanche?.estimated_debt_free_date} /></strong></div>
          <div><span>Time recovered</span><strong>{avalanche?.time_saved_months_vs_baseline ? formatDuration(avalanche.time_saved_months_vs_baseline) : '—'}</strong></div>
        </div>
      </section>

      <section className="payment-control">
        <div className="payment-control-copy">
          <p className="section-kicker"><SlidersHorizontal size={14} /> Monthly choice</p>
          <h2>What can you add to this month’s payment?</h2>
          <p>ClearPath redirects it to the right loan and carries freed payments forward as balances disappear.</p>
        </div>
        <div className="payment-control-input">
          <output>{formatCurrency(extraPayment)}<small>/ month</small></output>
          <input type="range" min="0" max="1500" step="25" value={extraPayment} onChange={(event) => setExtraPayment(Number(event.target.value))} aria-label="Extra monthly payment" />
          <div className="quick-amounts">
            {[0, 100, 250, 500].map((amount) => <button key={amount} onClick={() => setExtraPayment(amount)} aria-pressed={extraPayment === amount}>${amount}</button>)}
          </div>
        </div>
      </section>

      <section className="path-section">
        <div className="section-heading-row"><div><p className="section-kicker">The two paths</p><h2>Choose the trade-off that feels sustainable.</h2></div><button onClick={() => onNavigate('strategies')} className="text-action">See full comparison <ArrowRight size={15} /></button></div>
        <div className="path-grid">
          <article className="path-option path-option--baseline"><span className="path-label">Minimums only</span><h3>Stay the course</h3><strong><ResultValue value={baseline?.estimated_debt_free_date} /></strong><p>{baseline?.is_amortizing ? `${formatDuration(baseline.payoff_months)} · ${formatCurrency(baseline.total_interest_paid)} interest` : 'Your current payment does not produce a reliable payoff forecast.'}</p></article>
          <article className="path-option path-option--avalanche"><span className="path-label">Highest rate first</span><h3>Debt avalanche</h3><strong><ResultValue value={avalanche?.estimated_debt_free_date} /></strong><p>{avalanche?.interest_saved_vs_baseline !== null && avalanche?.interest_saved_vs_baseline !== undefined ? `${formatCurrency(avalanche.interest_saved_vs_baseline)} less interest than minimums` : 'Calculating your interest savings.'}</p></article>
          <article className="path-option path-option--snowball"><span className="path-label">Smallest balance first</span><h3>Debt snowball</h3><strong><ResultValue value={snowball?.estimated_debt_free_date} /></strong><p>{snowball?.time_saved_months_vs_baseline ? `${formatDuration(snowball.time_saved_months_vs_baseline)} faster than minimums` : 'Calculating your payoff momentum.'}</p></article>
        </div>
      </section>

      <section className="portfolio-note">
        <div><span>Federal</span><strong>{formatCurrency(federalBalance)}</strong></div>
        <div><span>Private</span><strong>{formatCurrency(privateBalance)}</strong></div>
        <p>Refinancing federal loans can remove protections such as IDR and PSLF. Review the offer details before acting.</p>
      </section>
    </div>
  );
};
