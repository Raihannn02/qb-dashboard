'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import { formatCurrency, formatPercent, formatDateTime } from '@/lib/utils';
import { History, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';

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
        // calc summary from current page (server should ideally return totals)
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
            <div className="page-subtitle">Completed transactions only — {total} records</div>
          </div>
        </div>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Revenue', value: formatCurrency(summary.revenue), color: '#6366f1' },
            { label: 'HPP', value: formatCurrency(summary.hpp), color: '#8b5cf6' },
            { label: 'Profit', value: formatCurrency(summary.profit), color: '#22c55e' },
            { label: 'Avg Margin', value: `${avgMargin.toFixed(1)}%`, color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 180 }}>
            <Search size={14} color="var(--text-muted)" />
            <input placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={13} /></button>}
          </div>
          <select value={platform} onChange={e => { setPlatform(e.target.value); setPage(1); }} className="input" style={{ width: 'auto' }}>
            <option value="">All Platforms</option>{PLATFORMS.map(p => <option key={p}>{p}</option>)}
          </select>
          <input type="date" className="input" style={{ width: 'auto' }} value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
          <input type="date" className="input" style={{ width: 'auto' }} value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Date</th><th>Product</th><th>Qty</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th>
                  <th style={{ textAlign: 'right' }}>HPP</th>
                  <th style={{ textAlign: 'right' }}>Profit</th>
                  <th style={{ textAlign: 'right' }}>Margin</th>
                  <th>Platform</th><th>Buyer</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 11 }).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>)}</tr>
                )) : transactions.length === 0 ? (
                  <tr><td colSpan={11}>
                    <div className="empty-state">
                      <History size={36} className="empty-state-icon" />
                      <h3>No Sales History</h3>
                      <p>Complete transactions to see sales history here.</p>
                    </div>
                  </td></tr>
                ) : transactions.map(tx => (
                  <tr key={tx.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--accent)' }}>{tx.transaction_code}</td>
                    <td className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{formatDateTime(tx.created_at)}</td>
                    <td style={{ fontWeight: 500 }}>{tx.product_name}</td>
                    <td>{tx.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(tx.unit_price_snapshot)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(tx.total)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{formatCurrency(tx.total_hpp)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(tx.profit)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--success)' }}>{formatPercent(tx.margin)}</td>
                    <td><span className="badge badge-inactive">{tx.platform}</span></td>
                    <td className="muted" style={{ fontSize: 12 }}>{tx.buyer_username || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{total} records</span>
              <div className="pagination">
                <button className="page-btn" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}><ChevronLeft size={14} /></button>
                <span style={{ padding: '0 8px', fontSize: 12, color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
                <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
