'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import { formatCurrency } from '@/lib/utils';
import { Monitor, Edit2, Plus, X, Check, Wifi, WifiOff, Wrench, Smartphone, Users } from 'lucide-react';

const RF_STATUS_COLOR: Record<string, string> = {
  Active: 'var(--success)', Offline: 'var(--danger)', Maintenance: 'var(--warning)'
};

export default function RFDevicesPage() {
  const [rfDevices, setRfDevices] = useState<any[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editDevice, setEditDevice] = useState<any>(null);
  const [editForm, setEditForm] = useState({ monthly_cost: '', status: 'Active', notes: '' });
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', monthly_cost: '57000', status: 'Active', notes: '' });
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchRF = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rf-devices');
      if (res.ok) {
        const data = await res.json();
        setRfDevices(data.rfDevices || []);
        setTotalCost(data.totalCost || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRF(); }, []);

  const openEdit = (rf: any) => {
    setEditDevice(rf);
    setEditForm({ monthly_cost: String(rf.monthly_cost), status: rf.status, notes: rf.notes || '' });
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    const res = await fetch('/api/rf-devices', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editDevice.id, monthly_cost: parseFloat(editForm.monthly_cost), status: editForm.status, notes: editForm.notes }),
    });
    if (res.ok) { showToast(`${editDevice.name} updated successfully`); setEditDevice(null); fetchRF(); }
    setSaving(false);
  };

  const handleAddRF = async () => {
    setSaving(true);
    const res = await fetch('/api/rf-devices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...addForm, monthly_cost: parseFloat(addForm.monthly_cost) }),
    });
    if (res.ok) { showToast('RF Device added successfully'); setShowAdd(false); fetchRF(); }
    setSaving(false);
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'Active') return <Wifi size={13} className="text-[var(--success)]" />;
    if (status === 'Offline') return <WifiOff size={13} className="text-[var(--danger)]" />;
    return <Wrench size={13} className="text-[var(--warning)]" />;
  };

  const totalAccounts = rfDevices.reduce((s, r) => s + (r.account_count || 0), 0);
  const activeDevices = rfDevices.filter(r => r.status === 'Active').length;

  return (
    <DashboardLayout>
      <div className="page-content">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">RedFinger Devices</h1>
            <div className="page-subtitle">Manage cloud gaming devices and monthly operational costs</div>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary">
            <Plus size={16} /> Add Device
          </button>
        </div>

        {/* Metric Summary Grid */}
        <div className="stats-grid mb-6">
          <div className="stat-card">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Total RF Devices</span>
              <Smartphone size={16} className="text-[var(--accent)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{rfDevices.length}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">{activeDevices} active online</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Roblox Accounts</span>
              <Users size={16} className="text-[var(--success)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--success)]">{totalAccounts}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">Mapped across devices</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
              <span>Total Monthly Cost</span>
              <Monitor size={16} className="text-[var(--warning)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--warning)]">{formatCurrency(totalCost)}</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">Fixed monthly overhead</div>
          </div>
        </div>

        {/* Device Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="skeleton h-44 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {rfDevices.map(rf => (
              <div
                key={rf.id}
                className="card p-4 relative overflow-hidden flex flex-col justify-between hover:border-[var(--accent)] transition-all"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ background: RF_STATUS_COLOR[rf.status] || 'var(--border)' }}
                />

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
                      <Monitor size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[var(--text-primary)]">{rf.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">Device #{rf.device_number}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => openEdit(rf)}
                    className="btn btn-ghost btn-icon btn-sm text-[var(--text-muted)] hover:text-white"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Status</span>
                    <span className="flex items-center gap-1 font-semibold" style={{ color: RF_STATUS_COLOR[rf.status] }}>
                      <StatusIcon status={rf.status} /> {rf.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Mapped Accounts</span>
                    <span className="font-bold text-[var(--text-primary)]">{rf.account_count || 0}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Cost / Mo</span>
                    <span className="font-bold text-[var(--warning)]">{formatCurrency(rf.monthly_cost)}</span>
                  </div>
                </div>

                {rf.notes && (
                  <div className="mt-3 pt-2 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)] truncate">
                    {rf.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit RF Device Modal */}
      {editDevice && (
        <div className="modal-overlay" onClick={() => setEditDevice(null)}>
          <div className="modal max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-base font-bold text-[var(--text-primary)]">Edit {editDevice.name}</h2>
              <button onClick={() => setEditDevice(null)} className="btn btn-ghost btn-icon">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div className="form-group">
                <label className="form-label">Monthly Cost (Rp)</label>
                <input
                  className="input"
                  type="number"
                  value={editForm.monthly_cost}
                  onChange={e => setEditForm({ ...editForm, monthly_cost: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="input"
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Offline">Offline</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="input h-16 py-2 resize-none"
                  value={editForm.notes}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setEditDevice(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSaveEdit} disabled={saving} className="btn btn-primary">
                <Check size={16} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add RF Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-base font-bold text-[var(--text-primary)]">Add RedFinger Device</h2>
              <button onClick={() => setShowAdd(false)} className="btn btn-ghost btn-icon">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div className="form-group">
                <label className="form-label">Device Name (e.g. RF11)</label>
                <input
                  className="input"
                  value={addForm.name}
                  onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="Auto-generated if blank"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Monthly Cost (Rp)</label>
                <input
                  className="input"
                  type="number"
                  value={addForm.monthly_cost}
                  onChange={e => setAddForm({ ...addForm, monthly_cost: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="input"
                  value={addForm.status}
                  onChange={e => setAddForm({ ...addForm, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Offline">Offline</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAdd(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleAddRF} disabled={saving} className="btn btn-primary">
                <Check size={16} /> {saving ? 'Adding...' : 'Add Device'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className="toast">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--success)]" />
            <span className="text-xs font-medium">{toast}</span>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
