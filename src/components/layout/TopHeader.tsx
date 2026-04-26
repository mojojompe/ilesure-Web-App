import { Menu, Search, Bell, ChevronDown, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

interface TopHeaderProps {
  onMenuClick: () => void;
  title: string;
  subtitle?: string;
  onReload?: () => void;
}

export function TopHeader({ onMenuClick, title, subtitle, onReload }: TopHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifications = [
    { id: 1, message: 'New booking for Modern Student Hostel', time: '2 min ago' },
    { id: 2, message: 'Payment received - ₦180,000', time: '1 hour ago' },
    { id: 3, message: 'New inquiry for Single Room - Yaba', time: '3 hours ago' },
  ];

  return (
    <header className="fixed top-3 left-3 md:left-[276px] right-3 z-20 bg-white rounded-[9999px] shadow-clay-sm h-14 flex items-center px-4 md:px-5 gap-3 md:gap-4">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-clay-sm hover:bg-clay-border-light"
          >
            <Menu className="w-5 h-5 text-text-secondary" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-text-primary">{title}</h1>
            {subtitle && <p className="text-xs text-text-tertiary">{subtitle}</p>}
          </div>
        </div>

        {onReload && (
          <button
            onClick={onReload}
            className="p-2 rounded-full hover:bg-clay-border-light transition-colors"
            title="Reload"
          >
            <RefreshCw className="w-4 h-4 text-text-secondary" />
          </button>
        )}

        <div className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search listings, bookings..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-clay-border rounded-pill focus:border-mustard focus:ring-2 focus:ring-mustard/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-pill hover:bg-clay-border-light transition-colors"
            >
              <Bell className="w-5 h-5 text-text-secondary" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-status-error rounded-full" />
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-clay shadow-clay border border-clay-border overflow-hidden">
                <div className="px-4 py-3 border-b border-clay-border-light">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="px-4 py-3 border-b border-clay-border-light hover:bg-mustard-pale cursor-pointer">
                      <p className="text-sm text-text-primary">{n.message}</p>
                      <p className="text-xs text-text-tertiary mt-1">{n.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-pill bg-clay-border-light hover:bg-mustard-pale transition-colors">
            <span className="text-xs font-medium text-text-secondary">EN</span>
            <ChevronDown className="w-3 h-3 text-text-tertiary" />
          </button>
        </div>
      </div>
    </header>
  );
}