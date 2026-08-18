'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';

export default function ProfitLossPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    setLoading(true);
    fetch(`/api/finance?${params}`).then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, [dateFrom, dateTo]);

  const d = data || {};
  const roi = d.total_expenses > 0 ? ((d.net_profit || 0) / (d.total_expenses || 1)) * 100 : 0;

  const Row = ({ label, value, indent, bold, negative, separator }: any) => (
    <>
      {separator && <tr><td colSpan={2}><div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} /></td></tr>}
      <tr>
        <td style={{ padding: '6px 0', fontSize: indent ? 12 : 13, paddingLeft: indent ? 20 : 0, color: indent ? 'var(--text-secondary)' : 'var(--text-primary)', fontWeight: bold ? 700 : 400 }}>{label}</td>
        <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: bold ? 700 : 500, fontSize: bold ? 14 : 13, color: negative ? 'var(--danger)' : bold ? 'var(--success)' : 'var(--text-primary)' }}>
          {loading ? <div className="skeleton" style={{ height: 16, width: 80, display: 'inline-block' }} /> : formatCurrency(value || 0)}
        </td>
      </tr>
    </>
  );

  return (
    <DashboardLayout>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Profit & Loss</h1>
            <div className="page-subtitle">Income statement</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="date" className="input" style={{ width: 'auto' }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <input type="date" className="input" style={{ width: 'auto' }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {/* KPI Cards */}
          {[
            { label: 'Gross Margin', value: `${(d.gross_margin || 0).toFixed(1)}%`, color: '#22c55e' },
            { label: 'Net Margin', value: `${(d.net_margin || 0).toFixed(1)}%`, color: '#6366f1' },
            { label: 'ROI', value: `${roi.toFixed(1)}%`, color: '#f59e0b' },
            { label: 'Net Profit', value: formatCurrency(d.net_profit || 0), color: d.net_profit >= 0 ? '#22c55e' : '#ef4444' },
          ].map(k => (
            <div key={k.label} className="stat-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{k.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '24px 28px', maxWidth: 560, margin: '0 auto' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} color="var(--accent)" />
            Income Statement
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <Row label="Revenue" value={d.revenue} bold />
              <Row label="Cost of Goods Sold (HPP)" value={-(d.hpp || 0)} negative indent />
              <Row label="Gross Profit" value={d.gross_profit} bold separator />
              <tr><td colSpan={2} style={{ paddingTop: 12, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operating Expenses</td></tr>
              {(d.expenses_by_category || []).map((e: any) => (
                <Row key={e.category} label={e.category} value={-e.total} negative indent />
              ))}
              <Row label="Total Expenses" value={-(d.total_expenses || 0)} negative separator />
              <Row label="Net Profit" value={d.net_profit} bold separator />
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
