'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import { formatCurrency } from '@/lib/utils';
import { Download, FileText, BarChart3, Package, Smartphone, DollarSign } from 'lucide-react';

export default function ReportsPage() {
  const [dashData, setDashData] = useState<any>(null);
  const [rfData, setRfData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [d, r, p] = await Promise.all([
        fetch(`/api/dashboard?filter=all`).then(r => r.json()),
        fetch('/api/rf-devices').then(r => r.json()),
        fetch('/api/products?limit=200').then(r => r.json()),
      ]);
      setDashData(d);
      setRfData(r);
      setProducts(p.products || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const exportCSV = (filename: string, headers: string[], rows: any[][]) => {
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  };

  const exportSalesReport = () => {
    const rows = (dashData?.topProducts || []).map((p: any) => [
      p.product_code, `"${p.name}"`, p.category, p.total_sold, p.total_revenue, p.total_profit
    ]);
    exportCSV(`sales_report_${Date.now()}.csv`, ['Code', 'Product', 'Category', 'Qty Sold', 'Revenue', 'Profit'], rows);
  };

  const exportProductReport = () => {
    const rows = products.map((p: any) => [
      p.product_code, `"${p.name}"`, p.category, p.status, p.default_price, p.cost_price, p.current_stock || 0
    ]);
    exportCSV(`products_report_${Date.now()}.csv`, ['Code', 'Name', 'Category', 'Status', 'Price', 'HPP', 'Stock'], rows);
  };

  const stats = dashData?.stats || {};
  const topProducts = dashData?.topProducts || [];
  const rfDevices = rfData?.rfDevices || [];

  return (
    <DashboardLayout>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Executive Reports & Data Export</h1>
            <div className="page-subtitle">Generate business intelligence reports and export to CSV spreadsheets</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sales Report Card */}
          <div className="card p-5 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
                <BarChart3 size={18} className="text-[var(--accent)]" />
                <span>Sales Performance Summary</span>
              </div>
              <button onClick={exportSalesReport} className="btn btn-secondary btn-sm">
                <Download size={13} /> Export CSV
              </button>
            </div>
            {loading ? (
              <div className="skeleton h-32 w-full" />
            ) : (
              <div className="space-y-2 text-xs">
                <StatLine label="Total Sales Revenue" value={formatCurrency(stats.total_revenue)} />
                <StatLine label="Total Orders Processed" value={stats.total_transactions} />
                <StatLine label="Completed Deliveries" value={stats.completed_transactions} />
                <StatLine label="Total Net Profit Margin" value={formatCurrency(stats.net_profit)} highlight />
              </div>
            )}
          </div>

          {/* Top Products Report Card */}
          <div className="card p-5 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
                <FileText size={18} className="text-[var(--success)]" />
                <span>Top Revenue Products</span>
              </div>
              <button onClick={exportSalesReport} className="btn btn-secondary btn-sm">
                <Download size={13} /> Export CSV
              </button>
            </div>
            {loading ? (
              <div className="skeleton h-32 w-full" />
            ) : (
              <div className="space-y-2.5">
                {topProducts.filter((p: any) => p.total_sold > 0).slice(0, 4).map((p: any, i: number) => (
                  <div key={p.id} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-[var(--bg-secondary)]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--text-muted)] w-4">#{i + 1}</span>
                      <span className="font-semibold text-[var(--text-primary)]">{p.name}</span>
                    </div>
                    <span className="font-bold text-[var(--success)]">{formatCurrency(p.total_revenue)}</span>
                  </div>
                ))}
                {topProducts.filter((p: any) => p.total_sold > 0).length === 0 && (
                  <p className="text-xs text-[var(--text-muted)] py-4 text-center">No sales recorded yet</p>
                )}
              </div>
            )}
          </div>

          {/* Financial Breakdown Card */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)] pb-3 border-b border-[var(--border)]">
              <DollarSign size={18} className="text-[var(--warning)]" />
              <span>Full Financial Audit</span>
            </div>
            {loading ? (
              <div className="skeleton h-32 w-full" />
            ) : (
              <div className="space-y-2 text-xs">
                <StatLine label="Gross Revenue" value={formatCurrency(stats.total_revenue)} />
                <StatLine label="Total Snapshot HPP" value={formatCurrency(stats.total_hpp)} />
                <StatLine label="Gross Profit" value={formatCurrency(stats.gross_profit)} />
                <StatLine label="Total Expenses" value={formatCurrency(stats.total_expenses)} />
                <StatLine label="Net Operating Profit" value={formatCurrency(stats.net_profit)} highlight />
                <StatLine label="Inventory Asset Value" value={formatCurrency(stats.stock_value)} />
              </div>
            )}
          </div>

          {/* RF Devices Report Card */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)] pb-3 border-b border-[var(--border)]">
              <Smartphone size={18} className="text-[var(--accent)]" />
              <span>RedFinger Fleet Audit</span>
            </div>
            {loading ? (
              <div className="skeleton h-32 w-full" />
            ) : (
              <div className="space-y-2 text-xs">
                <StatLine label="Total Active Devices" value={rfDevices.length} />
                <StatLine label="Online Devices" value={rfDevices.filter((r: any) => r.status === 'Active').length} />
                <StatLine label="Total Roblox Accounts" value={rfDevices.reduce((s: number, r: any) => s + (r.account_count || 0), 0)} />
                <StatLine label="Total Monthly Fixed Cost" value={formatCurrency(rfData?.totalCost || 0)} highlight />
              </div>
            )}
          </div>

          {/* Full Catalog Export Card */}
          <div className="card p-5 col-span-1 md:col-span-2 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
                <Package size={18} className="text-[var(--accent)]" />
                <span>Master Product Catalog Audit</span>
              </div>
              <button onClick={exportProductReport} className="btn btn-secondary btn-sm">
                <Download size={13} /> Export Master CSV
              </button>
            </div>
            {loading ? (
              <div className="skeleton h-20 w-full" />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <StatBox label="Total Catalog Products" value={products.length} />
                <StatBox label="Active Products" value={products.filter(p => p.status === 'Active').length} color="var(--success)" />
                <StatBox label="Inactive Items" value={products.filter(p => p.status !== 'Active').length} color="var(--text-muted)" />
                <StatBox label="Active Categories" value={[...new Set(products.map(p => p.category))].length} color="var(--accent)" />
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatLine({ label, value, highlight }: { label: string, value: any, highlight?: boolean }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-[var(--success)] font-bold' : 'text-[var(--text-primary)]'}`}>{value}</span>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string, value: any, color?: string }) {
  return (
    <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
      <div className="text-2xl font-bold" style={{ color: color || 'var(--text-primary)' }}>{value}</div>
      <div className="text-xs text-[var(--text-muted)] mt-1">{label}</div>
    </div>
  );
}
