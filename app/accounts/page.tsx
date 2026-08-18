'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import ActionMenu from '@/components/ui/ActionMenu';
import DeleteModal from '@/components/ui/DeleteModal';
import EmptyState from '@/components/ui/EmptyState';
import { Users, Search, X, Plus, Check, Edit2, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';

const ACCOUNT_STATUSES = ['Logged In', 'Belum Login', 'Problem', 'Maintenance'];
const STATUS_BADGE: Record<string, string> = {
  'Logged In': 'badge badge-logged-in',
  'Belum Login': 'badge badge-belum-login',
  'Problem': 'badge badge-problem',
  'Maintenance': 'badge badge-maintenance',
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [rfDevices, setRfDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rfFilter, setRfFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ rf_device_id: '', username: '', status: 'Logged In', notes: '' });
  const [editAcc, setEditAcc] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, rf_id: rfFilter });
      const [accRes, rfRes] = await Promise.all([
        fetch(`/api/accounts?${params}`),
        fetch('/api/rf-devices'),
      ]);
      if (accRes.ok) { const d = await accRes.json(); setAccounts(d.accounts || []); }
      if (rfRes.ok) { const d = await rfRes.json(); setRfDevices(d.rfDevices || []); }
    } finally {
      setLoading(false);
    }
  }, [search, rfFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Group accounts by RF device
  const grouped = rfDevices.map(rf => ({
    rf,
    accounts: accounts.filter(a => a.rf_device_id === rf.id),
  })).filter(g => rfFilter ? g.rf.id === rfFilter : true);

  const handleAdd = async () => {
    if (!addForm.rf_device_id || !addForm.username) { showToast('RF device and username required'); return; }
    setSaving(true);
    const res = await fetch('/api/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addForm) });
    if (res.ok) { showToast('Account added successfully'); setShowAdd(false); setAddForm({ rf_device_id: '', username: '', status: 'Logged In', notes: '' }); fetchData(); }
    setSaving(false);
  };

  const handleEdit = async () => {
    if (!editAcc) return;
    const res = await fetch('/api/accounts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editAcc.id, status: editAcc.status, notes: editAcc.notes }) });
    if (res.ok) { showToast('Account updated successfully'); setEditAcc(null); fetchData(); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/accounts?id=${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Account "${deleteTarget.username}" deleted successfully`);
        setDeleteTarget(null);
        fetchData();
      }
    } finally { setDeleting(false); }
  };

  return (
    <DashboardLayout>
      <div className="page-content space-y-6">
        {/* Toast */}
        {toast && (
          <div className="toast-container">
            <div className="toast border-[var(--success)]">
              <Check size={16} className="text-[var(--success)]" />
              <span className="text-xs font-semibold">{toast}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Roblox Accounts</h1>
            <div className="page-subtitle">{accounts.length} total accounts mapped across {rfDevices.length} RedFinger devices</div>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary">
            <Plus size={16} /> Add Account
          </button>
        </div>

        {/* Device Quick Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
          <button
            onClick={() => setRfFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
              rfFilter === ''
                ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            All Devices ({rfDevices.length})
          </button>
          {rfDevices.map(rf => (
            <button
              key={rf.id}
              onClick={() => setRfFilter(rf.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                rfFilter === rf.id
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                  : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              {rf.name} ({rf.account_count || 0})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="card p-4 mb-6 flex gap-4 items-center">
          <div className="search-bar flex-1">
            <Search size={15} className="text-[var(--text-muted)]" />
            <input
              placeholder="Search by Roblox username..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-[var(--text-muted)] hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Grouped Account Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-56 w-full" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Roblox Accounts Found"
            description="Add your Roblox farming accounts to link them to RedFinger cloud devices."
            actionLabel="+ Add Account"
            onAction={() => setShowAdd(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {grouped.map(({ rf, accounts: rfAccounts }) => (
              <div key={rf.id} className="card p-5 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
                  <div>
                    <h3 className="font-bold text-sm text-[var(--text-primary)]">{rf.name}</h3>
                    <span className="text-[10px] text-[var(--text-muted)]">{rfAccounts.length} accounts mapped</span>
                  </div>
                  <span className={rf.status === 'Active' ? 'badge badge-active' : 'badge badge-inactive'}>
                    {rf.status}
                  </span>
                </div>

                {rfAccounts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                    No Roblox accounts mapped to this device
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {rfAccounts.map(acc => (
                      <div
                        key={acc.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-xs"
                      >
                        <div className="font-medium text-[var(--text-primary)] truncate max-w-[140px]">
                          {acc.username}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={STATUS_BADGE[acc.status] || 'badge badge-inactive'}>
                            {acc.status}
                          </span>
                          <ActionMenu
                            items={[
                              { label: 'Edit Account', icon: Edit2, onClick: () => setEditAcc(acc) },
                              { label: 'Delete Account', icon: Trash2, variant: 'danger', onClick: () => setDeleteTarget(acc) },
                            ]}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <DeleteModal
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirmDelete={handleDelete}
            title="Delete Roblox Account"
            itemName={deleteTarget.username}
            itemType="account"
            isDeleting={deleting}
          />
        )}

        {/* Edit Modal */}
        {editAcc && (
          <div className="modal-overlay" onClick={() => setEditAcc(null)}>
            <div className="modal max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="font-bold text-base text-[var(--text-primary)]">Edit @{editAcc.username}</h3>
                <button onClick={() => setEditAcc(null)} className="btn btn-ghost btn-icon"><X size={16} /></button>
              </div>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label className="form-label">Account Status</label>
                  <select
                    className="input"
                    value={editAcc.status}
                    onChange={e => setEditAcc({ ...editAcc, status: e.target.value })}
                  >
                    {ACCOUNT_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input
                    className="input"
                    placeholder="Optional notes"
                    value={editAcc.notes || ''}
                    onChange={e => setEditAcc({ ...editAcc, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setEditAcc(null)} className="btn btn-secondary text-xs">Cancel</button>
                <button onClick={handleEdit} className="btn btn-primary text-xs">Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {showAdd && (
          <div className="modal-overlay" onClick={() => setShowAdd(false)}>
            <div className="modal max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="font-bold text-base text-[var(--text-primary)]">Add Roblox Account</h3>
                <button onClick={() => setShowAdd(false)} className="btn btn-ghost btn-icon"><X size={16} /></button>
              </div>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label className="form-label">RedFinger Device *</label>
                  <select
                    className="input"
                    value={addForm.rf_device_id}
                    onChange={e => setAddForm({ ...addForm, rf_device_id: e.target.value })}
                  >
                    <option value="">Select RF Device...</option>
                    {rfDevices.map(rf => <option key={rf.id} value={rf.id}>{rf.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Roblox Username *</label>
                  <input
                    className="input"
                    placeholder="e.g. FarmerJohn_99"
                    value={addForm.username}
                    onChange={e => setAddForm({ ...addForm, username: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Status</label>
                  <select
                    className="input"
                    value={addForm.status}
                    onChange={e => setAddForm({ ...addForm, status: e.target.value })}
                  >
                    {ACCOUNT_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setShowAdd(false)} className="btn btn-secondary text-xs">Cancel</button>
                <button onClick={handleAdd} disabled={saving} className="btn btn-primary text-xs">
                  {saving ? 'Adding...' : 'Add Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
