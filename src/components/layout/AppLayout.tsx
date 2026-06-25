import { useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import type { UserRole } from '../../types';

interface AppLayoutProps {
  children: ReactNode;
  role: UserRole;
  title: string;
  subtitle?: string;
  onReload?: () => void;
}

export function AppLayout({ children, role, title, subtitle, onReload }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  let bgImage = '/bg_discover.png';
  if (path.includes('/settings')) {
    bgImage = '/bg_settings.png';
  } else if (path.includes('/notifications')) {
    bgImage = '/bg_notification.png';
  } else if (path.includes('/profile')) {
    bgImage = '/bg_profile.png';
  } else if (path.includes('/listings')) {
    bgImage = '/bg_listing.png';
  } else if (path.includes('/archived')) {
    bgImage = '/bg_document.png';
  } else if (path.includes('/bookings')) {
    bgImage = '/bg_booking.png';
  } else if (path.includes('/chats') || path.includes('/inquiries')) {
    bgImage = '/bg_chat.png';
  } else if (path.includes('/analytics')) {
    bgImage = '/bg_analytics.png';
  } else if (path.includes('/payment')) {
    bgImage = '/bg_payment.png';
  } else if (path.includes('/agents')) {
    bgImage = '/bg_team.png';
  }

  const overlayColor = 'rgba(249, 248, 246, 0.85)';

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat"
      style={{ backgroundImage: `linear-gradient(${overlayColor}, ${overlayColor}), url('${bgImage}')` }}
    >
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
          onReload={onReload}
        />
        <main className="flex-1 p-4 pt-24 md:px-6 md:pt-[6rem] overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}