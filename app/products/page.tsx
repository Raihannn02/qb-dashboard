'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import { formatCurrency, formatPercent, formatDateTime } from '@/lib/utils';
import { Package, Plus, Search, Edit2, PowerOff, Eye, ChevronLeft, ChevronRight, X, Check, Copy } from 'lucide-react';

const CATEGORIES = ['Fruit', 'Pet', 'Egg', 'Gear', 'Sprinkler', 'Tool', 'Variant', 'Other'];
const STATUSES = ['Active', 'Inactive', 'Discontinued'];

interface ProductForm {
  name: string; category: string; subcategory: string;
  default_price: string; cost_price: string; unit: string;
  status: string; notes: string; initial_stock: string;
}

const emptyForm: ProductForm = {
  name: '', category: 'Fruit', subcategory: '', default_price: '0',
  cost_price: '0', unit: 'pcs', status: 'Active', notes: '', initial_stock: '0',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<any>(null);
  const [toast, setToast] = useState<{msg: string, type: string} | null>(null);
  const limit = 15;

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, category, status, page: String(page), limit: String(limit) });
      const res = await fetch(`/api/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setTotal(data.total || 0);
      }
    } finally { setLoading(false); }
  }, [search, category, status, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchProducts(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const openAdd = () => { setEditProduct(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (p: any) => {
    setEditProduct(p);
    setForm({
      name: p.name, category: p.category, subcategory: p.subcategory || '',
      default_price: String(p.default_price), cost_price: String(p.cost_price),
      unit: p.unit || 'pcs', status: p.status, notes: p.notes || '', initial_stock: '0',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.category) { showToast('Name and category required', 'error'); return; }
    setSaving(true);
    try {
      const url = editProduct ? `/api/products/${editProduct.id}` : '/api/products';
      const method = editProduct ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          default_price: parseFloat(form.default_price) || 0,
          cost_price: parseFloat(form.cost_price) || 0,
          initial_stock: parseInt(form.initial_stock) || 0,
        }),
      });
      if (res.ok) {
        showToast(editProduct ? 'Product updated!' : 'Product added!');
        setShowForm(false);
        fetchProducts();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed', 'error');
      }
    } finally { setSaving(false); }
  };

  const handleDeactivate = async () => {
    if (!confirmDeactivate) return;
    const res = await fetch(`/api/products/${confirmDeactivate.id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast(`"${confirmDeactivate.name}" deactivated`);
      setConfirmDeactivate(null);
      fetchProducts();
    }
  };

  const totalPages = Math.ceil(total / limit);

  const getStatusBadge = (s: string) => {
    if (s === 'Active') return 'badge badge-active';
    if (s === 'Inactive') return 'badge badge-inactive';
    return 'badge badge-cancelled';
  };

  return (
    <DashboardLayout>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Products</h1>
            <div className="page-subtitle">Master product catalog — {total} total</div>
          </div>
          <button onClick={openAdd} className="btn btn-primary">
            <Plus size={14} /> Add Product
          </button>
        </div>

        {/* Filters */}
        <div className="card" style={{ padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
            <Search size={14} color="var(--text-muted)" />
            <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={13} /></button>}
          </div>
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="input" style={{ width: 'auto' }}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input" style={{ width: 'auto' }}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th><th>Product Name</th><th>Category</th><th>Status</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>HPP</th>
                  <th style={{ textAlign: 'right' }}>Stock</th>
                  <th style={{ textAlign: 'right' }}>Profit</th>
                  <th style={{ textAlign: 'right' }}>Margin</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                      ))}
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr><td colSpan={10}>
                    <div className="empty-state">
                      <Package size={36} className="empty-state-icon" />
                      <h3>No Products Yet</h3>
                      <p>Start by adding your first Grow a Garden 2 product.</p>
                      <button onClick={openAdd} className="btn btn-primary btn-sm"><Plus size={13} /> Add Product</button>
                    </div>
                  </td></tr>
                ) : products.map((p) => {
                  const margin = p.total_revenue > 0 ? (p.total_profit / p.total_revenue) * 100 : 0;
                  return (
                    <tr key={p.id}>
                      <td className="muted" style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.product_code}</td>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td><span className="badge badge-inactive">{p.category}</span></td>
                      <td><span className={getStatusBadge(p.status)}>{p.status}</span></td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(p.default_price)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{formatCurrency(p.cost_price)}</td>
                      <td style={{ textAlign: 'right', color: p.current_stock === 0 ? 'var(--danger)' : p.current_stock <= 5 ? 'var(--warning)' : 'var(--text-primary)', fontWeight: 600 }}>
                        {p.current_stock ?? 0}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(p.total_profit)}</td>
                      <td style={{ textAlign: 'right', color: margin > 0 ? 'var(--success)' : 'var(--text-muted)' }}>{formatPercent(margin)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button onClick={() => openEdit(p)} className="btn btn-secondary btn-icon btn-sm" title="Edit"><Edit2 size={12} /></button>
                          {p.status === 'Active' && (
                            <button onClick={() => setConfirmDeactivate(p)} className="btn btn-icon btn-sm" title="Deactivate"
                              style={{ background: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.2)' }}>
                              <PowerOff size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Showing {(page-1)*limit+1}–{Math.min(page*limit, total)} of {total}
              </span>
              <div className="pagination">
                <button className="page-btn" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}><ChevronLeft size={14} /></button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  return <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>;
                })}
                <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>{editProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Product Name *</label>
                  <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Black Dragon" />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Subcategory</label>
                  <input className="input" value={form.subcategory} onChange={e => setForm({...form, subcategory: e.target.value})} placeholder="Optional" />
                </div>
                <div className="form-group">
                  <label className="form-label">Default Price (Rp)</label>
                  <input className="input" type="number" value={form.default_price} onChange={e => setForm({...form, default_price: e.target.value})} min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">HPP / Unit (Rp)</label>
                  <input className="input" type="number" value={form.cost_price} onChange={e => setForm({...form, cost_price: e.target.value})} min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <input className="input" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} placeholder="pcs" />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                {!editProduct && (
                  <div className="form-group">
                    <label className="form-label">Initial Stock</label>
                    <input className="input" type="number" value={form.initial_stock} onChange={e => setForm({...form, initial_stock: e.target.value})} min="0" />
                  </div>
                )}
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Notes</label>
                  <textarea className="input" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} placeholder="Optional notes..." />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                <Check size={14} /> {saving ? 'Saving...' : editProduct ? 'Update' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Deactivate */}
      {confirmDeactivate && (
        <div className="modal-overlay" onClick={() => setConfirmDeactivate(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Deactivate Product?</h2>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{confirmDeactivate.name}</strong> will no longer appear in new transactions. Historical data will be preserved.
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setConfirmDeactivate(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleDeactivate} className="btn btn-danger"><PowerOff size={13} /> Deactivate</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
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
