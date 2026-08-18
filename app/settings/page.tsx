'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import { Settings, Check, HardDrive, Cpu, ShieldCheck } from 'lucide-react';

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
    if (res.ok) { showToast('System preferences saved'); }
    setSaving(false);
  };

  return (
    <DashboardLayout>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">System Settings & Preferences</h1>
            <div className="page-subtitle">Configure business branding, thresholds, and infrastructure</div>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            <Check size={16} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
          {/* Business Settings */}
          <div className="card p-5 lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 font-bold text-base text-[var(--text-primary)] pb-3 border-b border-[var(--border)]">
              <Settings size={18} className="text-[var(--accent)]" />
              <span>General Platform Settings</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Store / Platform Title</label>
                {loading ? <div className="skeleton h-10 w-full" /> : (
                  <input
                    className="input"
                    value={form.store_name}
                    onChange={e => setForm({ ...form, store_name: e.target.value })}
                  />
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Default Display Currency</label>
                {loading ? <div className="skeleton h-10 w-full" /> : (
                  <select
                    className="input"
                    value={form.currency}
                    onChange={e => setForm({ ...form, currency: e.target.value })}
                  >
                    <option value="IDR">IDR (Indonesian Rupiah - Rp)</option>
                    <option value="USD">USD (US Dollar - $)</option>
                  </select>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Low Stock Inventory Threshold</label>
                {loading ? <div className="skeleton h-10 w-full" /> : (
                  <input
                    type="number"
                    className="input"
                    value={form.low_stock_threshold}
                    min="0"
                    onChange={e => setForm({ ...form, low_stock_threshold: e.target.value })}
                  />
                )}
                <span className="text-[11px] text-[var(--text-muted)]">Items with stock ≤ this value will trigger Low Stock alerts</span>
              </div>

              <div className="form-group">
                <label className="form-label">Visual Theme</label>
                {loading ? <div className="skeleton h-10 w-full" /> : (
                  <select
                    className="input"
                    value={form.theme}
                    onChange={e => setForm({ ...form, theme: e.target.value })}
                  >
                    <option value="dark">SaaS Dark Theme (Default)</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* About Platform */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)] pb-2 border-b border-[var(--border)]">
              <Cpu size={16} className="text-[var(--accent)]" />
              <span>Platform Specifications</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Application Version</span>
                <span className="font-mono font-bold text-[var(--accent)]">v2.4.0 SaaS Premium</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Framework</span>
                <span className="font-semibold text-[var(--text-primary)]">Next.js 15 (App Router)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Database Infrastructure</span>
                <span className="font-semibold text-[var(--success)]">Supabase PostgreSQL</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[var(--text-muted)]">Target Ecosystem</span>
                <span className="font-semibold text-[var(--text-primary)]">Roblox Grow a Garden 2</span>
              </div>
            </div>
          </div>

          {/* Infrastructure Security */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)] pb-2 border-b border-[var(--border)]">
              <HardDrive size={16} className="text-[var(--success)]" />
              <span>Database Sync Status</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-[var(--success)]">
                <ShieldCheck size={16} />
                <span>Supabase Live Sync Connected</span>
              </div>
              <p className="text-[var(--text-muted)] text-[11px] leading-relaxed">
                All business data, stock levels, orders, and RF device mappings are securely backed up in the cloud with automated snapshots.
              </p>
            </div>
          </div>
        </div>
      </div>

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
