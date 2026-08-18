'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  TrendingUp,
  ShoppingCart,
  History,
  Smartphone,
  Users,
  DollarSign,
  Receipt,
  PieChart,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();

  const sections = [
    {
      title: 'OVERVIEW',
      items: [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'INVENTORY',
      items: [
        { href: '/products', label: 'Products', icon: Package },
        { href: '/inventory', label: 'Inventory', icon: Layers },
        { href: '/stock-movement', label: 'Stock Movement', icon: TrendingUp },
      ],
    },
    {
      title: 'SALES',
      items: [
        { href: '/transactions', label: 'Transactions', icon: ShoppingCart },
        { href: '/sales-history', label: 'Sales History', icon: History },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { href: '/rf-devices', label: 'RF Devices', icon: Smartphone },
        { href: '/accounts', label: 'Roblox Accounts', icon: Users },
      ],
    },
    {
      title: 'FINANCE',
      items: [
        { href: '/finance', label: 'Finance Overview', icon: DollarSign },
        { href: '/expenses', label: 'Expenses', icon: Receipt },
        { href: '/profit-loss', label: 'Profit & Loss', icon: PieChart },
      ],
    },
    {
      title: 'ANALYTICS',
      items: [
        { href: '/reports', label: 'Reports', icon: BarChart3 },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { href: '/settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="h-[64px] flex items-center justify-between px-4 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-indigo-500/20">
            QB
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm text-[var(--text-primary)] leading-none tracking-tight">
                QB DASHBOARD
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-medium tracking-wide uppercase mt-1">
                Grow a Garden 2
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="w-7 h-7 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white flex items-center justify-center transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Nav Section Links */}
      <div className="flex-1 overflow-y-auto py-3 space-y-4">
        {sections.map((section) => (
          <div key={section.title} className="px-2">
            {!collapsed && (
              <div className="px-3 pb-1 text-[10px] font-bold text-[var(--text-muted)] tracking-wider uppercase">
                {section.title}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-nav-item ${isActive ? 'active' : ''} group relative`}
                  >
                    <Icon size={18} className="shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                    {collapsed && (
                      <div className="tooltip-text">
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* System Footer Badge */}
      {!collapsed && (
        <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-secondary)] m-2 rounded-xl flex items-center gap-2.5">
          <ShieldCheck size={16} className="text-[var(--success)] shrink-0" />
          <div className="flex flex-col text-xs">
            <span className="font-medium text-[var(--text-primary)] text-[11px]">Supabase Cloud</span>
            <span className="text-[10px] text-[var(--text-muted)]">Connected 24/7</span>
          </div>
        </div>
      )}
    </aside>
  );
}
