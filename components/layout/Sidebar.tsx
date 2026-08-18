'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Boxes, ArrowLeftRight, ShoppingCart, History,
  Monitor, Users, Wallet, Receipt, TrendingUp, BarChart3, Settings,
  ChevronLeft, ChevronRight, Sprout, X
} from 'lucide-react';

const navGroups = [
  {
    label: 'MAIN',
    items: [{ href: '/', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'INVENTORY',
    items: [
      { href: '/products', label: 'Products', icon: Package },
      { href: '/inventory', label: 'Inventory', icon: Boxes },
      { href: '/stock-movement', label: 'Stock Movement', icon: ArrowLeftRight },
    ],
  },
  {
    label: 'SALES',
    items: [
      { href: '/transactions', label: 'Transactions', icon: ShoppingCart },
      { href: '/sales-history', label: 'Sales History', icon: History },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { href: '/rf-devices', label: 'RF Devices', icon: Monitor },
      { href: '/accounts', label: 'Roblox Accounts', icon: Users },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { href: '/finance', label: 'Finance', icon: Wallet },
      { href: '/expenses', label: 'Expenses', icon: Receipt },
      { href: '/profit-loss', label: 'Profit & Loss', icon: TrendingUp },
    ],
  },
  {
    label: 'REPORTS',
    items: [
      { href: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    label: 'SYSTEM',
    items: [{ href: '/settings', label: 'Settings', icon: Settings }],
  },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
      >
        {/* Logo */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          minHeight: 60,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
          }}>
            <Sprout size={18} color="white" />
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>QB DASHBOARD</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>Grow a Garden 2</div>
            </div>
          )}
          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden"
            style={{ marginLeft: 'auto', color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}>
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <div className="sidebar-section-label">{group.label}</div>
              )}
              {collapsed && <div style={{ height: 8 }} />}
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`sidebar-nav-item ${active ? 'active' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={16} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Collapse toggle — desktop only */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }} className="hidden md:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="sidebar-nav-item"
            style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start', background: 'none' }}
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
          </button>
        </div>
      </aside>
    </>
  );
}
