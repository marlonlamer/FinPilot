import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import './ExpenseDistribution.css';

const DEFAULT_COLORS = ['#FF6B6B','#FFA94D','#4CC9F0','#8B5CF6','#22C55E','#F97316','#06B6D4','#F43F5E'];

export default function ExpenseDistribution({ expenses = [], selectedYear, selectedMonth, currencySymbol = '₱', formatCurrency, colors = DEFAULT_COLORS }) {
  const filtered = useMemo(() => {
    return (expenses || []).filter(e => {
      const d = e && e.date ? new Date(e.date) : null;
      if (!d || isNaN(d)) return false;
      return d.getFullYear() === Number(selectedYear) && d.getMonth() === Number(selectedMonth);
    });
  }, [expenses, selectedYear, selectedMonth]);

  const { data, total } = useMemo(() => {
    const map = {};
    (filtered || []).forEach(it => {
      const raw = (it.category || 'Uncategorized').trim();
      const key = raw.toLowerCase();
      if (!map[key]) map[key] = { name: raw, value: 0 };
      map[key].value += Number(it.amount || 0);
    });
    const arr = Object.values(map).sort((a,b) => b.value - a.value);
    const t = arr.reduce((s,i) => s + i.value, 0);
    const colored = arr.map((it, idx) => ({ ...it, percent: t > 0 ? (it.value / t) * 100 : 0, color: colors[idx % colors.length] }));
    return { data: colored, total: t };
  }, [filtered, colors]);

  const fmt = (v) => {
    if (formatCurrency) return formatCurrency(Number(v));
    const n = Number(v || 0);
    return `${currencySymbol}${n.toFixed(2)}`;
  };

  return (
    <div className="expense-dist-root">
      <div className="expense-dist-chart">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={68} outerRadius={96} paddingAngle={2} startAngle={90} endAngle={-270}>
              {data.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => fmt(value)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <div className="donut-total">{fmt(total)}</div>
          <div className="donut-label">Total Expenses</div>
        </div>
      </div>
      <div className="expense-dist-list">
        {data.length === 0 ? (
          <div className="muted">No expenses for selected month.</div>
        ) : (
          data.map((c) => (
            <div className="cat-row" key={c.name}>
              <div className="cat-left">
                <span className="dot" style={{ background: c.color }} />
                <div className="cat-name">{c.name}</div>
              </div>
              <div className="cat-right">
                <div className="cat-amount">{fmt(c.value)}</div>
                <div className="cat-pct">({Math.round(c.percent)}%)</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
