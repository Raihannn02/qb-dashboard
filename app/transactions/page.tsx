'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import { formatCurrency, formatPercent, formatDateTime } from '@/lib/utils';
import { ShoppingCart, Plus, Search, X, ChevronLeft, ChevronRight, Edit2, Check, Trash2 } from 'lucide-react';

const PLATFORMS = ['G2G', 'Itemku', 'Discord', 'Direct', 'Other'];
const STATUSES = ['Pending', 'Processing', 'Completed', 'Cancelled'];

const STATUS_BADGE: Record<string, string> = {
  Pending: 'badge badge-pending', Processing: 'badge badge-processing',
  Completed: 'badge badge-completed', Cancelled: 'badge badge-cancelled',
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
  const [form, setForm] = useState({ product_id: '', quantity: '1', unit_price: '0', hpp: '0', platform: 'Direct', buyer_username: '', status: 'Pending', notes: '' });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [toast, setToast] = useState<{ msg: string, type?: string } | null>(null);
  const limit = 15;

  const showToast = (msg: string, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

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
    if (res.ok) { const data = await res.json(); setProducts(data.products || []); }
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
      if (res.ok) { showToast(editTx ? 'Transaction updated!' : 'Transaction added!'); setShowForm(false); fetchTransactions(); }
      else { const e = await res.json(); showToast(e.error || 'Failed', 'error'); }
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const res = await fetch(`/api/transactions/${confirmDelete.id}`, { method: 'DELETE' });
    if (res.ok) { showToast('Transaction deleted'); setConfirmDelete(null); fetchTransactions(); }
  };

  const updateStatus = async (tx: any, newStatus: string) => {
    const res = await fetch(`/api/transactions/${tx.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) { showToast(`Status → ${newStatus}`); fetchTransactions(); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Transactions</h1>
            <div className="page-subtitle">{total} total transactions</div>
          </div>
          <button onClick={openAdd} className="btn btn-primary"><Plus size={14} /> New Transaction</button>
        </div>

        <div className="card" style={{ padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 180 }}>
            <Search size={14} color="var(--text-muted)" />
            <input placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={13} /></button>}
          </div>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input" style={{ width: 'auto' }}>
            <option value="">All Status</option>{STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
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
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'right' }}>Profit</th>
                  <th style={{ textAlign: 'right' }}>Margin</th>
                  <th>Platform</th><th>Buyer</th><th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 12 }).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>)}</tr>
                )) : transactions.length === 0 ? (
                  <tr><td colSpan={12}>
                    <div className="empty-state">
                      <ShoppingCart size={36} className="empty-state-icon" />
                      <h3>No Transactions Yet</h3>
                      <p>Record your first sale to get started.</p>
                      <button onClick={openAdd} className="btn btn-primary btn-sm"><Plus size={13} /> New Transaction</button>
                    </div>
                  </td></tr>
                ) : transactions.map(tx => (
                  <tr key={tx.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--accent)' }}>{tx.transaction_code}</td>
                    <td className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{formatDateTime(tx.created_at)}</td>
                    <td style={{ fontWeight: 500, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.product_name}</td>
                    <td style={{ fontWeight: 600 }}>{tx.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(tx.unit_price_snapshot)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(tx.total)}</td>
                    <td style={{ textAlign: 'right', color: tx.profit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{formatCurrency(tx.profit)}</td>
                    <td style={{ textAlign: 'right', color: tx.margin >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatPercent(tx.margin)}</td>
                    <td><span className="badge badge-inactive">{tx.platform}</span></td>
                    <td className="muted" style={{ fontSize: 12 }}>{tx.buyer_username || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span className={STATUS_BADGE[tx.status] || 'badge badge-inactive'}>{tx.status}</span>
                        {tx.status === 'Pending' && (
                          <button onClick={() => updateStatus(tx, 'Completed')} style={{ fontSize: 10, cursor: 'pointer', background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 4, padding: '1px 4px' }}>→ Complete</button>
                        )}
                        {tx.status === 'Processing' && (
                          <button onClick={() => updateStatus(tx, 'Completed')} style={{ fontSize: 10, cursor: 'pointer', background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 4, padding: '1px 4px' }}>→ Complete</button>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button onClick={() => openEdit(tx)} className="btn btn-secondary btn-icon btn-sm"><Edit2 size={12} /></button>
                        <button onClick={() => setConfirmDelete(tx)} className="btn btn-icon btn-sm btn-danger"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{total} transactions</span>
              <div className="pagination">
                <button className="page-btn" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}><ChevronLeft size={14} /></button>
                <span style={{ padding: '0 8px', fontSize: 12, color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
                <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>{editTx ? 'Edit Transaction' : 'New Transaction'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Product *</label>
                  <select className="input" value={form.product_id} onChange={e => onProductChange(e.target.value)}>
                    <option value="">Select product...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.product_code})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input className="input" type="number" min="1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Platform</label>
                  <select className="input" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}>
                    {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Price (Rp)</label>
                  <input className="input" type="number" value={form.unit_price} onChange={e => setForm({...form, unit_price: e.target.value})} min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">HPP / Unit (Rp)</label>
                  <input className="input" type="number" value={form.hpp} onChange={e => setForm({...form, hpp: e.target.value})} min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Buyer Username</label>
                  <input className="input" value={form.buyer_username} onChange={e => setForm({...form, buyer_username: e.target.value})} placeholder="Optional" />
                </div>
                {/* Preview */}
                <div style={{ gridColumn: '1/-1', background: 'var(--bg-secondary)', borderRadius: 8, padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Total</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{formatCurrency(calcTotal())}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Profit</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: calcProfit() >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatCurrency(calcProfit())}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Margin</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>
                      {calcTotal() > 0 ? `${((calcProfit()/calcTotal())*100).toFixed(1)}%` : '0%'}
                    </div>
                  </div>
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Notes</label>
                  <textarea className="input" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} placeholder="Optional..." />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                <Check size={14} /> {saving ? 'Saving...' : editTx ? 'Update' : 'Save Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Delete Transaction?</h2>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>
                This will permanently delete <strong style={{ color: 'var(--text-primary)' }}>{confirmDelete.transaction_code}</strong>.
                {confirmDelete.status === 'Completed' && ' Stock will be returned.'}
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setConfirmDelete(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn btn-danger"><Trash2 size={13} /> Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className="toast">
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: toast.type === 'error' ? 'var(--danger)' : 'var(--success)', flexShrink: 0, marginTop: 4 }} />
            <span style={{ fontSize: 13 }}>{toast.msg}</span>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
