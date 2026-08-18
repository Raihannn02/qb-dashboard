'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import { Users, Search, X, Plus, Check, Edit2, Trash2 } from 'lucide-react';

const ACCOUNT_STATUSES = ['Logged In', 'Belum Login', 'Problem', 'Maintenance'];
const STATUS_BADGE: Record<string, string> = {
  'Logged In': 'badge badge-logged-in', 'Belum Login': 'badge badge-belum-login',
  'Problem': 'badge badge-problem', 'Maintenance': 'badge badge-maintenance',
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
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, rf_id: rfFilter });
    const [accRes, rfRes] = await Promise.all([
      fetch(`/api/accounts?${params}`),
      fetch('/api/rf-devices'),
    ]);
    if (accRes.ok) { const d = await accRes.json(); setAccounts(d.accounts || []); }
    if (rfRes.ok) { const d = await rfRes.json(); setRfDevices(d.rfDevices || []); }
    setLoading(false);
  }, [search, rfFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Group accounts by RF
  const grouped = rfDevices.map(rf => ({
    rf,
    accounts: accounts.filter(a => a.rf_device_id === rf.id),
  })).filter(g => rfFilter ? g.rf.id === rfFilter : true);

  const handleAdd = async () => {
    if (!addForm.rf_device_id || !addForm.username) { showToast('RF device and username required'); return; }
    setSaving(true);
    const res = await fetch('/api/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addForm) });
    if (res.ok) { showToast('Account added!'); setShowAdd(false); setAddForm({ rf_device_id: '', username: '', status: 'Logged In', notes: '' }); fetchData(); }
    setSaving(false);
  };

  const handleEdit = async () => {
    if (!editAcc) return;
    const res = await fetch('/api/accounts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editAcc.id, status: editAcc.status, notes: editAcc.notes }) });
    if (res.ok) { showToast('Account updated!'); setEditAcc(null); fetchData(); }
  };

  const handleDelete = async (acc: any) => {
    if (!confirm(`Delete account "${acc.username}"?`)) return;
    await fetch(`/api/accounts?id=${acc.id}`, { method: 'DELETE' });
    showToast('Account deleted'); fetchData();
  };

  return (
    <DashboardLayout>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Roblox Accounts</h1>
            <div className="page-subtitle">{accounts.length} total accounts across {rfDevices.length} RF devices</div>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary"><Plus size={14} /> Add Account</button>
        </div>

        <div className="card" style={{ padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 180 }}>
            <Search size={14} color="var(--text-muted)" />
            <input placeholder="Search username..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={13} /></button>}
          </div>
          <select value={rfFilter} onChange={e => setRfFilter(e.target.value)} className="input" style={{ width: 'auto' }}>
            <option value="">All RF Devices</option>
            {rfDevices.map(rf => <option key={rf.id} value={rf.id}>{rf.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 12 }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {grouped.map(({ rf, accounts: rfAccounts }) => (
              <div key={rf.id} className="card" style={{ padding: '16px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{rf.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rfAccounts.length} accounts</div>
                  </div>
                  <span className={`badge ${rf.status === 'Active' ? 'badge-active' : rf.status === 'Offline' ? 'badge-out-of-stock' : 'badge-maintenance'}`}>
                    {rf.status}
                  </span>
                </div>

                {rfAccounts.length === 0 ? (
                  <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No accounts</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {rfAccounts.map(acc => (
                      <div key={acc.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '6px 8px', borderRadius: 6, transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <span style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{acc.username}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className={STATUS_BADGE[acc.status] || 'badge badge-inactive'} style={{ fontSize: 10 }}>{acc.status}</span>
                          <button onClick={() => setEditAcc({ ...acc })} className="btn btn-icon btn-sm btn-secondary" style={{ padding: '2px 4px' }}><Edit2 size={10} /></button>
                          <button onClick={() => handleDelete(acc)} className="btn btn-icon btn-sm" style={{ padding: '2px 4px', background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}><Trash2 size={10} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Add Roblox Account</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">RF Device *</label>
                <select className="input" value={addForm.rf_device_id} onChange={e => setAddForm({...addForm, rf_device_id: e.target.value})}>
                  <option value="">Select RF...</option>
                  {rfDevices.map(rf => <option key={rf.id} value={rf.id}>{rf.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Username *</label>
                <input className="input" value={addForm.username} onChange={e => setAddForm({...addForm, username: e.target.value})} placeholder="Roblox username" />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="input" value={addForm.status} onChange={e => setAddForm({...addForm, status: e.target.value})}>
                  {ACCOUNT_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input className="input" value={addForm.notes} onChange={e => setAddForm({...addForm, notes: e.target.value})} placeholder="Optional" />
              </div>
              <div style={{ background: 'var(--warning-bg)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--warning)' }}>
                ⚠ Jangan simpan password Roblox di sini. Hanya username.
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAdd(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleAdd} disabled={saving} className="btn btn-primary"><Check size={14} /> {saving ? 'Adding...' : 'Add Account'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editAcc && (
        <div className="modal-overlay" onClick={() => setEditAcc(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Edit: {editAcc.username}</h2>
              <button onClick={() => setEditAcc(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="input" value={editAcc.status} onChange={e => setEditAcc({...editAcc, status: e.target.value})}>
                  {ACCOUNT_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input className="input" value={editAcc.notes || ''} onChange={e => setEditAcc({...editAcc, notes: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setEditAcc(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleEdit} className="btn btn-primary"><Check size={14} /> Save</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast-container"><div className="toast"><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', flexShrink: 0, marginTop: 4 }} /><span style={{ fontSize: 13 }}>{toast}</span></div></div>}
    </DashboardLayout>
  );
}
