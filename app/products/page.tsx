'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import { formatCurrency, formatPercent } from '@/lib/utils';
import {
  Package, Plus, Search, Edit2, PowerOff, Eye, ChevronLeft, ChevronRight, X, Check,
  MoreVertical, Box, AlertTriangle, Layers, TrendingUp
} from 'lucide-react';

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
  const [selectedDrawerProduct, setSelectedDrawerProduct] = useState<any>(null);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'sales'>('overview');
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<any>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
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
    const t = setTimeout(() => { setPage(1); fetchProducts(); }, 300);
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
    setActiveMenuId(null);
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
        showToast(editProduct ? 'Product updated successfully' : 'Product added successfully');
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
      showToast(`Product "${confirmDeactivate.name}" deactivated`);
      setConfirmDeactivate(null);
      fetchProducts();
    }
  };

  const totalPages = Math.ceil(total / limit);

  // Quick Stats
  const activeCount = products.filter(p => p.status === 'Active').length;
  const lowStockCount = products.filter(p => (p.current_stock ?? 0) <= 5).length;
  const inactiveCount = products.filter(p => p.status !== 'Active').length;

  return (
    <DashboardLayout>
      <div className="page-content">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Product Catalog</h1>
            <div className="page-subtitle">Manage Grow a Garden 2 items, HPP pricing, and catalog status</div>
          </div>
          <button onClick={openAdd} className="btn btn-primary">
            <Plus size={16} /> Add Product
          </button>
        </div>

        {/* Metric Summary Cards */}
        <div className="stats-grid mb-6">
          <div className="stat-card">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Total Catalog</span>
              <Package size={16} className="text-[var(--accent)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{total}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">Registered products</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Active Items</span>
              <Box size={16} className="text-[var(--success)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--success)]">{activeCount}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">Available for sale</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Low Stock</span>
              <AlertTriangle size={16} className="text-[var(--warning)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--warning)]">{lowStockCount}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">≤ 5 units remaining</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Inactive / Paused</span>
              <Layers size={16} className="text-[var(--text-muted)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--text-secondary)]">{inactiveCount}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">Hidden from sales</div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="card p-3 mb-4 flex gap-3 flex-wrap items-center">
          <div className="search-bar flex-1 min-w-[240px]">
            <Search size={15} className="text-[var(--text-muted)]" />
            <input
              placeholder="Search products by code or name... (Ctrl + K)"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-[var(--text-muted)] hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
            className="input w-auto h-9 text-xs"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>

          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="input w-auto h-9 text-xs"
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Data Table */}
        <div className="data-table-container">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">HPP</th>
                  <th className="text-right">Stock</th>
                  <th className="text-right">Total Profit</th>
                  <th className="text-right">Margin</th>
                  <th className="text-center w-20">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <td key={j}><div className="skeleton h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={10}>
                      <div className="empty-state py-12">
                        <Package size={40} className="empty-state-icon" />
                        <h3 className="font-bold text-sm">No Products Found</h3>
                        <p className="text-xs text-[var(--text-muted)]">No items match your filter criteria.</p>
                        <button onClick={openAdd} className="btn btn-primary btn-sm mt-2">
                          <Plus size={14} /> Add Product
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : products.map((p) => {
                  const margin = p.total_revenue > 0 ? (p.total_profit / p.total_revenue) * 100 : 0;
                  return (
                    <tr key={p.id}>
                      <td className="font-mono text-xs text-[var(--text-muted)]">{p.product_code}</td>
                      <td className="font-semibold text-[var(--text-primary)]">
                        <button
                          onClick={() => setSelectedDrawerProduct(p)}
                          className="hover:text-[var(--accent)] hover:underline text-left"
                        >
                          {p.name}
                        </button>
                      </td>
                      <td><span className="badge badge-inactive">{p.category}</span></td>
                      <td>
                        <span className={p.status === 'Active' ? 'badge badge-active' : 'badge badge-inactive'}>
                          {p.status}
                        </span>
                      </td>
                      <td className="text-right font-medium">{formatCurrency(p.default_price)}</td>
                      <td className="text-right text-[var(--text-secondary)]">{formatCurrency(p.cost_price)}</td>
                      <td className={`text-right font-bold ${
                        (p.current_stock ?? 0) === 0 ? 'text-[var(--danger)]' : (p.current_stock ?? 0) <= 5 ? 'text-[var(--warning)]' : 'text-[var(--text-primary)]'
                      }`}>
                        {p.current_stock ?? 0} {p.unit || 'pcs'}
                      </td>
                      <td className="text-right font-bold text-[var(--success)]">{formatCurrency(p.total_profit || 0)}</td>
                      <td className="text-right text-[var(--text-muted)]">{formatPercent(margin)}</td>
                      <td className="text-center relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)}
                          className="btn btn-ghost btn-icon btn-sm"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {/* Inline Dropdown Menu */}
                        {activeMenuId === p.id && (
                          <div
                            className="absolute right-4 mt-1 w-36 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xl z-30 overflow-hidden py-1 text-left"
                            onMouseLeave={() => setActiveMenuId(null)}
                          >
                            <button
                              onClick={() => { setSelectedDrawerProduct(p); setActiveMenuId(null); }}
                              className="w-full px-3 py-2 text-xs flex items-center gap-2 text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                            >
                              <Eye size={14} className="text-[var(--accent)]" /> View Details
                            </button>
                            <button
                              onClick={() => openEdit(p)}
                              className="w-full px-3 py-2 text-xs flex items-center gap-2 text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                            >
                              <Edit2 size={14} className="text-[var(--info)]" /> Edit Item
                            </button>
                            {p.status === 'Active' && (
                              <button
                                onClick={() => { setConfirmDeactivate(p); setActiveMenuId(null); }}
                                className="w-full px-3 py-2 text-xs flex items-center gap-2 text-[var(--danger)] hover:bg-[var(--danger-bg)]"
                              >
                                <PowerOff size={14} /> Deactivate
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)]">
              <span>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} items</span>
              <div className="pagination">
                <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  return (
                    <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>
                      {p}
                    </button>
                  );
                })}
                <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide-over Product Detail Drawer */}
      {selectedDrawerProduct && (
        <div className="modal-overlay" onClick={() => setSelectedDrawerProduct(null)}>
          <div className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <div className="text-xs font-mono text-[var(--accent)]">{selectedDrawerProduct.product_code}</div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">{selectedDrawerProduct.name}</h2>
              </div>
              <button onClick={() => setSelectedDrawerProduct(null)} className="btn btn-ghost btn-icon">
                <X size={18} />
              </button>
            </div>

            {/* Drawer Tabs */}
            <div className="flex border-b border-[var(--border)] px-6 bg-[var(--bg-secondary)] text-xs font-semibold">
              <button
                onClick={() => setDrawerTab('overview')}
                className={`py-3 px-4 border-b-2 transition-colors ${
                  drawerTab === 'overview' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Overview & Financials
              </button>
              <button
                onClick={() => setDrawerTab('sales')}
                className={`py-3 px-4 border-b-2 transition-colors ${
                  drawerTab === 'sales' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Sales Stats
              </button>
            </div>

            <div className="drawer-body space-y-6">
              {drawerTab === 'overview' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                      <div className="text-xs text-[var(--text-muted)] mb-1">Current Stock</div>
                      <div className="text-xl font-bold text-[var(--text-primary)]">
                        {selectedDrawerProduct.current_stock ?? 0} {selectedDrawerProduct.unit || 'pcs'}
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                      <div className="text-xs text-[var(--text-muted)] mb-1">Total Sold</div>
                      <div className="text-xl font-bold text-[var(--success)]">
                        {selectedDrawerProduct.total_sold || 0} units
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border)] text-xs">
                      <span className="text-[var(--text-muted)]">Category</span>
                      <span className="font-semibold text-[var(--text-primary)]">{selectedDrawerProduct.category}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border)] text-xs">
                      <span className="text-[var(--text-muted)]">Default Selling Price</span>
                      <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(selectedDrawerProduct.default_price)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border)] text-xs">
                      <span className="text-[var(--text-muted)]">HPP Cost Price</span>
                      <span className="font-semibold text-[var(--text-secondary)]">{formatCurrency(selectedDrawerProduct.cost_price)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border)] text-xs">
                      <span className="text-[var(--text-muted)]">Total Revenue Generated</span>
                      <span className="font-bold text-[var(--success)]">{formatCurrency(selectedDrawerProduct.total_revenue || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border)] text-xs">
                      <span className="text-[var(--text-muted)]">Total Net Profit</span>
                      <span className="font-bold text-[var(--accent)]">{formatCurrency(selectedDrawerProduct.total_profit || 0)}</span>
                    </div>
                  </div>

                  {selectedDrawerProduct.notes && (
                    <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-xs">
                      <div className="font-semibold text-[var(--text-muted)] mb-1">Item Notes</div>
                      <p className="text-[var(--text-primary)]">{selectedDrawerProduct.notes}</p>
                    </div>
                  )}
                </>
              )}

              {drawerTab === 'sales' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Units Sold:</span>
                      <span className="font-bold">{selectedDrawerProduct.total_sold || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Gross Revenue:</span>
                      <span className="font-bold text-[var(--success)]">{formatCurrency(selectedDrawerProduct.total_revenue || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Net Profit:</span>
                      <span className="font-bold text-[var(--accent)]">{formatCurrency(selectedDrawerProduct.total_profit || 0)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="drawer-footer">
              <button
                onClick={() => openEdit(selectedDrawerProduct)}
                className="btn btn-primary text-xs"
              >
                <Edit2 size={14} /> Edit Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                {editProduct ? 'Edit Product Item' : 'Add New Grow a Garden 2 Product'}
              </h2>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-icon">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Rainbow Fruit / Black Dragon"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="input"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Subcategory</label>
                  <input
                    className="input"
                    value={form.subcategory}
                    onChange={e => setForm({ ...form, subcategory: e.target.value })}
                    placeholder="Optional subcategory"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Default Selling Price (Rp)</label>
                  <input
                    className="input"
                    type="number"
                    value={form.default_price}
                    onChange={e => setForm({ ...form, default_price: e.target.value })}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">HPP Cost Price (Rp)</label>
                  <input
                    className="input"
                    type="number"
                    value={form.cost_price}
                    onChange={e => setForm({ ...form, cost_price: e.target.value })}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <input
                    className="input"
                    value={form.unit}
                    onChange={e => setForm({ ...form, unit: e.target.value })}
                    placeholder="pcs"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Catalog Status</label>
                  <select
                    className="input"
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                  >
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                {!editProduct && (
                  <div className="form-group col-span-2">
                    <label className="form-label">Initial Inventory Stock</label>
                    <input
                      className="input"
                      type="number"
                      value={form.initial_stock}
                      onChange={e => setForm({ ...form, initial_stock: e.target.value })}
                      min="0"
                    />
                  </div>
                )}

                <div className="form-group col-span-2">
                  <label className="form-label">Notes & Description</label>
                  <textarea
                    className="input h-20 py-2 resize-none"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Additional details or attributes..."
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                <Check size={16} /> {saving ? 'Saving...' : editProduct ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDeactivate && (
        <div className="modal-overlay" onClick={() => setConfirmDeactivate(null)}>
          <div className="modal max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-base font-bold text-[var(--text-primary)]">Deactivate Product?</h2>
            </div>
            <div className="modal-body text-xs text-[var(--text-secondary)]">
              Are you sure you want to deactivate <strong className="text-[var(--text-primary)]">{confirmDeactivate.name}</strong>? It will no longer appear in new transactions.
            </div>
            <div className="modal-footer">
              <button onClick={() => setConfirmDeactivate(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleDeactivate} className="btn btn-danger">
                <PowerOff size={14} /> Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className="toast">
            <div className={`w-2.5 h-2.5 rounded-full ${toast.type === 'error' ? 'bg-[var(--danger)]' : 'bg-[var(--success)]'}`} />
            <span className="text-xs font-medium">{toast.msg}</span>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
