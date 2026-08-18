'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import { formatDateTime } from '@/lib/utils';
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
            <h1 className="page-title">Stock Movement Audit Logs</h1>
            <div className="page-subtitle">Historical audit trail of all inventory changes and adjustments ({total} total movements)</div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="card p-3 mb-4 flex gap-3 flex-wrap items-center">
          <div className="search-bar flex-1 min-w-[200px]">
            <Search size={15} className="text-[var(--text-muted)]" />
            <input
              placeholder="Search product code or name..."
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
            value={type}
            onChange={e => { setType(e.target.value); setPage(1); }}
            className="input w-auto h-9 text-xs"
          >
            <option value="">All Movement Types</option>
            {TYPES.map(t => <option key={t}>{t}</option>)}
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
                  <th>Timestamp</th>
                  <th>Product Name</th>
                  <th>Type</th>
                  <th className="text-right">Qty Change</th>
                  <th className="text-right">Stock Before</th>
                  <th className="text-right">Stock After</th>
                  <th>Source</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j}><div className="skeleton h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state py-12">
                        <ArrowLeftRight size={40} className="empty-state-icon" />
                        <h3 className="font-bold text-sm">No Stock Movements Logged</h3>
                        <p className="text-xs text-[var(--text-muted)]">Stock adjustments and sale deductions will automatically record here.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  movements.map(m => {
                    const isIn = m.type === 'Stock In' || m.type === 'Return';
                    const color = TYPE_COLORS[m.type] || 'var(--text-muted)';
                    return (
                      <tr key={m.id}>
                        <td className="text-xs text-[var(--text-muted)] whitespace-nowrap">{formatDateTime(m.created_at)}</td>
                        <td className="font-semibold text-[var(--text-primary)]">{m.product_name}</td>
                        <td>
                          <span className="badge font-bold" style={{ background: `${color}18`, color, border: `1px solid ${color}35` }}>
                            {m.type}
                          </span>
                        </td>
                        <td className="text-right font-bold text-sm" style={{ color }}>
                          {isIn ? '+' : m.type === 'Stock Out' ? '-' : ''}{Math.abs(m.quantity)}
                        </td>
                        <td className="text-right text-[var(--text-muted)]">{m.stock_before}</td>
                        <td className="text-right font-bold text-[var(--text-primary)]">{m.stock_after}</td>
                        <td className="text-xs text-[var(--text-muted)]">{m.source}</td>
                        <td className="text-xs text-[var(--text-muted)] max-w-xs truncate">{m.notes || '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)]">
              <span>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} logs</span>
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
