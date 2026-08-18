'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/layout-dashboard';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Package, TrendingUp, DollarSign, Boxes, AlertTriangle, ShoppingCart, BarChart2, ArrowUpRight, ChevronRight, PlusCircle } from 'lucide-react';
import Link from 'next/link';

const DATE_FILTERS = [
  { value: 'today', label: 'Today' },
  { value: '7days', label: '7D' },
  { value: '30days', label: '30D' },
  { value: 'this_month', label: 'This Month' },
  { value: 'this_year', label: '1Y' },
  { value: 'all', label: 'All' },
];

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

  const visibleLowStock = lowStock.slice(0, 5);

  const StatCard = ({ icon: Icon, label, value, sub, trend, color }: any) => (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[var(--text-secondary)]">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18`, color }}>
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
      <div className="page-content space-y-6">
        {/* Header Greeting & Date Filter */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="page-title">Good afternoon, Admin</h1>
              <div className="page-subtitle">Here's what's happening with your Grow a Garden 2 business today.</div>
            </div>

            {/* Top Quick Actions Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/transactions" className="btn btn-primary btn-sm">
                <ShoppingCart size={14} /> + Record Sale
              </Link>
              <Link href="/products" className="btn btn-secondary btn-sm">
                <Package size={14} /> + Add Product
              </Link>
              <Link href="/inventory" className="btn btn-secondary btn-sm">
                <Boxes size={14} /> Stock Management
              </Link>
            </div>
          </div>

          <div className="pt-1">
            <SegmentedControl
              options={DATE_FILTERS}
              selectedValue={dateFilter}
              onChange={setDateFilter}
              onRefresh={fetchData}
              isLoading={loading}
            />
          </div>
        </div>

        {/* KPI Cards: Row 1 (4 Cards) */}
        <div className="kpi-grid-4 mb-6">
          <StatCard icon={ShoppingCart} label="Revenue" value={formatCurrency(stats.total_revenue)} sub={`${stats.completed_transactions || 0} completed`} trend="+12.5%" color="#10b981" />
          <StatCard icon={TrendingUp} label="Net Profit" value={formatCurrency(stats.net_profit)} sub="After expenses" trend="+8.4%" color="#6366f1" />
          <StatCard icon={Boxes} label="Total Stock" value={formatNumber(stats.total_stock)} sub="Units in inventory" color="#3b82f6" />
          <StatCard icon={BarChart2} label="Stock Value" value={formatCurrency(stats.stock_value)} sub="Inventory asset" color="#f59e0b" />
        </div>

        {/* KPI Cards: Row 2 (2 Cards) */}
        <div className="kpi-grid-2 mb-6">
          <StatCard icon={Package} label="Active Products" value={formatNumber(stats.total_products)} sub="In catalog" color="#8b5cf6" />
          <StatCard icon={DollarSign} label="Total HPP" value={formatCurrency(stats.total_hpp)} sub="Cost of goods" color="#ec4899" />
        </div>

        {/* Revenue Chart + Inventory Alerts */}
        <div className="dashboard-grid-row split-70-30 mb-6">
          {/* Revenue Chart */}
          <div className="card p-6 flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="font-bold text-base text-[var(--text-primary)]">Revenue & Profit Overview</h3>
              <p className="text-xs text-[var(--text-muted)]">Financial trajectory over selected timeframe</p>
            </div>
            {loading ? (
              <div className="skeleton h-60 w-full" />
            ) : chartData.length === 0 ? (
              <EmptyState
                icon={BarChart2}
                title="No transaction data yet"
                description="Complete your first transaction to see revenue and profit trends here."
                actionLabel="+ Create Transaction"
                actionHref="/transactions"
                compact
              />
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

          {/* Low Stock Alerts Widget (Max 5 items) */}
          <div className="card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-[var(--warning)]" />
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">Inventory Alerts</h3>
                </div>
                <Link href="/inventory" className="text-xs text-[var(--accent)] hover:underline flex items-center gap-0.5 font-medium">
                  View All <ChevronRight size={12} />
                </Link>
              </div>
              {lowStock.length > 5 && (
                <div className="text-[11px] text-[var(--text-muted)] mb-3">
                  Showing 5 of {lowStock.length} low-stock items
                </div>
              )}
            </div>

            {loading ? (
              <div className="space-y-2 flex-1">
                {[1, 2, 3].map(i => <div key={i} className="skeleton h-12 w-full" />)}
              </div>
            ) : lowStock.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Inventory Healthy"
                description="All inventory stock levels are well above critical threshold."
                compact
              />
            ) : (
              <div className="space-y-2.5 flex-1">
                {visibleLowStock.map((item: any) => (
                  <div
                    key={item.product_code}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-xs transition-colors hover:border-[var(--accent-glow)]"
                  >
                    <div className="flex-1 pr-2 min-w-0">
                      <div className="font-bold text-[var(--text-primary)] truncate">{item.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">{item.product_code}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${item.current_stock === 0 ? 'badge-out-of-stock' : 'badge-low-stock'}`}>
                        {item.current_stock === 0 ? 'Critical (0)' : `${item.current_stock} left`}
                      </span>
                      <Link
                        href={`/inventory?search=${item.product_code}`}
                        title="Restock item"
                        className="btn btn-secondary btn-sm !h-7 !px-2 text-[11px] text-[var(--accent)]"
                      >
                        Restock
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Products & Recent Transactions */}
        <div className="dashboard-grid-row two-col mb-6">
          {/* Top Products Widget */}
          <div className="card p-6 flex flex-col justify-between">
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
              <EmptyState
                icon={Package}
                title="No product sales recorded yet"
                description="Start completing transactions to see your best performing products here."
                actionLabel="+ Add Product"
                actionHref="/products"
                compact
              />
            ) : (
              <div className="space-y-2">
                {sortedTopProducts.filter((p: any) => p.total_sold > 0).map((p: any, i: number) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors border border-[var(--border)]"
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

          {/* Recent Sales Activity Widget */}
          <div className="card p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">Recent Sales Activity</h3>
                <p className="text-xs text-[var(--text-muted)]">Latest customer orders</p>
              </div>
              <Link href="/transactions" className="text-xs text-[var(--accent)] hover:underline flex items-center gap-0.5 font-medium">
                View All <ArrowUpRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-12 w-full" />)}
              </div>
            ) : recentTx.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="No transactions recorded yet"
                description="Start creating transactions to see recent sales activity."
                actionLabel="+ Create Transaction"
                actionHref="/transactions"
                compact
              />
            ) : (
              <div className="space-y-2">
                {recentTx.slice(0, 5).map((tx: any) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors border border-[var(--border)]"
                  >
                    <div>
                      <div className="font-semibold text-xs text-[var(--text-primary)]">{tx.tx_number} • {tx.buyer_name || 'Customer'}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{new Date(tx.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <div className="font-bold text-xs text-[var(--text-primary)]">{formatCurrency(tx.total_amount)}</div>
                        <div className="text-[10px] text-[var(--success)]">+{formatCurrency(tx.net_profit)}</div>
                      </div>
                      <span className="badge badge-completed">{tx.status}</span>
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
