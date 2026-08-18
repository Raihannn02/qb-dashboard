'use client';
import { useState, useEffect, useRef } from 'react';
import { Bell, Menu, User, CheckCheck } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface TopbarProps {
  sidebarCollapsed: boolean;
  onMobileMenuToggle: () => void;
}

export default function Topbar({ sidebarCollapsed, onMobileMenuToggle }: TopbarProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const sidebarWidth = sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)';

  const fetchNotifs = async () => {
    const res = await fetch('/api/notifications?limit=10');
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mark_all_read: true }) });
    setUnreadCount(0);
    setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
  };

  const getNotifColor = (type: string) => {
    if (type === 'success') return 'var(--success)';
    if (type === 'warning') return 'var(--warning)';
    if (type === 'error') return 'var(--danger)';
    return 'var(--info)';
  };

  return (
    <header
      className="topbar"
      style={{ left: sidebarWidth }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={onMobileMenuToggle}
        className="md:hidden"
        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: 4 }}
      >
        <Menu size={20} />
      </button>

      <div style={{ flex: 1 }} />

      {/* Notifications */}
      <div ref={notifRef} style={{ position: 'relative' }}>
        <button
          onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) fetchNotifs(); }}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-secondary)', position: 'relative', transition: 'all 0.15s',
          }}
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4, background: 'var(--danger)',
              color: 'white', borderRadius: '10px', fontSize: 10, fontWeight: 700,
              minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px',
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {showNotifs && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            width: 360, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
            borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 200,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No notifications</div>
              ) : notifications.map((n) => (
                <div key={n.id} style={{
                  padding: '12px 16px', borderBottom: '1px solid var(--border)',
                  background: n.is_read ? 'transparent' : 'rgba(99,102,241,0.04)',
                  transition: 'background 0.15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: getNotifColor(n.type), flexShrink: 0, marginTop: 4 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)', marginBottom: 2 }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.message}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{formatDateTime(n.created_at)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
        cursor: 'pointer',
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <User size={13} color="white" />
        </div>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>Admin</span>
      </div>
    </header>
  );
}
