'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import { formatCurrency, formatNumber, formatPercent, formatDateTime } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Package, TrendingUp, DollarSign, Boxes, AlertTriangle, ShoppingCart, BarChart2, RefreshCw } from 'lucide-react';

const DATE_FILTERS = [
  { value: 'today', label: 'Today' },
  { value: '7days', label: '7 Days' },
  { value: '30days', label: '30 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
];

const STATUS_BADGE: Record<string, string> = {
  Pending: 'badge badge-pending',
  Processing: 'badge badge-processing',
  Completed: 'badge badge-completed',
  Cancelled: 'badge badge-cancelled',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ fontSize: 13, fontWeight: 600, color: p.color, marginBottom: 2 }}>
          {p.name}: {formatCurrency(p.value)}
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [dateFilter, setDateFilter] = useState('30days');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [topSort, setTopSort] = useState<'revenue' | 'profit' | 'sold'>('revenue');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?filter=${dateFilter}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [dateFilter]);

  const stats = data?.stats || {};
  const chartData = data?.chartData || [];
  const topProducts = data?.topProducts || [];
  const lowStock = data?.lowStock || [];
  const recentTx = data?.recentTransactions || [];

  const sortedTopProducts = [...topProducts].sort((a, b) => {
    if (topSort === 'revenue') return b.total_revenue - a.total_revenue;
    if (topSort === 'profit') return b.total_profit - a.total_profit;
    return b.total_sold - a.total_sold;
  }).slice(0, 10);

  const StatCard = ({ icon: Icon, label, value, sub, color }: any) => (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 4 }}>
        {loading ? <div className="skeleton" style={{ height: 28, width: 120 }} /> : value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="page-content">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <div className="page-subtitle">Grow a Garden 2 Business Overview</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {DATE_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setDateFilter(f.value)}
                className="btn btn-sm"
                style={{
                  background: dateFilter === f.value ? 'var(--accent)' : 'var(--bg-card)',
                  color: dateFilter === f.value ? 'white' : 'var(--text-secondary)',
                  border: `1px solid ${dateFilter === f.value ? 'var(--accent)' : 'var(--border)'}`,
                  fontWeight: dateFilter === f.value ? 600 : 400,
                }}
              >
                {f.label}
              </button>
            ))}
            <button onClick={fetchData} className="btn btn-secondary btn-sm btn-icon" title="Refresh">
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <StatCard icon={Package} label="Total Products" value={formatNumber(stats.total_products)} sub="Active products" color="#6366f1" />
          <StatCard icon={Boxes} label="Total Stock" value={formatNumber(stats.total_stock)} sub="Units in inventory" color="#3b82f6" />
          <StatCard icon={ShoppingCart} label="Total Revenue" value={formatCurrency(stats.total_revenue)} sub={`${stats.completed_transactions || 0} completed`} color="#22c55e" />
          <StatCard icon={TrendingUp} label="Net Profit" value={formatCurrency(stats.net_profit)} sub="After all expenses" color="#f59e0b" />
          <StatCard icon={DollarSign} label="Total HPP" value={formatCurrency(stats.total_hpp)} sub="Cost of goods sold" color="#8b5cf6" />
          <StatCard icon={BarChart2} label="Stock Value" value={formatCurrency(stats.stock_value)} sub="Current inventory value" color="#06b6d4" />
        </div>

        {/* Chart + Low Stock */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 20 }}>
          {/* Revenue Chart */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Revenue Overview</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Revenue vs Profit trend</div>
              </div>
            </div>
            {loading ? (
              <div className="skeleton" style={{ height: 220, borderRadius: 8 }} />
            ) : chartData.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <BarChart2 size={32} className="empty-state-icon" />
                <p>No data for selected period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2} fill="url(#gradRevenue)" dot={false} />
                  <Area type="monotone" dataKey="profit" name="Profit" stroke="#22c55e" strokeWidth={2} fill="url(#gradProfit)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Low Stock Alert */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <AlertTriangle size={15} color="var(--warning)" />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Low Stock Alert</span>
              {lowStock.length > 0 && (
                <span className="badge badge-pending" style={{ marginLeft: 'auto' }}>{lowStock.length}</span>
              )}
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 48, borderRadius: 8 }} />)}
              </div>
            ) : lowStock.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <p style={{ color: 'var(--success)' }}>✓ All stock levels are healthy</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                {lowStock.map((item: any) => (
                  <div key={item.product_code} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: 8,
                    border: `1px solid ${item.current_stock === 0 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.product_code}</div>
                    </div>
                    <span className={`badge ${item.current_stock === 0 ? 'badge-out-of-stock' : 'badge-low-stock'}`}>
                      {item.current_stock === 0 ? 'OUT' : item.current_stock}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Products + Recent Transactions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {/* Top Products */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Top Selling Products</div>
              <select
                value={topSort}
                onChange={e => setTopSort(e.target.value as any)}
                className="input"
                style={{ width: 'auto', fontSize: 12, padding: '4px 8px' }}
              >
                <option value="revenue">By Revenue</option>
                <option value="profit">By Profit</option>
                <option value="sold">By Qty Sold</option>
              </select>
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 36, borderRadius: 8 }} />)}
              </div>
            ) : sortedTopProducts.filter((p: any) => p.total_sold > 0).length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <p>No sales data yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 280, overflowY: 'auto' }}>
                {sortedTopProducts.filter((p: any) => p.total_sold > 0).map((p: any, i: number) => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 8, transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <span style={{ width: 20, fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textAlign: 'center' }}>#{i+1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.category} · Sold: {p.total_sold}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(p.total_revenue)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>P: {formatCurrency(p.total_profit)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Recent Transactions</div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
              </div>
            ) : recentTx.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <p>No transactions yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 280, overflowY: 'auto' }}>
                {recentTx.map((tx: any) => (
                  <div key={tx.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 8, transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{tx.transaction_code}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tx.product_name} × {tx.quantity}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{formatCurrency(tx.total)}</div>
                      <span className={STATUS_BADGE[tx.status] || 'badge badge-inactive'}>{tx.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
