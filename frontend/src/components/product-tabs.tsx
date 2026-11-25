'use client';

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

// Every figure is ClearPath's engine output for the same four sample loans as the hero ($45,000, $541 a month
// minimum). The refinance example assumes a made-up 5.25% offer over 7 years with no fees.
// shortcut: figures are typed in; recompute them if the engine changes.
const LOANS = [
  { name: 'Grad PLUS', balance: '$18,000', rate: '8.08%', share: 40, color: '#0f3d32' },
  { name: 'Direct Unsubsidized', balance: '$12,000', rate: '6.53%', share: 27, color: '#8fbf3f' },
  { name: 'Private loan', balance: '$9,500', rate: '9.25%', share: 21, color: '#3b82f6' },
  { name: 'Direct Subsidized', balance: '$5,500', rate: '4.99%', share: 12, color: '#0b0f1a' },
];

const PLANS = [
  { name: 'Minimums only', how: '$541 a month', date: 'Dec 2036', months: 121, interest: '$18,928', color: '#9aa3af' },
  { name: 'Snowball', how: '$100 extra, smallest balance first', date: 'Sep 2034', months: 94, interest: '$14,985', color: '#3b82f6' },
  { name: 'Avalanche', how: '$100 extra, highest rate first', date: 'Jul 2034', months: 92, interest: '$13,908', color: '#0f3d32' },
];

const OWE = (
  <div className="grid gap-8 md:grid-cols-[1fr_1.5fr] md:items-center">
    <div className="space-y-5">
      <p>
        <span className="block text-sm text-[#55606e]">You owe</span>
        <span className="font-editorial block text-5xl tabular-nums text-[#0f3d32] sm:text-6xl">$45,000</span>
      </p>
      <dl className="flex gap-10">
        <div>
          <dt className="text-sm text-[#55606e]">Minimum each month</dt>
          <dd className="text-2xl font-semibold tabular-nums">$541</dd>
        </div>
        <div>
          <dt className="text-sm text-[#55606e]">Average rate</dt>
          <dd className="text-2xl font-semibold tabular-nums">7.54%</dd>
        </div>
      </dl>
    </div>
    <div>
      <div className="flex h-4 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
        {LOANS.map((loan) => (
          <span key={loan.name} style={{ width: `${loan.share}%`, backgroundColor: loan.color }} />
        ))}
      </div>
      <ul className="mt-4 divide-y divide-[#eef0ec]">
        {LOANS.map((loan) => (
          <li key={loan.name} className="flex items-center gap-3 py-3">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: loan.color }} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{loan.name}</span>
              <span className="block text-sm text-[#55606e]">{loan.rate} interest, {loan.share}% of the total</span>
            </span>
            <span className="font-semibold tabular-nums">{loan.balance}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const EXTRA = (
  <ul className="space-y-6">
    {PLANS.map((plan) => (
      <li key={plan.name} className="grid gap-2 md:grid-cols-[14rem_1fr_9rem] md:items-center md:gap-6">
        <div>
          <p className="font-semibold">{plan.name}</p>
          <p className="text-sm text-[#55606e]">{plan.how}</p>
        </div>
        <div>
          <div className="h-3 rounded-full bg-[#eef0ec]" aria-hidden="true">
            <div className="h-3 rounded-full" style={{ width: `${(plan.months / 121) * 100}%`, backgroundColor: plan.color }} />
          </div>
          <p className="mt-1.5 text-sm text-[#55606e]">Paid off {plan.date}, after {plan.months} months</p>
        </div>
        <p className="md:text-right">
          <span className="text-2xl font-semibold tabular-nums">{plan.interest}</span>
          <span className="ml-2 text-sm text-[#55606e] md:ml-0 md:block">interest</span>
        </p>
      </li>
    ))}
  </ul>
);

const REFINANCE = (
  <div>
    <p className="text-center text-sm text-[#55606e]">Both pay the same $641.33 a month</p>
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      {[
        { name: 'Keep your loans', note: 'Extra to the highest rate first', interest: '$13,896', total: '$58,896', months: 92, best: false },
        { name: 'Take a 5.25% offer', note: 'Seven years, no fees', interest: '$8,871', total: '$53,871', months: 84, best: true },
      ].map((option) => (
        <dl key={option.name} className={`rounded-xl border p-5 ${option.best ? 'border-[#0f3d32] bg-[#eef8dc]' : 'border-[#e5e8ee]'}`}>
          <dt className="font-semibold">{option.name}</dt>
          <dd className="text-sm text-[#55606e]">{option.note}</dd>
          <dd className="mt-4 text-4xl font-semibold tabular-nums">{option.interest}</dd>
          <dd className="text-sm text-[#55606e]">interest over {option.months} months, {option.total} repaid in all</dd>
        </dl>
      ))}
    </div>
    <p className="mt-4 rounded-xl border border-[#f2d58a] bg-[#fffbeb] p-4 text-sm text-[#6b4300]">
      <strong>The offer shows $5,025 less interest, but there is a catch:</strong> refinancing federal loans privately permanently gives up their federal protections.
    </p>
  </div>
);

const TABS: { id: string; question: string; answer: string; view: ReactNode }[] = [
  { id: 'loans', question: 'What do I owe altogether?', answer: 'Every loan in one place, and which one is the biggest share.', view: OWE },
  { id: 'repayment', question: 'Where should extra money go?', answer: 'The same loans paid three ways, with the finish date and interest for each.', view: EXTRA },
  { id: 'refinance', question: 'Is a refinance offer cheaper?', answer: 'Compared fairly: the offer against your current loans at the same monthly payment.', view: REFINANCE },
];

export function ProductTabs() {
  const [selected, setSelected] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const tab = TABS[selected];

  const onKeyDown = (event: KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (selected + step + TABS.length) % TABS.length;
    setSelected(next);
    buttons.current[next]?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label="Questions ClearPath answers" onKeyDown={onKeyDown} className="grid gap-2 md:grid-cols-3">
        {TABS.map((item, i) => (
          <button
            key={item.id}
            ref={(node) => { buttons.current[i] = node; }}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={selected === i}
            aria-controls="product-panel"
            tabIndex={selected === i ? 0 : -1}
            onClick={() => setSelected(i)}
            className={`min-h-14 rounded-lg px-4 text-left text-base font-semibold sm:text-lg ${
              selected === i ? 'bg-[#0f3d32] text-[#d8f2a7]' : 'bg-[#f3efe7] text-[#0b0f1a] hover:bg-[#eae4d8]'
            }`}
          >
            {item.question}
          </button>
        ))}
      </div>
      <div id="product-panel" role="tabpanel" aria-labelledby={`tab-${tab.id}`} className="mt-4 rounded-2xl bg-[#f3efe7] p-4 sm:p-8">
        <p className="mx-auto max-w-2xl text-center text-lg text-[#2b3140]">{tab.answer}</p>
        {/* Keyed so each newly chosen answer eases in. */}
        <div key={tab.id} className="cp-rise mx-auto mt-6 max-w-4xl rounded-2xl bg-white p-5 sm:p-8">
          {tab.view}
        </div>
        <p className="mt-4 text-center text-sm text-[#55606e]">Calculated by ClearPath for made-up sample loans. Estimates only.</p>
      </div>
    </div>
  );
}
