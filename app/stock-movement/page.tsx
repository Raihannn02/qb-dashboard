'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import { ArrowLeftRight, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';

const TYPES = ['Stock In', 'Stock Out', 'Adjustment', 'Return', 'Correction'];
const TYPE_COLORS: Record<string, string> = {
  'Stock In': 'var(--success)', 'Return': 'var(--success)',
  'Stock Out': 'var(--danger)', 'Adjustment': 'var(--info)', 'Correction': 'var(--warning)'
};

export default function StockMovementPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const limit = 20;

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, type, date_from: dateFrom, date_to: dateTo, page: String(page), limit: String(limit) });
      const res = await fetch(`/api/stock-movements?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMovements(data.movements || []);
        setTotal(data.total || 0);
      }
    } finally { setLoading(false); }
  }, [search, type, dateFrom, dateTo, page]);

  useEffect(() => { fetchMovements(); }, [fetchMovements]);

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Stock Movement</h1>
            <div className="page-subtitle">All inventory changes — {total} records</div>
          </div>
        </div>

        <div className="card" style={{ padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 180 }}>
            <Search size={14} color="var(--text-muted)" />
            <input placeholder="Search product..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={13} /></button>}
          </div>
          <select value={type} onChange={e => { setType(e.target.value); setPage(1); }} className="input" style={{ width: 'auto' }}>
            <option value="">All Types</option>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <input type="date" className="input" style={{ width: 'auto' }} value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
          <input type="date" className="input" style={{ width: 'auto' }} value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th><th>Product</th><th>Type</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Before</th>
                  <th style={{ textAlign: 'right' }}>After</th>
                  <th>Source</th><th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>)}</tr>
                )) : movements.length === 0 ? (
                  <tr><td colSpan={8}>
                    <div className="empty-state">
                      <ArrowLeftRight size={36} className="empty-state-icon" />
                      <h3>No Stock Movements</h3>
                      <p>Stock changes will appear here automatically.</p>
                    </div>
                  </td></tr>
                ) : movements.map(m => {
                  const isIn = m.type === 'Stock In' || m.type === 'Return';
                  const color = TYPE_COLORS[m.type] || 'var(--text-muted)';
                  return (
                    <tr key={m.id}>
                      <td className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{formatDateTime(m.created_at)}</td>
                      <td style={{ fontWeight: 500 }}>{m.product_name}</td>
                      <td>
                        <span className="badge" style={{ background: `${color}15`, color, border: `1px solid ${color}40` }}>{m.type}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color }}>
                        {isIn ? '+' : m.type === 'Stock Out' ? '-' : ''}{Math.abs(m.quantity)}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{m.stock_before}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{m.stock_after}</td>
                      <td className="muted" style={{ fontSize: 12 }}>{m.source}</td>
                      <td className="muted" style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.notes || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{total} records</span>
              <div className="pagination">
                <button className="page-btn" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}><ChevronLeft size={14} /></button>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: '0 8px' }}>Page {page} of {totalPages}</span>
                <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
