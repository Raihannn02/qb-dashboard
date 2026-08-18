'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import ActionMenu from '@/components/ui/ActionMenu';
import DeleteModal from '@/components/ui/DeleteModal';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, formatPercent } from '@/lib/utils';
import {
  Package, Plus, Search, Edit2, Eye, ChevronLeft, ChevronRight, X, Check,
  Box, AlertTriangle, Layers, Trash2, Power, Copy
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
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
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
  };

  const openDuplicate = (p: any) => {
    setEditProduct(null);
    setForm({
      name: `${p.name} (Copy)`, category: p.category, subcategory: p.subcategory || '',
      default_price: String(p.default_price), cost_price: String(p.cost_price),
      unit: p.unit || 'pcs', status: 'Active', notes: p.notes || '', initial_stock: '0',
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
        showToast(editProduct ? 'Product updated successfully' : 'Product added successfully');
        setShowForm(false);
        fetchProducts();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed', 'error');
      }
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        const result = await res.json();
        if (result.deactivated) {
          showToast(`Product "${deleteTarget.name}" deactivated (historical records kept)`);
        } else {
          showToast(`Product "${deleteTarget.name}" deleted permanently`);
        }
        setDeleteTarget(null);
        fetchProducts();
      } else {
        showToast('Failed to delete product', 'error');
      }
    } finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / limit);

  // Quick Stats
  const activeCount = products.filter(p => p.status === 'Active').length;
  const lowStockCount = products.filter(p => (p.current_stock ?? 0) <= 5).length;
  const inactiveCount = products.filter(p => p.status !== 'Active').length;

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
            <h1 className="page-title">Product Catalog</h1>
            <div className="page-subtitle">Manage Grow a Garden 2 items, HPP pricing, and catalog status</div>
          </div>
          <button onClick={openAdd} className="btn btn-primary">
            <Plus size={16} /> Add Product
          </button>
        </div>

        {/* Metric Summary Cards */}
        <div className="stats-grid">
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
        <div className="filter-card">
          <div className="search-bar flex-1 min-w-[260px]">
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
            className="filter-select"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>

          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="filter-select"
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
                  <th className="text-center w-16">Actions</th>
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
                      <EmptyState
                        icon={Package}
                        title="No Products Found"
                        description="No catalog items match your search or filter options."
                        actionLabel="+ Add Product"
                        onAction={openAdd}
                      />
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
                          className="hover:text-[var(--accent)] text-left transition-colors"
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
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedDrawerProduct(p)}
                            title="View Product Details"
                            className="btn-action-icon"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => openEdit(p)}
                            title="Edit Product"
                            className="btn-action-icon"
                          >
                            <Edit2 size={13} />
                          </button>
                          <ActionMenu
                            items={[
                              { label: 'View Details', icon: Eye, onClick: () => setSelectedDrawerProduct(p) },
                              { label: 'Edit Product', icon: Edit2, onClick: () => openEdit(p) },
                              { label: 'Duplicate', icon: Copy, onClick: () => openDuplicate(p) },
                              { label: 'Delete Product', icon: Trash2, variant: 'danger', onClick: () => setDeleteTarget(p) },
                            ]}
                          />
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
            <div className="flex items-center justify-between p-4 border-t border-[var(--border)] text-xs">
              <span className="text-[var(--text-muted)]">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} products
              </span>
              <div className="flex gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="btn btn-secondary btn-sm"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="btn btn-secondary btn-sm"
                >
                  Next <ChevronRight size={14} />
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
            onConfirmDeactivate={handleDelete}
            title="Delete Product"
            itemName={deleteTarget.name}
            itemType="product"
            hasHistoricalRecords={deleteTarget.total_sold > 0 || (deleteTarget.current_stock ?? 0) > 0}
            isDeleting={deleting}
          />
        )}

        {/* Add/Edit Modal */}
        {showForm && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3 className="font-bold text-base text-[var(--text-primary)]">
                  {editProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-icon">
                  <X size={16} />
                </button>
              </div>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    className="input"
                    placeholder="e.g. Dragon Fruit, Raccoon"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                      placeholder="e.g. Mythic, Rare"
                      value={form.subcategory}
                      onChange={e => setForm({ ...form, subcategory: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="form-group">
                    <label className="form-label">Selling Price (Rp)</label>
                    <input
                      type="number"
                      className="input"
                      value={form.default_price}
                      onChange={e => setForm({ ...form, default_price: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cost / HPP (Rp)</label>
                    <input
                      type="number"
                      className="input"
                      value={form.cost_price}
                      onChange={e => setForm({ ...form, cost_price: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <input
                      className="input"
                      placeholder="pcs"
                      value={form.unit}
                      onChange={e => setForm({ ...form, unit: e.target.value })}
                    />
                  </div>
                </div>

                {!editProduct && (
                  <div className="form-group">
                    <label className="form-label">Initial Stock Units</label>
                    <input
                      type="number"
                      className="input"
                      value={form.initial_stock}
                      onChange={e => setForm({ ...form, initial_stock: e.target.value })}
                    />
                  </div>
                )}

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
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowForm(false)} className="btn btn-secondary text-xs">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary text-xs">
                  {saving ? 'Saving...' : editProduct ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
