'use client';
import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div>
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <Topbar
        sidebarCollapsed={collapsed}
        onMobileMenuToggle={() => setMobileOpen(true)}
      />
      <main
        className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}
      >
        {children}
      </main>
    </div>
  );
}
