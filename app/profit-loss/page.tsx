'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, Percent, DollarSign, Wallet } from 'lucide-react';

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
      {separator && <tr><td colSpan={2} className="border-t border-[var(--border)] py-1" /></tr>}
      <tr>
        <td className={`py-2 text-xs ${indent ? 'pl-6 text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'} ${bold ? 'font-bold text-[var(--text-primary)]' : ''}`}>
          {label}
        </td>
        <td className={`py-2 text-right text-xs font-mono ${bold ? 'font-bold text-sm' : ''} ${negative ? 'text-[var(--danger)]' : bold ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'}`}>
          {loading ? <div className="skeleton h-4 w-20 inline-block" /> : formatCurrency(value || 0)}
        </td>
      </tr>
    </>
  );

  return (
    <DashboardLayout>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Profit & Loss Statement</h1>
            <div className="page-subtitle">Official business income statement and profitability ratios</div>
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

        {/* Financial Ratio Grid */}
        <div className="stats-grid mb-6">
          <div className="stat-card text-center">
            <div className="text-xs text-[var(--text-muted)] mb-1">Gross Margin</div>
            <div className="text-2xl font-bold text-[var(--success)]">{(d.gross_margin || 0).toFixed(1)}%</div>
          </div>
          <div className="stat-card text-center">
            <div className="text-xs text-[var(--text-muted)] mb-1">Net Profit Margin</div>
            <div className="text-2xl font-bold text-[var(--accent)]">{(d.net_margin || 0).toFixed(1)}%</div>
          </div>
          <div className="stat-card text-center">
            <div className="text-xs text-[var(--text-muted)] mb-1">Return on Investment (ROI)</div>
            <div className="text-2xl font-bold text-[var(--warning)]">{roi.toFixed(1)}%</div>
          </div>
          <div className="stat-card text-center">
            <div className="text-xs text-[var(--text-muted)] mb-1">Net Income</div>
            <div className={`text-2xl font-bold ${(d.net_profit || 0) >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
              {formatCurrency(d.net_profit || 0)}
            </div>
          </div>
        </div>

        {/* Income Statement Table Card */}
        <div className="card p-6 max-w-xl mx-auto">
          <div className="font-bold text-base text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-[var(--accent)]" />
            <span>Income Statement</span>
          </div>
          <table className="w-full">
            <tbody>
              <Row label="Gross Sales Revenue" value={d.revenue} bold />
              <Row label="Cost of Goods Sold (HPP)" value={-(d.hpp || 0)} negative indent />
              <Row label="Gross Operating Profit" value={d.gross_profit} bold separator />
              <tr>
                <td colSpan={2} className="pt-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Operating Expenditures
                </td>
              </tr>
              {(d.expenses_by_category || []).map((e: any) => (
                <Row key={e.category} label={e.category} value={-e.total} negative indent />
              ))}
              <Row label="Total Expenditures" value={-(d.total_expenses || 0)} negative separator />
              <Row label="Net Profit (Final Earnings)" value={d.net_profit} bold separator />
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
