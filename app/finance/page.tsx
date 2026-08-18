'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function FinancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    const res = await fetch(`/api/finance?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [dateFrom, dateTo]);

  const d = data || {};

  return (
    <DashboardLayout>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Finance</h1>
            <div className="page-subtitle">Financial overview and P&L breakdown</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="date" className="input" style={{ width: 'auto' }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <input type="date" className="input" style={{ width: 'auto' }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>

        {/* Main Numbers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Revenue', value: d.revenue, icon: DollarSign, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
            { label: 'Gross Profit', value: d.gross_profit, icon: TrendingUp, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
            { label: 'Net Profit', value: d.net_profit, icon: Wallet, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          ].map(item => (
            <div key={item.label} className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <item.icon size={16} color={item.color} />
                </div>
              </div>
              {loading ? <div className="skeleton" style={{ height: 32, width: 140 }} /> : (
                <div style={{ fontSize: 26, fontWeight: 800, color: item.color }}>{formatCurrency(item.value || 0)}</div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* P&L Statement */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Profit & Loss Statement</div>
            {loading ? <div className="skeleton" style={{ height: 200, borderRadius: 8 }} /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <PLRow label="Revenue" value={d.revenue} color="var(--text-primary)" bold />
                <PLRow label="Cost of Goods Sold (HPP)" value={-d.hpp} color="var(--danger)" />
                <div className="divider" />
                <PLRow label="Gross Profit" value={d.gross_profit} color="var(--success)" bold />
                <PLRow label="Gross Margin" value={null} text={`${(d.gross_margin || 0).toFixed(1)}%`} color="var(--text-muted)" />
                <div style={{ height: 12 }} />
                <PLRow label="Total Expenses" value={-d.total_expenses} color="var(--danger)" />
                {(d.expenses_by_category || []).map((e: any) => (
                  <PLRow key={e.category} label={`  ↳ ${e.category}`} value={-e.total} color="var(--text-secondary)" small />
                ))}
                <div className="divider" />
                <PLRow label="Net Profit" value={d.net_profit} color={d.net_profit >= 0 ? 'var(--success)' : 'var(--danger)'} bold large />
                <PLRow label="Net Margin" value={null} text={`${(d.net_margin || 0).toFixed(1)}%`} color="var(--text-muted)" />
              </div>
            )}
          </div>

          {/* Expense Breakdown */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Expense Breakdown</div>
            {loading ? <div className="skeleton" style={{ height: 200, borderRadius: 8 }} /> : (
              <>
                {(!d.expenses_by_category || d.expenses_by_category.length === 0) ? (
                  <div className="empty-state" style={{ padding: 32 }}>
                    <TrendingDown size={32} className="empty-state-icon" />
                    <p>No expenses recorded</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {d.expenses_by_category.map((e: any) => {
                      const pct = d.total_expenses > 0 ? (e.total / d.total_expenses) * 100 : 0;
                      return (
                        <div key={e.category}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 13 }}>{e.category}</span>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(e.total)}</span>
                          </div>
                          <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 3, transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                    <div className="divider" />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600 }}>Total</span>
                      <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(d.total_expenses || 0)}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function PLRow({ label, value, text, color, bold, large, small }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${small ? 3 : 6}px 0` }}>
      <span style={{ fontSize: small ? 12 : 13, color: small ? 'var(--text-muted)' : 'var(--text-secondary)', fontWeight: bold ? 600 : 400 }}>{label}</span>
      <span style={{ fontSize: large ? 17 : small ? 12 : 13, fontWeight: bold ? 700 : 500, color }}>
        {text || formatCurrency(value || 0)}
      </span>
    </div>
  );
}
