'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Package, TrendingUp, DollarSign, Boxes, AlertTriangle, ShoppingCart, BarChart2, RefreshCw, ArrowUpRight, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const DATE_FILTERS = [
  { value: 'today', label: 'Today' },
  { value: '7days', label: '7D' },
  { value: '30days', label: '30D' },
  { value: 'this_month', label: 'This Month' },
  { value: 'this_year', label: '1Y' },
  { value: 'all', label: 'All' },
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
    <div className="glass p-3 rounded-lg border border-[var(--border-subtle)] text-xs shadow-xl">
      <div className="text-[var(--text-muted)] font-medium mb-1.5">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="font-semibold flex justify-between gap-4 my-0.5" style={{ color: p.color }}>
          <span>{p.name}:</span>
          <span>{formatCurrency(p.value)}</span>
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
    } catch (err) {
      console.error(err);
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
  }).slice(0, 5);

  const StatCard = ({ icon: Icon, label, value, sub, trend, color }: any) => (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18`, color }}>
          <Icon size={16} />
        </div>
      </div>
      <div className="text-2xl font-bold text-[var(--text-primary)] leading-none mb-2">
        {loading ? <div className="skeleton h-7 w-28" /> : value}
      </div>
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
        <span>{sub}</span>
        {trend && (
          <span className="text-[var(--success)] font-medium flex items-center gap-0.5">
            {trend}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="page-content">
        {/* Header Greeting */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Good afternoon, Admin</h1>
            <div className="page-subtitle">Here's what's happening with your Grow a Garden 2 business today.</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-1">
              {DATE_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setDateFilter(f.value)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-all font-medium ${
                    dateFilter === f.value
                      ? 'bg-[var(--accent)] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button onClick={fetchData} className="btn btn-secondary btn-icon" title="Refresh Data">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* 6 Key KPI Cards */}
        <div className="stats-grid">
          <StatCard icon={ShoppingCart} label="Revenue" value={formatCurrency(stats.total_revenue)} sub={`${stats.completed_transactions || 0} completed`} trend="+12.5%" color="#10b981" />
          <StatCard icon={TrendingUp} label="Net Profit" value={formatCurrency(stats.net_profit)} sub="After expenses" trend="+8.4%" color="#6366f1" />
          <StatCard icon={Boxes} label="Total Stock" value={formatNumber(stats.total_stock)} sub="Units in inventory" color="#3b82f6" />
          <StatCard icon={BarChart2} label="Stock Value" value={formatCurrency(stats.stock_value)} sub="Inventory asset" color="#f59e0b" />
          <StatCard icon={Package} label="Active Products" value={formatNumber(stats.total_products)} sub="In catalog" color="#8b5cf6" />
          <StatCard icon={DollarSign} label="Total HPP" value={formatCurrency(stats.total_hpp)} sub="Cost of goods" color="#ec4899" />
        </div>

        {/* Chart + Low Stock Alert */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Revenue Chart */}
          <div className="card lg:col-span-2 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-[var(--text-primary)]">Revenue & Profit Overview</h3>
                <p className="text-xs text-[var(--text-muted)]">Financial trajectory over selected timeframe</p>
              </div>
            </div>
            {loading ? (
              <div className="skeleton h-60 w-full" />
            ) : chartData.length === 0 ? (
              <div className="empty-state py-12">
                <BarChart2 size={32} className="empty-state-icon" />
                <p>No transaction data found for this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)', paddingTop: 10 }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} fill="url(#gradRevenue)" />
                  <Area type="monotone" dataKey="profit" name="Profit" stroke="#6366f1" strokeWidth={2} fill="url(#gradProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Low Stock Alerts Widget */}
          <div className="card p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-[var(--warning)]" />
                <h3 className="font-bold text-sm text-[var(--text-primary)]">Inventory Alerts</h3>
              </div>
              <Link href="/inventory" className="text-xs text-[var(--accent)] hover:underline flex items-center gap-0.5">
                View All <ChevronRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2 flex-1">
                {[1, 2, 3].map(i => <div key={i} className="skeleton h-12 w-full" />)}
              </div>
            ) : lowStock.length === 0 ? (
              <div className="empty-state py-8 flex-1">
                <p className="text-[var(--success)] font-medium text-xs">✓ All inventory stock levels healthy</p>
              </div>
            ) : (
              <div className="space-y-2 flex-1 overflow-y-auto max-h-60 pr-1">
                {lowStock.map((item: any) => (
                  <div
                    key={item.product_code}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">{item.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{item.product_code}</div>
                    </div>
                    <span className={`badge ${item.current_stock === 0 ? 'badge-out-of-stock' : 'badge-low-stock'}`}>
                      {item.current_stock === 0 ? 'Critical (0)' : `${item.current_stock} left`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Products & Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products Widget */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">Top Performing Products</h3>
                <p className="text-xs text-[var(--text-muted)]">Highest grossing items in sales</p>
              </div>
              <select
                value={topSort}
                onChange={e => setTopSort(e.target.value as any)}
                className="input h-8 text-xs w-32"
              >
                <option value="revenue">By Revenue</option>
                <option value="profit">By Profit</option>
                <option value="sold">By Units Sold</option>
              </select>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-12 w-full" />)}
              </div>
            ) : sortedTopProducts.filter((p: any) => p.total_sold > 0).length === 0 ? (
              <div className="empty-state py-8">
                <p className="text-xs text-[var(--text-muted)]">No product sales recorded yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedTopProducts.filter((p: any) => p.total_sold > 0).map((p: any, i: number) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors border border-[var(--border)]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-xs text-[var(--text-muted)] w-5">0{i + 1}</span>
                      <div>
                        <div className="font-semibold text-xs text-[var(--text-primary)]">{p.name}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{p.category} • {p.total_sold} units sold</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xs text-[var(--success)]">{formatCurrency(p.total_revenue)}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Profit: {formatCurrency(p.total_profit)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Transactions Widget */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">Recent Sales Activity</h3>
                <p className="text-xs text-[var(--text-muted)]">Latest customer orders</p>
              </div>
              <Link href="/transactions" className="text-xs text-[var(--accent)] hover:underline flex items-center gap-0.5">
                View All <ArrowUpRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-12 w-full" />)}
              </div>
            ) : recentTx.length === 0 ? (
              <div className="empty-state py-8">
                <p className="text-xs text-[var(--text-muted)]">No transactions recorded yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentTx.slice(0, 5).map((tx: any) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors border border-[var(--border)] text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">{tx.transaction_code}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{tx.product_name} × {tx.quantity}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[var(--text-primary)]">{formatCurrency(tx.total)}</div>
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
