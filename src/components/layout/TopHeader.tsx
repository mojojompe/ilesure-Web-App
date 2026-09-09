import { Menu01Icon, Search01Icon, Notification02Icon, ArrowDown01Icon, ReloadIcon } from '@hugeicons/react';
import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { useAuth } from '../../api/authContext';
import { useNavigate } from 'react-router-dom';

interface TopHeaderProps {
  onMenuClick: () => void;
  title: string;
  subtitle?: string;
  onReload?: () => void;
  isCollapsed?: boolean;
}

export function TopHeader({ onMenuClick, title, subtitle, onReload, isCollapsed }: TopHeaderProps) {
  const navigate = useNavigate();
  const [headerSearch, setHeaderSearch] = useState('');

  const submitHeaderSearch = () => {
    const term = headerSearch.trim();
    if (!term) return;
    const pathBase = window.location.pathname.startsWith('/company') ? '/company/listings' : '/agent/listings';
    navigate(`${pathBase}?search=${encodeURIComponent(term)}`);
  };
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  let displaySubtitle = subtitle;
  if (subtitle === "Welcome back" && user) {
    const name = user.role === 'company' ? ((user as any).companyName || user.company?.name || user.fullName) : user.fullName;
    if (name) {
      displaySubtitle = `Welcome back, ${name}`;
    }
  }

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
    <header className={clsx(
      "fixed top-4 right-4 z-20 bg-white shadow-clay-sm h-16 flex items-center px-4 md:px-6 transition-all duration-300 rounded-[2rem]",
      isCollapsed ? "left-4 md:left-[96px]" : "left-4 md:left-[276px]"
    )}>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <button
            /* A11Y-FIX (QA-A11Y-002): icon-only button, announced as just "button". */
            aria-label="Open menu"
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-clay-sm hover:bg-clay-border-light"
          >
            <Menu01Icon className="w-5 h-5 text-text-secondary" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-text-primary">{title}</h1>
            {displaySubtitle && <p className="text-xs text-text-tertiary">{displaySubtitle}</p>}
          </div>
        </div>

        {onReload && (
          <button
            onClick={onReload}
            className="p-2 rounded-full hover:bg-clay-border-light transition-colors"
            title="Reload"
          >
            <ReloadIcon className="w-4 h-4 text-text-secondary" />
          </button>
        )}

        <div className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-8">
          <div className="relative flex-1">
            <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitHeaderSearch(); }}
              placeholder="Search listings..."
              aria-label="Search listings"
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-clay-border rounded-xl focus:border-mustard focus:ring-2 focus:ring-mustard/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-pill hover:bg-clay-border-light transition-colors"
            >
              <Notification02Icon className="w-5 h-5 text-text-secondary" />
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
        </div>
      </div>
    </header>
  );
}