import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { StrategyComparisonResult } from '../types';
import { formatCurrency } from '../utils/formatters';

interface RepaymentChartProps {
  comparison: StrategyComparisonResult;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: '#18181b',
        border: 'none',
        borderRadius: '6px',
        padding: '10px 14px',
        fontSize: '12px',
        fontFamily: 'var(--font-mono, monospace)',
        lineHeight: 1.6,
      }}
    >
      <div style={{ color: '#a1a1aa', marginBottom: 6, fontFamily: 'inherit' }}>{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} style={{ color: entry.color, display: 'flex', justifyContent: 'space-between', gap: 24 }}>
          <span style={{ color: '#71717a' }}>{entry.dataKey}</span>
          <span style={{ color: '#fafafa', fontWeight: 600 }}>{formatCurrency(Number(entry.value))}</span>
        </div>
      ))}
    </div>
  );
};

export const RepaymentChart: React.FC<RepaymentChartProps> = ({ comparison }) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);

    motionPreference.addEventListener('change', handleChange);
    return () => motionPreference.removeEventListener('change', handleChange);
  }, []);

  const { baseline, avalanche, snowball } = comparison;

  const maxMonths = Math.max(
    baseline.schedule.length,
    avalanche.schedule.length,
    snowball.schedule.length
  );

  if (maxMonths === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-zinc-400 text-sm border border-dashed border-zinc-200 rounded-lg">
        No repayment schedule to chart.
      </div>
    );
  }

  const step = Math.max(1, Math.floor(maxMonths / 50));
  const chartData = [];

  for (let m = 0; m <= maxMonths; m += step) {
    const baseBal =
      m === 0 ? comparison.total_debt : baseline.schedule[m - 1]?.remaining_balance ?? 0;
    const avaBal =
      m === 0 ? comparison.total_debt : avalanche.schedule[m - 1]?.remaining_balance ?? 0;
    const snowBal =
      m === 0 ? comparison.total_debt : snowball.schedule[m - 1]?.remaining_balance ?? 0;

    const label =
      m === 0
        ? 'Start'
        : avalanche.schedule[m - 1]?.year_month ||
          baseline.schedule[m - 1]?.year_month ||
          `Mo ${m}`;

    chartData.push({ month: m, label, Baseline: baseBal, Avalanche: avaBal, Snowball: snowBal });
  }

  if (chartData[chartData.length - 1]?.month !== maxMonths && maxMonths > 0) {
    chartData.push({
      month: maxMonths,
      label: `Mo ${maxMonths}`,
      Baseline: baseline.schedule[maxMonths - 1]?.remaining_balance ?? 0,
      Avalanche: avalanche.schedule[maxMonths - 1]?.remaining_balance ?? 0,
      Snowball: snowball.schedule[maxMonths - 1]?.remaining_balance ?? 0,
    });
  }

  return (
    <div className="chart-card bg-white border border-zinc-200 rounded-lg p-6">
      <div className="mb-5">
        <h4 className="text-sm font-semibold text-zinc-900">Balance over time</h4>
        <p className="text-xs text-zinc-400 mt-0.5">
          How quickly each strategy eliminates your total debt.
        </p>
      </div>

      {/* Legend — plain text, no icons */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-5 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="block w-6 border-t-2 border-dashed border-zinc-300" />
          Baseline
        </div>
        <div className="flex items-center gap-2">
          <span className="block w-6 border-t-2 border-zinc-500" />
          Snowball
        </div>
        <div className="flex items-center gap-2">
          <span className="block w-6 border-t-2 border-zinc-900" />
          Avalanche
        </div>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#d4d4d8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              tick={{ fill: '#a1a1aa' }}
            />
            <YAxis
              stroke="#d4d4d8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              tick={{ fill: '#a1a1aa' }}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="Baseline"
              stroke="#d4d4d8"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 3, fill: '#d4d4d8' }}
              isAnimationActive={!prefersReducedMotion}
              animationDuration={280}
              animationEasing="ease-out"
            />
            <Line
              type="monotone"
              dataKey="Snowball"
              stroke="#71717a"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: '#71717a' }}
              isAnimationActive={!prefersReducedMotion}
              animationDuration={280}
              animationEasing="ease-out"
            />
            <Line
              type="monotone"
              dataKey="Avalanche"
              stroke="#18181b"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 3, fill: '#18181b' }}
              isAnimationActive={!prefersReducedMotion}
              animationDuration={280}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
