'use client';
import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div>
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      <Topbar collapsed={collapsed} />
      <main className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        {children}
      </main>
    </div>
  );
}
