'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import ActionMenu from '@/components/ui/ActionMenu';
import DeleteModal from '@/components/ui/DeleteModal';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, formatPercent, formatDateTime } from '@/lib/utils';
import {
  ShoppingCart, Plus, Search, X, ChevronLeft, ChevronRight, Edit2, Check, Trash2,
  Eye, TrendingUp, DollarSign, Clock, CheckCircle2, ShieldAlert, AlertTriangle
} from 'lucide-react';

const PLATFORMS = ['G2G', 'Itemku', 'Discord', 'Direct', 'Other'];
const STATUSES = ['Pending', 'Processing', 'Completed', 'Cancelled'];

const STATUS_BADGE: Record<string, string> = {
  Pending: 'badge badge-pending',
  Processing: 'badge badge-processing',
  Completed: 'badge badge-completed',
  Cancelled: 'badge badge-cancelled',
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [platform, setPlatform] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editTx, setEditTx] = useState<any>(null);
  const [selectedDrawerTx, setSelectedDrawerTx] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    product_id: '', quantity: '1', unit_price: '0', hpp: '0', platform: 'Direct',
    buyer_username: '', status: 'Pending', notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type?: string } | null>(null);
  const limit = 15;

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, status, platform, date_from: dateFrom, date_to: dateTo, page: String(page), limit: String(limit) });
      const res = await fetch(`/api/transactions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setTotal(data.total || 0);
      }
    } finally { setLoading(false); }
  }, [search, status, platform, dateFrom, dateTo, page]);

  const fetchProducts = async () => {
    const res = await fetch('/api/products?status=Active&limit=200');
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products || []);
    }
  };

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);
  useEffect(() => { fetchProducts(); }, []);

  const openAdd = () => {
    setEditTx(null);
    setForm({ product_id: '', quantity: '1', unit_price: '0', hpp: '0', platform: 'Direct', buyer_username: '', status: 'Pending', notes: '' });
    setShowForm(true);
  };

  const openEdit = (tx: any) => {
    setEditTx(tx);
    setForm({
      product_id: tx.product_id, quantity: String(tx.quantity), unit_price: String(tx.unit_price_snapshot),
      hpp: String(tx.hpp_snapshot), platform: tx.platform, buyer_username: tx.buyer_username || '',
      status: tx.status, notes: tx.notes || '',
    });
    setShowForm(true);
  };

  const onProductChange = (id: string) => {
    const p = products.find(pr => pr.id === id);
    setForm(f => ({ ...f, product_id: id, unit_price: String(p?.default_price || 0), hpp: String(p?.cost_price || 0) }));
  };

  const calcTotal = () => { const qty = parseFloat(form.quantity) || 0; const price = parseFloat(form.unit_price) || 0; return qty * price; };
  const calcProfit = () => { const qty = parseFloat(form.quantity) || 0; const price = parseFloat(form.unit_price) || 0; const hpp = parseFloat(form.hpp) || 0; return qty * price - qty * hpp; };

  const handleSave = async () => {
    if (!form.product_id || !form.quantity) { showToast('Product and quantity required', 'error'); return; }
    setSaving(true);
    try {
      const url = editTx ? `/api/transactions/${editTx.id}` : '/api/transactions';
      const method = editTx ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, quantity: parseInt(form.quantity), unit_price: parseFloat(form.unit_price), hpp: parseFloat(form.hpp) }),
      });
      if (res.ok) { showToast(editTx ? 'Transaction updated' : 'Transaction created'); setShowForm(false); fetchTransactions(); }
      else { const e = await res.json(); showToast(e.error || 'Failed', 'error'); }
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/transactions/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Transaction "${deleteTarget.transaction_code}" deleted`);
        setDeleteTarget(null);
        fetchTransactions();
      } else {
        showToast('Failed to delete transaction', 'error');
      }
    } finally { setDeleting(false); }
  };

  const updateStatus = async (tx: any, newStatus: string) => {
    const res = await fetch(`/api/transactions/${tx.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) { showToast(`Status updated to ${newStatus}`); fetchTransactions(); }
  };

  const totalPages = Math.ceil(total / limit);

  // Summary Metrics
  const grossSalesSum = transactions.reduce((sum, t) => sum + (t.total || 0), 0);
  const profitSum = transactions.reduce((sum, t) => sum + (t.profit || 0), 0);
  const pendingOrdersCount = transactions.filter(t => t.status === 'Pending' || t.status === 'Processing').length;

  return (
    <DashboardLayout>
      <div className="page-content space-y-6">
        {/* Toast */}
        {toast && (
          <div className="toast-container">
            <div className={`toast ${toast.type === 'error' ? 'border-[var(--danger)]' : 'border-[var(--success)]'}`}>
              <Check size={16} className={toast.type === 'error' ? 'text-[var(--danger)]' : 'text-[var(--success)]'} />
              <span className="text-xs font-semibold">{toast.msg}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Sales Transactions</h1>
            <div className="page-subtitle">Track customer orders, sales channels, and snapshot pricing</div>
          </div>
          <button onClick={openAdd} className="btn btn-primary">
            <Plus size={16} /> New Transaction
          </button>
        </div>

        {/* Metric Summary Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Total Orders</span>
              <ShoppingCart size={16} className="text-[var(--accent)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{total}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">Recorded sales transactions</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Gross Sales</span>
              <DollarSign size={16} className="text-[var(--success)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--success)]">{formatCurrency(grossSalesSum)}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">Current page turnover</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Net Profit</span>
              <TrendingUp size={16} className="text-[var(--accent)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--accent)]">{formatCurrency(profitSum)}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">After cost of goods</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Pending Fulfillment</span>
              <Clock size={16} className="text-[var(--warning)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--warning)]">{pendingOrdersCount}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">Orders in queue</div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="filter-card">
          <div className="search-bar flex-1 min-w-[260px]">
            <Search size={15} className="text-[var(--text-muted)]" />
            <input
              placeholder="Search code, buyer, product..."
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
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>

          <select
            value={platform}
            onChange={e => { setPlatform(e.target.value); setPage(1); }}
            className="filter-select"
          >
            <option value="">All Platforms</option>
            {PLATFORMS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        {/* Data Table */}
        <div className="data-table-container">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Date</th>
                  <th>Product</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Profit</th>
                  <th className="text-right">Margin</th>
                  <th>Channel</th>
                  <th>Buyer</th>
                  <th>Status</th>
                  <th className="text-center w-16">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 12 }).map((_, j) => (
                        <td key={j}><div className="skeleton h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={12}>
                      <EmptyState
                        icon={ShoppingCart}
                        title="No Transactions Recorded"
                        description="No sales transactions matched your filter search."
                        actionLabel="+ New Transaction"
                        onAction={openAdd}
                      />
                    </td>
                  </tr>
                ) : (
                  transactions.map(tx => (
                    <tr key={tx.id}>
                      <td className="font-mono text-xs text-[var(--accent)] font-semibold">{tx.transaction_code}</td>
                      <td className="text-xs text-[var(--text-muted)] whitespace-nowrap">{formatDateTime(tx.created_at)}</td>
                      <td className="font-semibold text-[var(--text-primary)]">
                        <button
                          onClick={() => setSelectedDrawerTx(tx)}
                          className="hover:text-[var(--accent)] text-left transition-colors"
                        >
                          {tx.product_name}
                        </button>
                      </td>
                      <td className="text-right font-bold">{tx.quantity}</td>
                      <td className="text-right">{formatCurrency(tx.unit_price_snapshot)}</td>
                      <td className="text-right font-bold text-[var(--text-primary)]">{formatCurrency(tx.total)}</td>
                      <td className={`text-right font-bold ${tx.profit >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                        {formatCurrency(tx.profit)}
                      </td>
                      <td className={`text-right ${tx.margin >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                        {formatPercent(tx.margin)}
                      </td>
                      <td><span className="badge badge-inactive">{tx.platform}</span></td>
                      <td className="text-xs text-[var(--text-muted)]">{tx.buyer_username || '—'}</td>
                      <td>
                        <div className="flex flex-col gap-1 items-start">
                          <span className={STATUS_BADGE[tx.status] || 'badge badge-inactive'}>{tx.status}</span>
                          {(tx.status === 'Pending' || tx.status === 'Processing') && (
                            <button
                              onClick={() => updateStatus(tx, 'Completed')}
                              className="text-[10px] font-semibold text-[var(--success)] hover:underline flex items-center gap-0.5"
                            >
                              <CheckCircle2 size={10} /> Mark Complete
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEdit(tx)}
                            title="Edit Order"
                            className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--accent-light)] text-[var(--text-secondary)] hover:text-[var(--accent)] flex items-center justify-center transition-all border border-[var(--border)]"
                          >
                            <Edit2 size={13} />
                          </button>
                          <ActionMenu
                            items={[
                              { label: 'View Order Drawer', icon: Eye, onClick: () => setSelectedDrawerTx(tx) },
                              { label: 'Edit Order', icon: Edit2, onClick: () => openEdit(tx) },
                              ...(tx.status !== 'Completed' ? [{ label: 'Mark Complete', icon: CheckCircle2, onClick: () => updateStatus(tx, 'Completed') }] : []),
                              { label: 'Delete Transaction', icon: Trash2, variant: 'danger', onClick: () => setDeleteTarget(tx) },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)]">
              <span>Page {page} of {totalPages}</span>
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

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <DeleteModal
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirmDelete={handleDelete}
            title="Delete Transaction"
            itemName={`${deleteTarget.transaction_code} (${deleteTarget.product_name})`}
            itemType="transaction"
            isDeleting={deleting}
          />
        )}

        {/* New/Edit Transaction Modal */}
        {showForm && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3 className="font-bold text-base text-[var(--text-primary)]">{editTx ? 'Edit Transaction' : 'New Sales Transaction'}</h3>
                <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-icon"><X size={16} /></button>
              </div>

              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label className="form-label">Select Product *</label>
                  <select
                    className="input"
                    value={form.product_id}
                    onChange={e => onProductChange(e.target.value)}
                    disabled={!!editTx}
                  >
                    <option value="">Choose item from catalog...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.product_code}) — {formatCurrency(p.default_price)}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="form-group">
                    <label className="form-label">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      className="input"
                      value={form.quantity}
                      onChange={e => setForm({ ...form, quantity: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit Price (Rp)</label>
                    <input
                      type="number"
                      className="input"
                      value={form.unit_price}
                      onChange={e => setForm({ ...form, unit_price: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit HPP (Rp)</label>
                    <input
                      type="number"
                      className="input"
                      value={form.hpp}
                      onChange={e => setForm({ ...form, hpp: e.target.value })}
                    />
                  </div>
                </div>

                {/* Live Order Calculation Summary */}
                <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-[var(--text-muted)]">Order Total Amount</div>
                    <div className="font-bold text-sm text-[var(--text-primary)]">{formatCurrency(calcTotal())}</div>
                  </div>
                  <div>
                    <div className="text-[var(--text-muted)]">Net Transaction Profit</div>
                    <div className="font-bold text-sm text-[var(--success)]">{formatCurrency(calcProfit())}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">Sales Channel</label>
                    <select
                      className="input"
                      value={form.platform}
                      onChange={e => setForm({ ...form, platform: e.target.value })}
                    >
                      {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fulfillment Status</label>
                    <select
                      className="input"
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value })}
                    >
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Buyer Username / Contact</label>
                  <input
                    className="input"
                    placeholder="e.g. RobloxUser_123"
                    value={form.buyer_username}
                    onChange={e => setForm({ ...form, buyer_username: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button onClick={() => setShowForm(false)} className="btn btn-secondary text-xs">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary text-xs">
                  {saving ? 'Saving...' : editTx ? 'Save Changes' : 'Create Transaction'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
