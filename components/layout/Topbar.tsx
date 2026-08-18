'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Search, Bell, Moon, User, ChevronRight, Check } from 'lucide-react';
import GlobalSearch from './GlobalSearch';

const pathTitles: Record<string, { parent: string; title: string }> = {
  '/': { parent: 'Overview', title: 'Dashboard' },
  '/products': { parent: 'Inventory', title: 'Products' },
  '/inventory': { parent: 'Inventory', title: 'Stock Management' },
  '/stock-movement': { parent: 'Inventory', title: 'Stock Movement Logs' },
  '/transactions': { parent: 'Sales', title: 'Transactions' },
  '/sales-history': { parent: 'Sales', title: 'Sales History' },
  '/rf-devices': { parent: 'Operations', title: 'RedFinger Devices' },
  '/accounts': { parent: 'Operations', title: 'Roblox Accounts' },
  '/finance': { parent: 'Finance', title: 'Financial Overview' },
  '/expenses': { parent: 'Finance', title: 'Expenses Tracker' },
  '/profit-loss': { parent: 'Finance', title: 'Profit & Loss Statement' },
  '/reports': { parent: 'Analytics', title: 'Business Reports' },
  '/settings': { parent: 'System', title: 'System Settings' },
};

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function Topbar() {
  const pathname = usePathname();
  const pathInfo = pathTitles[pathname] || { parent: 'App', title: 'Page' };

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=10');
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all_read: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <header className="topbar">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[var(--text-muted)] font-medium">{pathInfo.parent}</span>
          <ChevronRight size={14} className="text-[var(--text-muted)]" />
          <span className="text-[var(--text-primary)] font-semibold">{pathInfo.title}</span>
        </div>

        <div className="flex-1" />

        {/* Global Search Button Trigger */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-xs text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] transition-all"
        >
          <Search size={14} />
          <span>Search...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border)] text-[10px] text-[var(--text-secondary)] font-mono ml-2">
            Ctrl + K
          </kbd>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="w-9 h-9 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white flex items-center justify-center relative transition-colors"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--danger)] text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                <span className="text-xs font-bold text-[var(--text-primary)]">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-[var(--accent)] hover:underline flex items-center gap-1"
                  >
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border)]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                    No new notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs transition-colors ${n.is_read ? 'opacity-60' : 'bg-[var(--accent-light)]'}`}
                    >
                      <div className="font-semibold text-[var(--text-primary)] mb-0.5">{n.title}</div>
                      <div className="text-[var(--text-secondary)] leading-relaxed">{n.message}</div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-1">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Indicator */}
        <div className="w-9 h-9 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] flex items-center justify-center">
          <Moon size={16} />
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-[var(--border)]">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold text-xs flex items-center justify-center">
            A
          </div>
          <div className="flex flex-col text-xs hidden sm:flex">
            <span className="font-semibold text-[var(--text-primary)] leading-tight">Admin</span>
            <span className="text-[10px] text-[var(--text-muted)]">Owner</span>
          </div>
        </div>
      </header>

      {/* Command Palette Modal */}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
