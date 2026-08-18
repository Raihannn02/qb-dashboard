'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Boxes, Search, X, ChevronLeft, ChevronRight, Plus, ArrowUpDown } from 'lucide-react';

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
  const limit = 20;

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
    if (!adjustForm.quantity) return;
    setSaving(true);
    try {
      const res = await fetch('/api/stock-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: showAdjust.id, ...adjustForm, quantity: parseInt(adjustForm.quantity) }),
      });
      if (res.ok) {
        showToastMsg(`Stock adjusted for ${showAdjust.name}`);
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
  const totalStockValue = inventory.reduce((sum, i) => sum + (i.stock_value || 0), 0);

  return (
    <DashboardLayout>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Inventory</h1>
            <div className="page-subtitle">Current stock levels — {total} products</div>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 16px', textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Stock Value</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(totalStockValue)}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
            <Search size={14} color="var(--text-muted)" />
            <input placeholder="Search product..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={13} /></button>}
          </div>
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="input" style={{ width: 'auto' }}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={stockStatus} onChange={e => { setStockStatus(e.target.value); setPage(1); }} className="input" style={{ width: 'auto' }}>
            <option value="">All Stock Status</option>
            {STOCK_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th><th>Product</th><th>Category</th>
                  <th style={{ textAlign: 'right' }}>Stock</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Stock Value</th>
                  <th>Status</th><th style={{ textAlign: 'center' }}>Adjust</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>)}</tr>
                )) : inventory.length === 0 ? (
                  <tr><td colSpan={8}>
                    <div className="empty-state">
                      <Boxes size={36} className="empty-state-icon" />
                      <h3>No Inventory Data</h3>
                      <p>Add products to see inventory here.</p>
                    </div>
                  </td></tr>
                ) : inventory.map(item => (
                  <tr key={item.id}>
                    <td className="muted" style={{ fontFamily: 'monospace', fontSize: 12 }}>{item.product_code}</td>
                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                    <td><span className="badge badge-inactive">{item.category}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: item.current_stock === 0 ? 'var(--danger)' : item.stock_status === 'Low Stock' ? 'var(--warning)' : 'var(--success)' }}>
                      {item.current_stock}
                    </td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.default_price)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.stock_value)}</td>
                    <td><span className={stockBadge(item.stock_status)}>{item.stock_status}</span></td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => { setShowAdjust(item); setAdjustForm({ type: 'Stock In', quantity: '', notes: '' }); }}
                        className="btn btn-secondary btn-icon btn-sm" title="Adjust Stock">
                        <ArrowUpDown size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
              <div className="pagination">
                <button className="page-btn" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}><ChevronLeft size={14} /></button>
                <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Adjust Modal */}
      {showAdjust && (
        <div className="modal-overlay" onClick={() => setShowAdjust(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Adjust Stock</h2>
              <button onClick={() => setShowAdjust(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontWeight: 600 }}>{showAdjust.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Current Stock: <strong style={{ color: 'var(--text-primary)' }}>{showAdjust.current_stock}</strong></div>
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="input" value={adjustForm.type} onChange={e => setAdjustForm({...adjustForm, type: e.target.value})}>
                  <option>Stock In</option><option>Stock Out</option><option>Adjustment</option><option>Return</option><option>Correction</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input className="input" type="number" value={adjustForm.quantity} onChange={e => setAdjustForm({...adjustForm, quantity: e.target.value})} min="0" placeholder="Enter quantity" />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="input" value={adjustForm.notes} onChange={e => setAdjustForm({...adjustForm, notes: e.target.value})} rows={2} placeholder="Optional reason..." />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAdjust(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleAdjust} disabled={saving || !adjustForm.quantity} className="btn btn-primary">
                {saving ? 'Saving...' : 'Apply Adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast-container"><div className="toast"><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', flexShrink: 0, marginTop: 4 }} /><span style={{ fontSize: 13 }}>{toast}</span></div></div>}
    </DashboardLayout>
  );
}
