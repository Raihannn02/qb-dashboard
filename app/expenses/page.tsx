'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import ActionMenu from '@/components/ui/ActionMenu';
import DeleteModal from '@/components/ui/DeleteModal';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Receipt, Plus, Edit2, Trash2, Check, X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

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
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/expenses?id=${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Expense "${deleteTarget.description}" (${formatCurrency(deleteTarget.amount)}) removed`);
        setDeleteTarget(null);
        fetchExpenses();
      } else {
        showToast('Failed to delete expense', 'error');
      }
    } finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / limit);

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
            <h1 className="page-title">Operational Expenses</h1>
            <div className="page-subtitle">Track overhead costs, subscriptions, and RedFinger billing</div>
          </div>
          <button onClick={openAdd} className="btn btn-primary">
            <Plus size={16} /> Record Expense
          </button>
        </div>

        {/* Metric Card */}
        <div className="stats-grid">
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
        <div className="card p-3 flex gap-3 flex-wrap items-center">
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
                  <th className="text-center w-16">Actions</th>
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
                      <EmptyState
                        icon={Receipt}
                        title="No Expense Records"
                        description="Track operational costs to accurately see net profit."
                        actionLabel="+ Record Expense"
                        onAction={openAdd}
                      />
                    </td>
                  </tr>
                ) : (
                  expenses.map((e) => (
                    <tr key={e.id}>
                      <td className="font-mono text-xs text-[var(--text-muted)]">{formatDate(e.date)}</td>
                      <td><span className="badge badge-inactive">{e.category}</span></td>
                      <td className="font-semibold text-[var(--text-primary)]">{e.description}</td>
                      <td className="text-right font-bold text-[var(--danger)]">{formatCurrency(e.amount)}</td>
                      <td className="text-xs text-[var(--text-muted)] max-w-xs truncate">{e.notes || '-'}</td>
                      <td className="text-center">
                        <ActionMenu
                          items={[
                            { label: 'Edit Record', icon: Edit2, onClick: () => openEdit(e) },
                            { label: 'Delete Expense', icon: Trash2, variant: 'danger', onClick: () => setDeleteTarget(e) },
                          ]}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-[var(--border)] text-xs">
              <span className="text-[var(--text-muted)]">Showing page {page} of {totalPages}</span>
              <div className="flex gap-1">
                <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn btn-secondary btn-sm">
                  <ChevronLeft size={14} /> Previous
                </button>
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn btn-secondary btn-sm">
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
            title="Delete Expense Record"
            itemName={`${deleteTarget.description} (${formatCurrency(deleteTarget.amount)})`}
            itemType="expense"
            isDeleting={deleting}
          />
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3 className="font-bold text-base text-[var(--text-primary)]">{editExp ? 'Edit Expense' : 'Record Expense'}</h3>
                <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-icon"><X size={16} /></button>
              </div>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <input className="input" placeholder="e.g. RedFinger Monthly Server 1" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Amount (Rp) *</label>
                  <input type="number" className="input" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input className="input" placeholder="Optional notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowForm(false)} className="btn btn-secondary text-xs">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn btn-primary text-xs">{saving ? 'Saving...' : 'Save Expense'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
