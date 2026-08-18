'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import { formatCurrency } from '@/lib/utils';
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function FinancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      const res = await fetch(`/api/finance?${params}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [dateFrom, dateTo]);

  const d = data || {};

  return (
    <DashboardLayout>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Financial Overview</h1>
            <div className="page-subtitle">P&L summary statement and operational expenditure analysis</div>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              className="input w-auto h-9 text-xs"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
            <input
              type="date"
              className="input w-auto h-9 text-xs"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>
        </div>

        {/* Key Financial KPIs */}
        <div className="stats-grid mb-6">
          <div className="stat-card">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Gross Sales Revenue</span>
              <DollarSign size={16} className="text-[var(--accent)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {loading ? <div className="skeleton h-7 w-28" /> : formatCurrency(d.revenue || 0)}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">Total revenue collected</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Gross Profit (After HPP)</span>
              <TrendingUp size={16} className="text-[var(--success)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--success)]">
              {loading ? <div className="skeleton h-7 w-28" /> : formatCurrency(d.gross_profit || 0)}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1 font-semibold text-[var(--success)]">
              {(d.gross_margin || 0).toFixed(1)}% Gross Margin
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Net Profit (After Expenses)</span>
              <Wallet size={16} className="text-[var(--warning)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--warning)]">
              {loading ? <div className="skeleton h-7 w-28" /> : formatCurrency(d.net_profit || 0)}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1 font-semibold text-[var(--warning)]">
              {(d.net_margin || 0).toFixed(1)}% Net Margin
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* P&L Statement Card */}
          <div className="card p-5">
            <h3 className="font-bold text-base text-[var(--text-primary)] mb-4">Profit & Loss Statement</h3>
            {loading ? (
              <div className="skeleton h-60 w-full" />
            ) : (
              <div className="space-y-2 text-xs">
                <PLRow label="Gross Sales Revenue" value={d.revenue} color="var(--text-primary)" bold />
                <PLRow label="Cost of Goods Sold (HPP)" value={-d.hpp} color="var(--danger)" />
                <div className="divider" />
                <PLRow label="Gross Operating Profit" value={d.gross_profit} color="var(--success)" bold />
                <PLRow label="Gross Profit Margin %" value={null} text={`${(d.gross_margin || 0).toFixed(1)}%`} color="var(--text-muted)" />
                <div className="h-2" />
                <PLRow label="Total Operational Expenses" value={-d.total_expenses} color="var(--danger)" bold />
                {(d.expenses_by_category || []).map((e: any) => (
                  <PLRow key={e.category} label={`  ↳ ${e.category}`} value={-e.total} color="var(--text-secondary)" small />
                ))}
                <div className="divider" />
                <PLRow label="Net Profit (Final Earnings)" value={d.net_profit} color={d.net_profit >= 0 ? 'var(--success)' : 'var(--danger)'} bold large />
                <PLRow label="Net Profit Margin %" value={null} text={`${(d.net_margin || 0).toFixed(1)}%`} color="var(--text-muted)" />
              </div>
            )}
          </div>

          {/* Expense Breakdown Card */}
          <div className="card p-5">
            <h3 className="font-bold text-base text-[var(--text-primary)] mb-4">Expense Breakdown by Category</h3>
            {loading ? (
              <div className="skeleton h-60 w-full" />
            ) : (!d.expenses_by_category || d.expenses_by_category.length === 0) ? (
              <div className="empty-state py-12">
                <TrendingDown size={36} className="empty-state-icon" />
                <p className="text-xs text-[var(--text-muted)]">No expenses recorded for this period.</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {d.expenses_by_category.map((e: any) => {
                  const pct = d.total_expenses > 0 ? (e.total / d.total_expenses) * 100 : 0;
                  return (
                    <div key={e.category} className="space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span className="text-[var(--text-primary)]">{e.category}</span>
                        <span className="text-[var(--text-primary)]">{formatCurrency(e.total)} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="divider" />
                <div className="flex justify-between font-bold text-sm">
                  <span>Total Expenses</span>
                  <span className="text-[var(--danger)]">{formatCurrency(d.total_expenses || 0)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function PLRow({ label, value, text, color, bold, large, small }: any) {
  return (
    <div className={`flex justify-between items-center ${small ? 'py-1' : 'py-1.5'}`}>
      <span className={`${small ? 'text-[11px] text-[var(--text-muted)]' : 'text-xs text-[var(--text-secondary)]'} ${bold ? 'font-semibold text-[var(--text-primary)]' : ''}`}>
        {label}
      </span>
      <span className={`${large ? 'text-base font-bold' : small ? 'text-[11px]' : 'text-xs font-semibold'}`} style={{ color }}>
        {text || formatCurrency(value || 0)}
      </span>
    </div>
  );
}
