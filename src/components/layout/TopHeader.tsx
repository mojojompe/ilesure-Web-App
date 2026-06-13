import { Menu, Search, Bell, ChevronDown, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { clsx } from 'clsx';

interface TopHeaderProps {
  onMenuClick: () => void;
  title: string;
  subtitle?: string;
  onReload?: () => void;
}

export function TopHeader({ onMenuClick, title, subtitle, onReload }: TopHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { default: notificationsApi } = await import('../../api/notifications');
        const [notifsRes, countRes] = await Promise.all([
          notificationsApi.getNotifications(1, 5),
          notificationsApi.getUnreadCount()
        ]);
        
        if (notifsRes.success && notifsRes.data) {
          setNotifications(notifsRes.data.notifications);
        }
        if (countRes.success && countRes.count !== undefined) {
          setUnreadCount(countRes.count);
        }
      } catch (err) {
        console.error('Failed to load notifications', err);
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

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
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-status-error rounded-full" />
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-clay shadow-clay border border-clay-border overflow-hidden">
                <div className="px-4 py-3 border-b border-clay-border-light">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((n: any) => (
                      <div key={n._id} className={clsx("px-4 py-3 border-b border-clay-border-light hover:bg-mustard-pale cursor-pointer", !n.read && "bg-mustard-pale/30")}>
                        <p className="text-sm text-text-primary font-medium">{n.title}</p>
                        <p className="text-sm text-text-secondary mt-0.5">{n.body || n.message}</p>
                        <p className="text-xs text-text-tertiary mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-text-tertiary text-sm">No new notifications</div>
                  )}
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