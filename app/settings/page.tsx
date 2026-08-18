'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import { Settings, Check, X } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({ store_name: 'QB DASHBOARD', currency: 'IDR', low_stock_threshold: '5', theme: 'dark' });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      const s = data.settings || {};
      setSettings(s);
      setForm({
        store_name: s.store_name || 'QB DASHBOARD',
        currency: s.currency || 'IDR',
        low_stock_threshold: s.low_stock_threshold || '5',
        theme: s.theme || 'dark',
      });
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) { showToast('Settings saved!'); }
    setSaving(false);
  };

  return (
    <DashboardLayout>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Settings</h1>
            <div className="page-subtitle">System configuration and preferences</div>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            <Check size={14} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 800 }}>
          {/* Business Settings */}
          <div className="card" style={{ padding: '20px', gridColumn: '1/-1' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Settings size={15} color="var(--accent)" />
              Business Settings
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Store Name</label>
                {loading ? <div className="skeleton" style={{ height: 36, borderRadius: 8 }} /> : (
                  <input className="input" value={form.store_name} onChange={e => setForm({...form, store_name: e.target.value})} />
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                {loading ? <div className="skeleton" style={{ height: 36, borderRadius: 8 }} /> : (
                  <select className="input" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
                    <option value="IDR">IDR (Rupiah)</option>
                    <option value="USD">USD (Dollar)</option>
                  </select>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Low Stock Threshold</label>
                {loading ? <div className="skeleton" style={{ height: 36, borderRadius: 8 }} /> : (
                  <input type="number" className="input" value={form.low_stock_threshold} min="0"
                    onChange={e => setForm({...form, low_stock_threshold: e.target.value})} />
                )}
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Products with stock ≤ this value will be marked as Low Stock</span>
              </div>
              <div className="form-group">
                <label className="form-label">Appearance</label>
                {loading ? <div className="skeleton" style={{ height: 36, borderRadius: 8 }} /> : (
                  <select className="input" value={form.theme} onChange={e => setForm({...form, theme: e.target.value})}>
                    <option value="dark">Dark Mode</option>
                    <option value="light">Light Mode</option>
                    <option value="system">System</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* About */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>About QB DASHBOARD</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Version</span>
                <span style={{ fontWeight: 600 }}>1.0.0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Database</span>
                <span style={{ fontWeight: 600 }}>SQLite (Local)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Framework</span>
                <span style={{ fontWeight: 600 }}>Next.js 15</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Game</span>
                <span style={{ fontWeight: 600 }}>Roblox Grow a Garden 2</span>
              </div>
            </div>
          </div>

          {/* Data Info */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Data Storage</div>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '12px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              📁 Data disimpan di: <strong style={{ color: 'var(--text-primary)', display: 'block', marginTop: 4, fontFamily: 'monospace', fontSize: 11 }}>
                /data/qb-dashboard.db
              </strong>
              <br />
              Data tersimpan permanen dan tidak hilang saat browser di-refresh.
              Backup file .db secara berkala untuk keamanan data.
            </div>
          </div>
        </div>
      </div>

      {toast && <div className="toast-container"><div className="toast"><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', flexShrink: 0, marginTop: 4 }} /><span style={{ fontSize: 13 }}>{toast}</span></div></div>}
    </DashboardLayout>
  );
}
