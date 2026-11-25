'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layers } from 'lucide-react';
import {
  calculateRepayment,
  fetchLoans,
  fetchScenarios,
  getApiErrorMessage,
  type LoanRecord,
  type RepaymentComparison,
  type ScenarioRecord,
} from '@/lib/api';
import { BalanceChart } from '@/components/balance-chart';
import { DEFAULT_CURRENCY, formatMoney, portfolioCurrency } from '@/lib/currency';
import { usePreferences } from '@/lib/preferences';

const EXTRA = 100; // illustrative extra monthly payment shown in "Your path"

const month = (date?: string) => date || 'Not reached';

export default function OverviewPage() {
  const router = useRouter();
  const { locale } = usePreferences();
  const [loans, setLoans] = useState<LoanRecord[] | null>(null);
  const [plan, setPlan] = useState<RepaymentComparison | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioRecord[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const current = await fetchLoans();
        if (!active) return;
        setLoans(current);
        if (current.length === 0 || portfolioCurrency(current) === 'MIXED') return;
        const [comparison, saved] = await Promise.all([calculateRepayment(current, EXTRA), fetchScenarios()]);
        if (!active) return;
        setPlan(comparison);
        setScenarios(saved);
      } catch (loadError: unknown) {
        if (!active) return;
        if (typeof loadError === 'object' && loadError !== null && 'response' in loadError) {
          const response = (loadError as { response?: { status?: number } }).response;
          if (response?.status === 401) return router.push('/login?redirect=/overview');
        }
        setError(getApiErrorMessage(loadError));
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  const currency = loans?.length ? portfolioCurrency(loans) : DEFAULT_CURRENCY;
  const money = (value: number | string | null | undefined) => formatMoney(value, currency === 'MIXED' ? DEFAULT_CURRENCY : currency, locale, 0);

  const header = (
    <div className="cp-masthead mb-6">
      <h1>Overview</h1>
      <p className="mt-1 text-sm">Where your student loans stand today.</p>
    </div>
  );
  const shell = (children: React.ReactNode) => (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8">
      {header}
      {children}
    </main>
  );
  const notice = (title: string, body: string, href: string, action: string) =>
    shell(
      <div className="cp-card p-8 text-center sm:p-12">
        <Layers className="mx-auto h-8 w-8 text-[#0f3d32]" aria-hidden="true" />
        <h2 className="mt-3 text-lg font-semibold">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#55606e]">{body}</p>
        <Link href={href} className="cp-btn-primary mt-5">{action}</Link>
      </div>,
    );

  if (error) return shell(<div role="alert" className="cp-card p-6 text-sm text-[#b91c1c]">{error} Reload the page to try again.</div>);
  if (loans?.length === 0) return notice('Add your first loan', 'Enter a balance, interest rate and minimum payment to see when you could be debt-free.', '/loans', 'Add a loan');
  if (loans && currency === 'MIXED') return notice('Your loans use more than one currency', 'ClearPath does not convert currencies, so it cannot add these loans together.', '/loans', 'Review your loans');
  if (!loans || !plan) {
    return shell(
      <div role="status" aria-label="Loading your overview" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-28" />)}
      </div>,
    );
  }

  const { baseline, avalanche } = plan;
  const canPlan = baseline.is_amortizing && avalanche.is_amortizing;
  const largest = [...loans].sort((a, b) => b.balance - a.balance);
  const stats = [
    { label: 'Total balance', value: money(plan.total_debt), note: `${loans.length} ${loans.length === 1 ? 'loan' : 'loans'}` },
    { label: 'Minimum payment', value: money(plan.total_minimum_payment), note: 'Each month' },
    { label: 'Average rate', value: `${Number(plan.weighted_average_interest_rate).toFixed(2)}%`, note: 'Weighted by balance' },
    { label: 'Estimated payoff', value: month(baseline.estimated_debt_free_date), note: 'At minimum payments' },
  ];

  return shell(
    <div className="space-y-4">
      <dl className="cp-stats grid grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="cp-card p-4 sm:p-5">
            <dt className="text-sm text-[#55606e]">{stat.label}</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">{stat.value}</dd>
            <dd className="mt-1 text-xs text-[#55606e]">{stat.note}</dd>
          </div>
        ))}
      </dl>

      {!canPlan && (
        <div role="alert" className="cp-card border-[#fed7aa] bg-[#fff7ed] p-4 text-sm text-[#9a3412]">
          {baseline.warning_message ?? avalanche.warning_message ?? 'At least one payment does not cover its interest.'}
        </div>
      )}

      {canPlan && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <section className="cp-card min-w-0 p-5 lg:col-span-2" aria-labelledby="balance-title">
            <h2 id="balance-title" className="mb-3 text-base font-semibold">Projected balance</h2>
            <BalanceChart
              start={Number(plan.total_debt)}
              money={money}
              series={[
                { label: 'Minimum payments', color: '#9aa3af', summary: baseline, dashed: true },
                { label: `Avalanche, ${money(EXTRA)} extra`, color: '#0f3d32', summary: avalanche },
              ]}
            />
          </section>
          <section className="cp-card flex min-w-0 flex-col bg-[#eef8dc] p-5" aria-labelledby="path-title">
            <h2 id="path-title" className="text-base font-semibold">Your path</h2>
            <p className="mt-3 text-sm text-[#2b3140]">
              At minimum payments you would finish in <strong>{month(baseline.estimated_debt_free_date)}</strong> and pay {money(baseline.total_interest_paid)} in interest.
            </p>
            <p className="mt-3 text-sm text-[#2b3140]">
              With {money(EXTRA)} extra a month on your highest rate first: <strong>{month(avalanche.estimated_debt_free_date)}</strong>, with {money(avalanche.interest_saved_vs_baseline)} less interest.
            </p>
            <p className="mt-3 text-xs text-[#55606e]">Estimates, not a guarantee.</p>
            <Link href="/repayment" className="cp-btn-primary mt-4 lg:mt-auto">
              Compare strategies
            </Link>
          </section>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="cp-card min-w-0 p-5 lg:col-span-2" aria-labelledby="loans-title">
          <div className="flex items-center justify-between">
            <h2 id="loans-title" className="text-base font-semibold">Your loans</h2>
            <Link href="/loans" className="inline-flex min-h-11 items-center text-sm font-medium text-[#0f3d32] underline-offset-4 hover:underline">Manage loans</Link>
          </div>
          <ul className="divide-y divide-[#e5e8ee]">
            {largest.slice(0, 5).map((loan) => (
              <li key={loan._id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{loan.name}</span>
                  <span className="text-xs text-[#55606e]">{loan.type} at {loan.interest_rate}%</span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums">{money(loan.balance)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="cp-card min-w-0 p-5" aria-labelledby="saved-title">
          <h2 id="saved-title" className="text-base font-semibold">Saved scenarios</h2>
          {scenarios.length === 0 ? (
            <p className="mt-3 text-sm text-[#55606e]">Nothing saved yet. Save a repayment plan to find it here.</p>
          ) : (
            <ul className="mt-2 divide-y divide-[#e5e8ee]">
              {scenarios.slice(0, 4).map((scenario) => (
                <li key={scenario._id} className="py-3 text-sm">
                  <span className="block truncate font-medium">{scenario.name}</span>
                  <span className="text-xs text-[#55606e]"><span className="capitalize">{scenario.strategy}</span> with {money(scenario.extraPayment)} extra</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/repayment" className="inline-flex min-h-11 items-center text-sm font-medium text-[#0f3d32] underline-offset-4 hover:underline">Go to repayment</Link>
        </section>
      </div>
    </div>,
  );
}
