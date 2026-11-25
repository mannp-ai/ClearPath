import type { RepaymentSummary } from '@/lib/api';

export type ChartSeries = { label: string; color: string; summary: RepaymentSummary; dashed?: boolean };

const W = 600;
const H = 200;

// Remaining balance month by month, taken straight from the calculated schedules.
export function BalanceChart({
  start,
  series,
  money,
}: {
  start: number;
  series: ChartSeries[];
  money: (value: number) => string;
}) {
  const months = Math.max(...series.map((s) => s.summary.schedule.length), 1);
  const top = Math.max(start, 1);
  const path = (s: ChartSeries) =>
    [start, ...s.summary.schedule.map((m) => Number(m.remaining_balance))]
      .map((value, i) => `${i ? 'L' : 'M'}${((i / months) * W).toFixed(1)},${(H - (Math.min(value, top) / top) * H).toFixed(1)}`)
      .join(' ');
  const summaryText = series
    .map((s) => `${s.label}: paid off after ${s.summary.schedule.length} months`)
    .join('. ');

  return (
    <figure>
      <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#2b3140]">
        {series.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-2">
            <svg width="18" height="4" aria-hidden="true">
              <line x1="0" y1="2" x2="18" y2="2" stroke={s.color} strokeWidth="3" strokeDasharray={s.dashed ? '5 3' : undefined} />
            </svg>
            {s.label}
          </span>
        ))}
      </div>
      <div className="flex gap-3">
        <div className="flex flex-col justify-between text-right text-xs tabular-nums text-[#55606e]">
          <span>{money(top)}</span>
          <span>{money(top / 2)}</span>
          <span>{money(0)}</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`Balance over time. ${summaryText}.`} className="h-52 min-w-0 flex-1">
          {[0, H / 2, H].map((y) => (
            <line key={y} x1="0" x2={W} y1={y} y2={y} stroke="#e5e8ee" vectorEffect="non-scaling-stroke" />
          ))}
          {series.map((s) => (
            <path key={s.label} d={path(s)} fill="none" stroke={s.color} strokeWidth="2.5" strokeDasharray={s.dashed ? '6 4' : undefined} vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
      </div>
      <figcaption className="mt-2 flex justify-between pl-14 text-xs text-[#55606e]">
        <span>Today</span>
        <span>{(months / 12).toFixed(1)} years</span>
      </figcaption>
    </figure>
  );
}
