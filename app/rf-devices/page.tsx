'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import { formatCurrency } from '@/lib/utils';
import { Monitor, Edit2, Plus, X, Check, Wifi, WifiOff, Wrench } from 'lucide-react';

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
    const res = await fetch('/api/rf-devices');
    if (res.ok) {
      const data = await res.json();
      setRfDevices(data.rfDevices || []);
      setTotalCost(data.totalCost || 0);
    }
    setLoading(false);
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
    if (res.ok) { showToast(`${editDevice.name} updated!`); setEditDevice(null); fetchRF(); }
    setSaving(false);
  };

  const handleAddRF = async () => {
    setSaving(true);
    const res = await fetch('/api/rf-devices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...addForm, monthly_cost: parseFloat(addForm.monthly_cost) }),
    });
    if (res.ok) { showToast('RF Device added!'); setShowAdd(false); fetchRF(); }
    setSaving(false);
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'Active') return <Wifi size={12} color="var(--success)" />;
    if (status === 'Offline') return <WifiOff size={12} color="var(--danger)" />;
    return <Wrench size={12} color="var(--warning)" />;
  };

  return (
    <DashboardLayout>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">RF Devices</h1>
            <div className="page-subtitle">RedFinger device management</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 16px', textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Monthly Cost</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--warning)' }}>{formatCurrency(totalCost)}</div>
            </div>
            <button onClick={() => setShowAdd(true)} className="btn btn-primary"><Plus size={14} /> Add RF</button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 12 }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
            {rfDevices.map(rf => (
              <div key={rf.id} className="card" style={{ padding: '18px', position: 'relative', overflow: 'hidden' }}>
                {/* Status accent bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: RF_STATUS_COLOR[rf.status] || 'var(--border)' }} />
                
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Monitor size={16} color="var(--accent)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{rf.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Device #{rf.device_number}</div>
                    </div>
                  </div>
                  <button onClick={() => openEdit(rf)} className="btn btn-secondary btn-icon btn-sm"><Edit2 size={11} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StatusIcon status={rf.status} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: RF_STATUS_COLOR[rf.status] }}>{rf.status}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Accounts</span>
                    <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{rf.account_count || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Monthly Cost</span>
                    <span style={{ fontWeight: 700, color: 'var(--warning)', fontSize: 13 }}>{formatCurrency(rf.monthly_cost)}</span>
                  </div>
                </div>
                {rf.notes && <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 8 }}>{rf.notes}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && rfDevices.length > 0 && (
          <div className="card" style={{ padding: '16px 20px', marginTop: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Devices</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{rfDevices.length}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Active</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--success)' }}>{rfDevices.filter(r => r.status === 'Active').length}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Accounts</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{rfDevices.reduce((s, r) => s + (r.account_count || 0), 0)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Monthly Cost</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--warning)' }}>{formatCurrency(totalCost)}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editDevice && (
        <div className="modal-overlay" onClick={() => setEditDevice(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Edit {editDevice.name}</h2>
              <button onClick={() => setEditDevice(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Monthly Cost (Rp)</label>
                <input className="input" type="number" value={editForm.monthly_cost} onChange={e => setEditForm({...editForm, monthly_cost: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="input" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                  <option>Active</option><option>Offline</option><option>Maintenance</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="input" value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} rows={2} />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setEditDevice(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSaveEdit} disabled={saving} className="btn btn-primary"><Check size={14} /> {saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add RF Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Add RF Device</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Name (optional, auto-generated)</label>
                <input className="input" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} placeholder="e.g. RF11" />
              </div>
              <div className="form-group">
                <label className="form-label">Monthly Cost (Rp)</label>
                <input className="input" type="number" value={addForm.monthly_cost} onChange={e => setAddForm({...addForm, monthly_cost: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="input" value={addForm.status} onChange={e => setAddForm({...addForm, status: e.target.value})}>
                  <option>Active</option><option>Offline</option><option>Maintenance</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowAdd(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleAddRF} disabled={saving} className="btn btn-primary"><Check size={14} /> {saving ? 'Adding...' : 'Add RF Device'}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast-container"><div className="toast"><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', flexShrink: 0, marginTop: 4 }} /><span style={{ fontSize: 13 }}>{toast}</span></div></div>}
    </DashboardLayout>
  );
}
