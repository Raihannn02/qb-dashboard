'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import { formatCurrency, formatPercent, formatDateTime } from '@/lib/utils';
import { History, Search, X, ChevronLeft, ChevronRight, ShoppingCart, TrendingUp, DollarSign, Percent } from 'lucide-react';

const PLATFORMS = ['G2G', 'Itemku', 'Discord', 'Direct', 'Other'];

export default function SalesHistoryPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [summary, setSummary] = useState({ revenue: 0, hpp: 0, profit: 0, qty: 0 });
  const limit = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, status: 'Completed', platform, date_from: dateFrom, date_to: dateTo, page: String(page), limit: String(limit) });
      const res = await fetch(`/api/transactions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setTotal(data.total || 0);
        const txs = data.transactions || [];
        setSummary({
          revenue: txs.reduce((s: number, t: any) => s + t.total, 0),
          hpp: txs.reduce((s: number, t: any) => s + t.total_hpp, 0),
          profit: txs.reduce((s: number, t: any) => s + t.profit, 0),
          qty: txs.reduce((s: number, t: any) => s + t.quantity, 0),
        });
      }
    } finally { setLoading(false); }
  }, [search, platform, dateFrom, dateTo, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(total / limit);
  const avgMargin = summary.revenue > 0 ? (summary.profit / summary.revenue) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Sales History</h1>
            <div className="page-subtitle">Archived completed sales records and financial breakdown</div>
          </div>
        </div>

        {/* Summary Grid */}
        <div className="stats-grid mb-6">
          <div className="stat-card">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Gross Sales Revenue</span>
              <DollarSign size={16} className="text-[var(--accent)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--accent)]">{formatCurrency(summary.revenue)}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">From completed orders</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Total HPP Cost</span>
              <ShoppingCart size={16} className="text-[var(--text-secondary)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--text-secondary)]">{formatCurrency(summary.hpp)}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">Cost of items sold</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Net Sales Profit</span>
              <TrendingUp size={16} className="text-[var(--success)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--success)]">{formatCurrency(summary.profit)}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">Total profit margin</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Average Profit Margin</span>
              <Percent size={16} className="text-[var(--warning)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--warning)]">{avgMargin.toFixed(1)}%</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">Percentage return</div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="card p-3 mb-4 flex gap-3 flex-wrap items-center">
          <div className="search-bar flex-1 min-w-[200px]">
            <Search size={15} className="text-[var(--text-muted)]" />
            <input
              placeholder="Search sales history..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-[var(--text-muted)] hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={platform}
            onChange={e => { setPlatform(e.target.value); setPage(1); }}
            className="input w-auto h-9 text-xs"
          >
            <option value="">All Platforms</option>
            {PLATFORMS.map(p => <option key={p}>{p}</option>)}
          </select>

          <input
            type="date"
            className="input w-auto h-9 text-xs"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1); }}
          />
          <input
            type="date"
            className="input w-auto h-9 text-xs"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1); }}
          />
        </div>

        {/* Data Table */}
        <div className="data-table-container">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order Code</th>
                  <th>Date & Time</th>
                  <th>Product Name</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-right">Total Revenue</th>
                  <th className="text-right">HPP</th>
                  <th className="text-right">Net Profit</th>
                  <th className="text-right">Margin</th>
                  <th>Platform</th>
                  <th>Buyer</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 11 }).map((_, j) => (
                        <td key={j}><div className="skeleton h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={11}>
                      <div className="empty-state py-12">
                        <History size={40} className="empty-state-icon" />
                        <h3 className="font-bold text-sm">No Sales History Found</h3>
                        <p className="text-xs text-[var(--text-muted)]">Completed transactions will appear here.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map(tx => (
                    <tr key={tx.id}>
                      <td className="font-mono text-xs text-[var(--accent)] font-semibold">{tx.transaction_code}</td>
                      <td className="text-xs text-[var(--text-muted)] whitespace-nowrap">{formatDateTime(tx.created_at)}</td>
                      <td className="font-semibold text-[var(--text-primary)]">{tx.product_name}</td>
                      <td className="text-right font-bold">{tx.quantity}</td>
                      <td className="text-right">{formatCurrency(tx.unit_price_snapshot)}</td>
                      <td className="text-right font-bold text-[var(--text-primary)]">{formatCurrency(tx.total)}</td>
                      <td className="text-right text-[var(--text-secondary)]">{formatCurrency(tx.total_hpp)}</td>
                      <td className="text-right font-bold text-[var(--success)]">{formatCurrency(tx.profit)}</td>
                      <td className="text-right text-[var(--success)]">{formatPercent(tx.margin)}</td>
                      <td><span className="badge badge-inactive">{tx.platform}</span></td>
                      <td className="text-xs text-[var(--text-muted)]">{tx.buyer_username || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)]">
              <span>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} records</span>
              <div className="pagination">
                <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft size={14} />
                </button>
                <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
