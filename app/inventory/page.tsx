'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import { formatCurrency } from '@/lib/utils';
import { Boxes, Search, X, ChevronLeft, ChevronRight, ArrowUpDown, AlertTriangle, CheckCircle, Package } from 'lucide-react';

const CATEGORIES = ['Fruit', 'Pet', 'Egg', 'Gear', 'Sprinkler', 'Tool', 'Variant', 'Other'];
const STOCK_STATUSES = ['In Stock', 'Low Stock', 'Out of Stock'];

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [showAdjust, setShowAdjust] = useState<any>(null);
  const [adjustForm, setAdjustForm] = useState({ type: 'Stock In', quantity: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const limit = 15;

  const showToastMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, category, stock_status: stockStatus, page: String(page), limit: String(limit) });
      const res = await fetch(`/api/inventory?${params}`);
      if (res.ok) {
        const data = await res.json();
        setInventory(data.inventory || []);
        setTotal(data.total || 0);
      }
    } finally { setLoading(false); }
  }, [search, category, stockStatus, page]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const handleAdjust = async () => {
    if (!adjustForm.quantity || parseInt(adjustForm.quantity) <= 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/stock-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: showAdjust.id, ...adjustForm, quantity: parseInt(adjustForm.quantity) }),
      });
      if (res.ok) {
        showToastMsg(`Stock updated for "${showAdjust.name}"`);
        setShowAdjust(null);
        fetchInventory();
      }
    } finally { setSaving(false); }
  };

  const stockBadge = (s: string) => {
    if (s === 'Out of Stock') return 'badge badge-out-of-stock';
    if (s === 'Low Stock') return 'badge badge-low-stock';
    return 'badge badge-in-stock';
  };

  const totalPages = Math.ceil(total / limit);
  const totalStockUnits = inventory.reduce((sum, i) => sum + (i.current_stock || 0), 0);
  const totalStockValue = inventory.reduce((sum, i) => sum + (i.stock_value || 0), 0);
  const lowStockItems = inventory.filter(i => i.stock_status === 'Low Stock').length;
  const outOfStockItems = inventory.filter(i => i.stock_status === 'Out of Stock').length;

  // Calculate math preview for adjustment
  const currentVal = showAdjust?.current_stock || 0;
  const qtyVal = parseInt(adjustForm.quantity) || 0;
  let newCalculatedStock = currentVal;
  if (adjustForm.type === 'Stock In' || adjustForm.type === 'Return') {
    newCalculatedStock = currentVal + qtyVal;
  } else if (adjustForm.type === 'Stock Out') {
    newCalculatedStock = Math.max(0, currentVal - qtyVal);
  } else if (adjustForm.type === 'Adjustment' || adjustForm.type === 'Correction') {
    newCalculatedStock = qtyVal;
  }

  return (
    <DashboardLayout>
      <div className="page-content">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Stock Management</h1>
            <div className="page-subtitle">Real-time inventory levels and warehouse stock adjustments</div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="stats-grid mb-6">
          <div className="stat-card">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Total Units in Stock</span>
              <Boxes size={16} className="text-[var(--accent)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{totalStockUnits.toLocaleString()}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">Across all active items</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Stock Asset Value</span>
              <Package size={16} className="text-[var(--success)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--success)]">{formatCurrency(totalStockValue)}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">Based on default prices</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Low Stock Items</span>
              <AlertTriangle size={16} className="text-[var(--warning)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--warning)]">{lowStockItems}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">Requires reorder</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Out of Stock</span>
              <X size={16} className="text-[var(--danger)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--danger)]">{outOfStockItems}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">0 units remaining</div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-3 mb-4 flex gap-3 flex-wrap items-center">
          <div className="search-bar flex-1 min-w-[240px]">
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
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
            className="input w-auto h-9 text-xs"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>

          <select
            value={stockStatus}
            onChange={e => { setStockStatus(e.target.value); setPage(1); }}
            className="input w-auto h-9 text-xs"
          >
            <option value="">All Stock Status</option>
            {STOCK_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Data Table */}
        <div className="data-table-container">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th className="text-right">Stock</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-right">Stock Value</th>
                  <th>Status</th>
                  <th className="text-center w-24">Adjust</th>
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
                ) : inventory.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state py-12">
                        <Boxes size={40} className="empty-state-icon" />
                        <h3 className="font-bold text-sm">No Stock Records</h3>
                        <p className="text-xs text-[var(--text-muted)]">No inventory matched your filter search.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  inventory.map(item => (
                    <tr key={item.id}>
                      <td className="font-mono text-xs text-[var(--text-muted)]">{item.product_code}</td>
                      <td className="font-semibold text-[var(--text-primary)]">{item.name}</td>
                      <td><span className="badge badge-inactive">{item.category}</span></td>
                      <td className={`text-right font-bold ${
                        item.current_stock === 0 ? 'text-[var(--danger)]' : item.stock_status === 'Low Stock' ? 'text-[var(--warning)]' : 'text-[var(--text-primary)]'
                      }`}>
                        {item.current_stock} {item.unit || 'pcs'}
                      </td>
                      <td className="text-right text-[var(--text-secondary)]">{formatCurrency(item.default_price)}</td>
                      <td className="text-right font-semibold text-[var(--success)]">{formatCurrency(item.stock_value)}</td>
                      <td><span className={stockBadge(item.stock_status)}>{item.stock_status}</span></td>
                      <td className="text-center">
                        <button
                          onClick={() => {
                            setShowAdjust(item);
                            setAdjustForm({ type: 'Stock In', quantity: '', notes: '' });
                          }}
                          className="btn btn-secondary btn-icon btn-sm"
                          title="Adjust Stock Level"
                        >
                          <ArrowUpDown size={14} />
                        </button>
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
      </div>

      {/* Stock Adjust Modal with Math Preview */}
      {showAdjust && (
        <div className="modal-overlay" onClick={() => setShowAdjust(null)}>
          <div className="modal max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-base font-bold text-[var(--text-primary)]">Adjust Inventory Stock</h2>
              <button onClick={() => setShowAdjust(null)} className="btn btn-ghost btn-icon">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body space-y-4">
              <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                <div className="font-bold text-sm text-[var(--text-primary)]">{showAdjust.name}</div>
                <div className="text-xs text-[var(--text-muted)]">Code: {showAdjust.product_code}</div>
              </div>

              <div className="form-group">
                <label className="form-label">Movement Type</label>
                <select
                  className="input"
                  value={adjustForm.type}
                  onChange={e => setAdjustForm({ ...adjustForm, type: e.target.value })}
                >
                  <option value="Stock In">Stock In (Receive + Add)</option>
                  <option value="Stock Out">Stock Out (Deduct)</option>
                  <option value="Adjustment">Set Exact Stock</option>
                  <option value="Return">Customer Return (+ Add)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input
                  className="input"
                  type="number"
                  value={adjustForm.quantity}
                  onChange={e => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                  min="1"
                  placeholder="Enter amount..."
                />
              </div>

              {/* Math Preview Box */}
              {qtyVal > 0 && (
                <div className="p-3.5 rounded-xl bg-[var(--accent-light)] border border-[var(--accent-glow)] text-xs space-y-1">
                  <div className="font-bold text-[var(--accent)] mb-1">Stock Math Preview</div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Current Stock:</span>
                    <span>{currentVal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Movement ({adjustForm.type}):</span>
                    <span>{adjustForm.type === 'Stock Out' ? `-${qtyVal}` : `+${qtyVal}`}</span>
                  </div>
                  <div className="flex justify-between border-t border-[var(--border)] pt-1.5 font-bold text-sm text-[var(--text-primary)]">
                    <span>New Stock Level:</span>
                    <span className="text-[var(--success)]">{newCalculatedStock} units</span>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Reason / Notes</label>
                <textarea
                  className="input h-16 py-2 resize-none"
                  value={adjustForm.notes}
                  onChange={e => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  placeholder="e.g. Restock from supplier / Damaged item..."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowAdjust(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleAdjust} disabled={saving || !adjustForm.quantity} className="btn btn-primary">
                {saving ? 'Saving...' : 'Apply Stock Adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className="toast">
            <CheckCircle size={16} className="text-[var(--success)] shrink-0" />
            <span className="text-xs font-medium">{toast}</span>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
