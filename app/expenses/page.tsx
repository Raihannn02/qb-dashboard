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
    const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo, category, page: String(page), limit: String(limit) });
    const res = await fetch(`/api/expenses?${params}`);
    if (res.ok) {
      const data = await res.json();
      setExpenses(data.expenses || []);
      setTotal(data.total || 0);
      setTotalAmount(data.summary || 0);
    }
    setLoading(false);
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
    if (res.ok) { showToast(editExp ? 'Updated!' : 'Expense added!'); setShowForm(false); fetchExpenses(); }
    else { showToast('Failed', 'error'); }
    setSaving(false);
  };

  const handleDelete = async (exp: any) => {
    if (!confirm(`Delete "${exp.description}"?`)) return;
    const res = await fetch(`/api/expenses?id=${exp.id}`, { method: 'DELETE' });
    if (res.ok) { showToast('Deleted'); fetchExpenses(); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Expenses</h1>
            <div className="page-subtitle">{total} records</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 16px', textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Expenses</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--danger)' }}>{formatCurrency(totalAmount)}</div>
            </div>
            <button onClick={openAdd} className="btn btn-primary"><Plus size={14} /> Add Expense</button>
          </div>
        </div>

        <div className="card" style={{ padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="input" style={{ width: 'auto' }}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <input type="date" className="input" style={{ width: 'auto' }} value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
          <input type="date" className="input" style={{ width: 'auto' }} value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th><th>Category</th><th>Description</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Notes</th><th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>)}</tr>
                )) : expenses.length === 0 ? (
                  <tr><td colSpan={6}>
                    <div className="empty-state">
                      <Receipt size={36} className="empty-state-icon" />
                      <h3>No Expenses Recorded</h3>
                      <p>Track your business expenses to see accurate profit reports.</p>
                      <button onClick={openAdd} className="btn btn-primary btn-sm"><Plus size={13} /> Add Expense</button>
                    </div>
                  </td></tr>
                ) : expenses.map(exp => (
                  <tr key={exp.id}>
                    <td className="muted" style={{ whiteSpace: 'nowrap' }}>{formatDate(exp.date)}</td>
                    <td><span className="badge badge-inactive">{exp.category}</span></td>
                    <td style={{ fontWeight: 500 }}>{exp.description}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(exp.amount)}</td>
                    <td className="muted" style={{ fontSize: 12 }}>{exp.notes || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button onClick={() => openEdit(exp)} className="btn btn-secondary btn-icon btn-sm"><Edit2 size={12} /></button>
                        <button onClick={() => handleDelete(exp)} className="btn btn-icon btn-sm btn-danger"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{total} records</span>
              <div className="pagination">
                <button className="page-btn" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}><ChevronLeft size={14} /></button>
                <span style={{ padding: '0 8px', fontSize: 12, color: 'var(--text-muted)' }}>Page {page}/{totalPages}</span>
                <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>{editExp ? 'Edit Expense' : 'Add Expense'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input type="date" className="input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Description *</label>
                <input className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="e.g. RedFinger August 2026" />
              </div>
              <div className="form-group">
                <label className="form-label">Amount (Rp) *</label>
                <input type="number" className="input" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} min="0" placeholder="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input className="input" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Optional" />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary"><Check size={14} /> {saving ? 'Saving...' : editExp ? 'Update' : 'Add Expense'}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast-container"><div className="toast"><div style={{ width: 8, height: 8, borderRadius: '50%', background: toast.type === 'error' ? 'var(--danger)' : 'var(--success)', flexShrink: 0, marginTop: 4 }} /><span style={{ fontSize: 13 }}>{toast.msg}</span></div></div>}
    </DashboardLayout>
  );
}
