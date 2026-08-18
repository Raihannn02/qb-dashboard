'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils';
import { BarChart3, Download } from 'lucide-react';

export default function ReportsPage() {
  const [dashData, setDashData] = useState<any>(null);
  const [rfData, setRfData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    const [d, r, p] = await Promise.all([
      fetch(`/api/dashboard?filter=all`).then(r => r.json()),
      fetch('/api/rf-devices').then(r => r.json()),
      fetch('/api/products?limit=200').then(r => r.json()),
    ]);
    setDashData(d);
    setRfData(r);
    setProducts(p.products || []);
    setLoading(false);
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
      p.product_code, p.name, p.category, p.total_sold, p.total_revenue, p.total_profit
    ]);
    exportCSV(`sales_report_${Date.now()}.csv`, ['Code', 'Product', 'Category', 'Qty Sold', 'Revenue', 'Profit'], rows);
  };

  const exportProductReport = () => {
    const rows = products.map((p: any) => [
      p.product_code, p.name, p.category, p.status, p.default_price, p.cost_price, p.current_stock || 0
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
            <h1 className="page-title">Reports</h1>
            <div className="page-subtitle">Business analytics and export</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Sales Report */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>📊 Sales Report</div>
              <button onClick={exportSalesReport} className="btn btn-secondary btn-sm"><Download size={12} /> CSV</button>
            </div>
            {loading ? <div className="skeleton" style={{ height: 120, borderRadius: 8 }} /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <StatLine label="Total Revenue" value={formatCurrency(stats.total_revenue)} />
                <StatLine label="Total Transactions" value={stats.total_transactions} />
                <StatLine label="Completed" value={stats.completed_transactions} />
                <StatLine label="Total Profit" value={formatCurrency(stats.net_profit)} highlight />
              </div>
            )}
          </div>

          {/* Top Products */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>🏆 Top Products</div>
              <button onClick={exportSalesReport} className="btn btn-secondary btn-sm"><Download size={12} /> CSV</button>
            </div>
            {loading ? <div className="skeleton" style={{ height: 160, borderRadius: 8 }} /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {topProducts.filter((p: any) => p.total_sold > 0).slice(0, 5).map((p: any, i: number) => (
                  <div key={p.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ width: 20, fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>#{i+1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sold: {p.total_sold} units</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(p.total_revenue)}</div>
                  </div>
                ))}
                {topProducts.filter((p: any) => p.total_sold > 0).length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No sales data yet</p>
                )}
              </div>
            )}
          </div>

          {/* Financial Report */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>💰 Financial Report</div>
            {loading ? <div className="skeleton" style={{ height: 120, borderRadius: 8 }} /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <StatLine label="Revenue" value={formatCurrency(stats.total_revenue)} />
                <StatLine label="HPP" value={formatCurrency(stats.total_hpp)} />
                <StatLine label="Gross Profit" value={formatCurrency(stats.gross_profit)} />
                <StatLine label="Total Expenses" value={formatCurrency(stats.total_expenses)} />
                <StatLine label="Net Profit" value={formatCurrency(stats.net_profit)} highlight />
                <StatLine label="Stock Value" value={formatCurrency(stats.stock_value)} />
              </div>
            )}
          </div>

          {/* RF Report */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>📱 RF Device Report</div>
            {loading ? <div className="skeleton" style={{ height: 120, borderRadius: 8 }} /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <StatLine label="Total RF Devices" value={rfDevices.length} />
                <StatLine label="Active" value={rfDevices.filter((r: any) => r.status === 'Active').length} />
                <StatLine label="Total Accounts" value={rfDevices.reduce((s: number, r: any) => s + (r.account_count || 0), 0)} />
                <StatLine label="Total Monthly Cost" value={formatCurrency(rfData?.totalCost || 0)} highlight />
              </div>
            )}
          </div>

          {/* Product Report */}
          <div className="card" style={{ padding: '20px', gridColumn: '1/-1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>📦 Product Report</div>
              <button onClick={exportProductReport} className="btn btn-secondary btn-sm"><Download size={12} /> Export CSV</button>
            </div>
            {loading ? <div className="skeleton" style={{ height: 80, borderRadius: 8 }} /> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <StatBox label="Total Products" value={products.length} />
                <StatBox label="Active" value={products.filter(p => p.status === 'Active').length} color="var(--success)" />
                <StatBox label="Inactive" value={products.filter(p => p.status !== 'Active').length} color="var(--text-muted)" />
                <StatBox label="Categories" value={[...new Set(products.map(p => p.category))].length} />
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
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: highlight ? 700 : 500, color: highlight ? 'var(--success)' : 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string, value: any, color?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-secondary)', borderRadius: 10 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || 'var(--text-primary)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}
