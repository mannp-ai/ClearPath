'use client';

import { useState, type CSSProperties } from 'react';

// Every figure here is ClearPath's engine output for four sample loans ($45,000 total, $541 a month minimum),
// calculated on 26 Nov 2026. Balances are every six months. Recompute if the engine changes.
const LOANS = [
  ['Direct Subsidized', '$5,500', '4.99%'],
  ['Direct Unsubsidized', '$12,000', '6.53%'],
  ['Grad PLUS', '$18,000', '8.08%'],
  ['Private loan', '$9,500', '9.25%'],
];

const MINIMUMS = { months: 121, date: 'Dec 2036', interest: 18928, balances: [45000, 43425, 41791, 40095, 38334, 36507, 34610, 32640, 30596, 28474, 26270, 23982, 21606, 19139, 16578, 13917, 11155, 8285, 5305, 2210, 74, 0] };

const OPTIONS = [
  { extra: 0, months: 119, date: 'Oct 2036', interest: 18919, balances: MINIMUMS.balances.slice(0, 20).concat(0) },
  { extra: 50, months: 104, date: 'Jul 2035', interest: 15964, balances: [45000, 43120, 41165, 39133, 37022, 34826, 32544, 30172, 27705, 25141, 22474, 19701, 16818, 13823, 10716, 7491, 4144, 678, 0] },
  { extra: 100, months: 92, date: 'Jul 2034', interest: 13908, balances: [45000, 42814, 40539, 38172, 35709, 33146, 30479, 27703, 24814, 21808, 18685, 15444, 12078, 8584, 4958, 1210, 0] },
  { extra: 200, months: 76, date: 'Mar 2033', interest: 11140, balances: [45000, 42202, 39287, 36249, 33084, 29785, 26349, 22777, 19067, 15212, 11209, 7053, 2760, 0] },
  { extra: 300, months: 65, date: 'Apr 2032', interest: 9329, balances: [45000, 41590, 38034, 34326, 30458, 26430, 22243, 17892, 13371, 8676, 3823, 0] },
  { extra: 500, months: 51, date: 'Feb 2031', interest: 7075, balances: [45000, 40367, 35530, 30481, 25224, 19760, 14079, 8183, 2094, 0] },
];

const W = 480;
const H = 150;
const POINTS = MINIMUMS.balances.length;
// Months from November 2026 to January of each labelled year.
const YEARS = [['2028', 14], ['2030', 38], ['2032', 62], ['2034', 86], ['2036', 110]] as const;

// Every curve has the same number of points (spare ones rest on the payoff point) so one can morph into another.
const line = (plan: { months: number; balances: number[] }) =>
  Array.from({ length: POINTS }, (_, i) => {
    const last = plan.balances.length - 1;
    const month = i >= last ? plan.months : i * 6;
    const balance = i >= last ? 0 : plan.balances[i];
    return `${i ? 'L' : 'M'}${((month / MINIMUMS.months) * W).toFixed(1)},${(H - (balance / 45000) * (H - 4) - 2).toFixed(1)}`;
  }).join(' ');

const dollars = (value: number) => `$${value.toLocaleString('en-US')}`;

export function PayoffDemo() {
  const [extra, setExtra] = useState(100);
  const plan = OPTIONS.find((option) => option.extra === extra) ?? OPTIONS[0];
  const path = line(plan);

  return (
    <div id="example" className="cp-rise cp-rise-late scroll-mt-20 rounded-2xl bg-white p-5 text-[#0b0f1a] shadow-[0_32px_80px_-32px_rgba(0,0,0,0.6)] sm:p-7">
      <h2 className="text-lg font-semibold">Try it with sample loans</h2>
      <details className="mt-1 text-sm">
        <summary className="min-h-8 cursor-pointer py-1 text-[#55606e]">4 loans, $45,000 owed, $541 a month</summary>
        <ul className="mt-1">
          {LOANS.map(([name, balance, rate]) => (
            <li key={name} className="flex justify-between gap-2 border-b border-[#eef0ec] py-1">
              <span className="text-[#55606e]">{name}</span>
              <span className="tabular-nums">{balance} at {rate}</span>
            </li>
          ))}
        </ul>
      </details>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold">Pay this much extra each month</legend>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {OPTIONS.map((option) => (
            <label key={option.extra} className="cursor-pointer">
              <input type="radio" name="extra" value={option.extra} checked={extra === option.extra} onChange={() => setExtra(option.extra)} className="peer sr-only" />
              <span className="flex min-h-11 items-center justify-center rounded-lg border border-[#cfd4dc] text-sm font-semibold tabular-nums transition-colors peer-checked:border-[#0f3d32] peer-checked:bg-[#0f3d32] peer-checked:text-[#d8f2a7] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#0f3d32]">
                {dollars(option.extra)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div aria-live="polite" className="mt-5">
        <p className="text-sm text-[#55606e]">You are debt-free by</p>
        <p className="font-editorial text-5xl leading-tight tabular-nums text-[#0f3d32] sm:text-6xl">{plan.date}</p>
        <p className="mt-1 text-sm">
          <strong>{MINIMUMS.months - plan.months} months sooner</strong> than minimum payments, with {dollars(plan.interest)} interest ({dollars(MINIMUMS.interest - plan.interest)} less).
        </p>
        {plan.extra === 0 && <p className="mt-1 text-sm text-[#55606e]">Why sooner with nothing extra? When one loan is paid off, its payment moves to the next.</p>}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Balance falls to zero by ${plan.date} with ${dollars(extra)} extra, compared with ${MINIMUMS.date} on minimum payments.`} className="cp-draw mt-4 w-full">
        <line x1="0" x2={W} y1={H - 2} y2={H - 2} stroke="#e5e8ee" />
        <path d={line(MINIMUMS)} fill="none" stroke="#9aa3af" strokeWidth="2" strokeDasharray="5 4" />
        {/* `d` as a style lets the curve glide between amounts; the attribute covers browsers without it. */}
        <path d={path} style={{ d: `path("${path}")`, transition: 'd 450ms cubic-bezier(0.22, 1, 0.36, 1)' } as CSSProperties} fill="none" stroke="#0f3d32" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div aria-hidden="true" className="relative h-5 text-xs tabular-nums text-[#55606e]">
        {YEARS.map(([year, month]) => (
          <span key={year} className="absolute -translate-x-1/2" style={{ left: `${(month / MINIMUMS.months) * 100}%` }}>{year}</span>
        ))}
      </div>
      <p className="mt-2 text-xs text-[#55606e]">Solid: extra to the highest rate first. Dashed: minimums only. Estimates for made-up loans.</p>
    </div>
  );
}
