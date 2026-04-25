import { useState } from 'react';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import type { UserRole } from '../../types';

interface AppLayoutProps {
  children: ReactNode;
  role: UserRole;
  title: string;
  subtitle?: string;
}

export function AppLayout({ children, role, title, subtitle }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-off-white">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={role}
      />
      
      <div className="md:ml-60 min-h-screen flex flex-col">
        <TopHeader
          onMenuClick={() => setSidebarOpen(true)}
          title={title}
          subtitle={subtitle}
        />
        <main className="flex-1 p-4 pt-20 md:px-6 md:pt-[4.5rem] overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}