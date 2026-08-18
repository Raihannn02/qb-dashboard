'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Receipt, Plus, Edit2, Trash2, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';

const CATEGORIES = ['RedFinger', 'Internet', 'Electricity', 'Software', 'Marketplace Fee', 'Operational', 'Other'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [category, setCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editExp, setEditExp] = useState<any>(null);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], category: 'Operational', description: '', amount: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type?: string } | null>(null);
  const limit = 20;

  const showToast = (msg: string, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo, category, page: String(page), limit: String(limit) });
      const res = await fetch(`/api/expenses?${params}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
        setTotal(data.total || 0);
        setTotalAmount(data.summary || 0);
      }
    } finally { setLoading(false); }
  }, [dateFrom, dateTo, category, page]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const openAdd = () => {
    setEditExp(null);
    setForm({ date: new Date().toISOString().split('T')[0], category: 'Operational', description: '', amount: '', notes: '' });
    setShowForm(true);
  };
  const openEdit = (e: any) => {
    setEditExp(e);
    setForm({ date: e.date, category: e.category, description: e.description, amount: String(e.amount), notes: e.notes || '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.description || !form.amount) { showToast('Description and amount required', 'error'); return; }
    setSaving(true);
    const method = editExp ? 'PUT' : 'POST';
    const body = editExp ? { id: editExp.id, ...form, amount: parseFloat(form.amount) } : { ...form, amount: parseFloat(form.amount) };
    const res = await fetch('/api/expenses', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { showToast(editExp ? 'Updated expense record' : 'Expense recorded successfully'); setShowForm(false); fetchExpenses(); }
    else { showToast('Failed to save expense', 'error'); }
    setSaving(false);
  };

  const handleDelete = async (exp: any) => {
    if (!confirm(`Delete expense "${exp.description}"?`)) return;
    const res = await fetch(`/api/expenses?id=${exp.id}`, { method: 'DELETE' });
    if (res.ok) { showToast('Expense deleted'); fetchExpenses(); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      <div className="page-content">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Operational Expenses</h1>
            <div className="page-subtitle">Track overhead costs, subscriptions, and RedFinger billing</div>
          </div>
          <button onClick={openAdd} className="btn btn-primary">
            <Plus size={16} /> Record Expense
          </button>
        </div>

        {/* Metric Card */}
        <div className="stats-grid mb-6">
          <div className="stat-card">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Total Expenses (Current View)</span>
              <Receipt size={16} className="text-[var(--danger)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--danger)]">{formatCurrency(totalAmount)}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">{total} recorded expense items</div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-3 mb-4 flex gap-3 flex-wrap items-center">
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
            className="input w-auto h-9 text-xs"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
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

        {/* Table Container */}
        <div className="data-table-container">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th className="text-right">Amount</th>
                  <th>Notes</th>
                  <th className="text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j}><div className="skeleton h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state py-12">
                        <Receipt size={40} className="empty-state-icon" />
                        <h3 className="font-bold text-sm">No Expense Records</h3>
                        <p className="text-xs text-[var(--text-muted)]">Track operational costs to accurately see net profit.</p>
                        <button onClick={openAdd} className="btn btn-primary btn-sm mt-2">
                          <Plus size={14} /> Record Expense
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  expenses.map(exp => (
                    <tr key={exp.id}>
                      <td className="text-xs text-[var(--text-muted)] whitespace-nowrap">{formatDate(exp.date)}</td>
                      <td><span className="badge badge-inactive">{exp.category}</span></td>
                      <td className="font-semibold text-[var(--text-primary)]">{exp.description}</td>
                      <td className="text-right font-bold text-[var(--danger)]">{formatCurrency(exp.amount)}</td>
                      <td className="text-xs text-[var(--text-muted)]">{exp.notes || '—'}</td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(exp)} className="btn btn-secondary btn-icon btn-sm">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDelete(exp)} className="btn btn-danger btn-icon btn-sm">
                            <Trash2 size={13} />
                          </button>
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
      </div>

      {/* Add / Edit Expense Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                {editExp ? 'Edit Expense Record' : 'Record Operational Expense'}
              </h2>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-icon">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">Expense Date *</label>
                  <input
                    type="date"
                    className="input"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
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
                <div className="col-span-2 form-group">
                  <label className="form-label">Description *</label>
                  <input
                    className="input"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="e.g. RedFinger Monthly Subscription August"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (Rp) *</label>
                  <input
                    type="number"
                    className="input"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input
                    className="input"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Optional details..."
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                <Check size={16} /> {saving ? 'Saving...' : editExp ? 'Update Record' : 'Save Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
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
