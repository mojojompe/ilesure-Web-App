import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { agentApi } from '../../api/agent';
import { companyApi } from '../../api/company';
import { chatApi } from '../../api/chat';
import { clsx } from 'clsx';
import {
<<<<<<< HEAD
  DashboardSquare02Icon, Building04Icon, UserMultiple02Icon, ChartIcon, Settings02Icon, Logout02Icon,
  CreditCardIcon, TaskDone01Icon, Notification02Icon, BubbleChatIcon, FavouriteIcon, Archive01Icon, PlusSignIcon,
  ShoppingCart01Icon
} from '@hugeicons/react';
=======
  LayoutDashboard, Building2, Users, BarChart3, Settings, LogOut,
  CreditCard, FileCheck, Bell, MessageCircle, Heart, Archive, Plus,
  ShoppingCart, HelpCircle
} from 'lucide-react';
>>>>>>> 7d4a844803e0cdf23d4765098cb6ab2a39a07649
import { useAuth } from '../../api/authContext';
import type { UserRole } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose: () => void;
  role: UserRole;
}

const agentNavItems = [
<<<<<<< HEAD
  { path: '/agent', label: 'Dashboard', icon: DashboardSquare02Icon, end: true },
  { path: '/agent/listings', label: 'My Listings', icon: Building04Icon },
  { path: '/agent/archived', label: 'Archived', icon: Archive01Icon },
  { path: '/agent/bookings', label: 'Bookings', icon: TaskDone01Icon },
  { path: '/agent/inquiries', label: 'Inquiries', icon: BubbleChatIcon },
  { path: '/agent/chats', label: 'Messages', icon: BubbleChatIcon },
  { path: '/agent/payments', label: 'Payments', icon: CreditCardIcon },
  { path: '/agent/analytics', label: 'Analytics', icon: ChartIcon },
  { path: '/agent/store', label: 'Agent Store', icon: ShoppingCart01Icon },
  { path: '/agent/notifications', label: 'Notifications', icon: Notification02Icon },
];

const companyNavItems = [
  { path: '/company', label: 'Dashboard', icon: DashboardSquare02Icon, end: true },
  { path: '/company/listings', label: 'All Listings', icon: Building04Icon },
  { path: '/company/archived', label: 'Archived', icon: Archive01Icon },
  { path: '/company/agents', label: 'Agents', icon: UserMultiple02Icon },
  { path: '/company/bookings', label: 'Bookings', icon: TaskDone01Icon },
  { path: '/company/inquiries', label: 'Inquiries', icon: BubbleChatIcon },
  { path: '/company/chats', label: 'Messages', icon: BubbleChatIcon },
  { path: '/company/payments', label: 'Payments', icon: CreditCardIcon },
  { path: '/company/analytics', label: 'Analytics', icon: ChartIcon },
  { path: '/company/store', label: 'Agent Store', icon: ShoppingCart01Icon },
  { path: '/company/notifications', label: 'Notifications', icon: Notification02Icon },
=======
  { path: '/agent', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { path: '/agent/listings', label: 'My Listings', icon: Building2 },
  { path: '/agent/archived', label: 'Archived', icon: Archive },
  { path: '/agent/bookings', label: 'Bookings', icon: FileCheck },
  { path: '/agent/inquiries', label: 'Inquiries', icon: MessageCircle },
  { path: '/agent/chats', label: 'Messages', icon: MessageCircle },
  { path: '/agent/payments', label: 'Payments', icon: CreditCard },
  { path: '/agent/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/agent/store', label: 'Agent Store', icon: ShoppingCart },
  { path: '/agent/support', label: 'Help & Support', icon: HelpCircle },
  { path: '/agent/notifications', label: 'Notifications', icon: Bell },
];

const companyNavItems = [
  { path: '/company', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { path: '/company/listings', label: 'All Listings', icon: Building2 },
  { path: '/company/archived', label: 'Archived', icon: Archive },
  { path: '/company/agents', label: 'Agents', icon: Users },
  { path: '/company/bookings', label: 'Bookings', icon: FileCheck },
  { path: '/company/inquiries', label: 'Inquiries', icon: MessageCircle },
  { path: '/company/chats', label: 'Messages', icon: MessageCircle },
  { path: '/company/payments', label: 'Payments', icon: CreditCard },
  { path: '/company/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/company/store', label: 'Agent Store', icon: ShoppingCart },
  { path: '/company/support', label: 'Help & Support', icon: HelpCircle },
  { path: '/company/notifications', label: 'Notifications', icon: Bell },
>>>>>>> 7d4a844803e0cdf23d4765098cb6ab2a39a07649
];

export function Sidebar({ isOpen, isCollapsed, onToggleCollapse, onClose, role }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const currentUserRole = user?.role || role;
  const navItems = currentUserRole === 'company' 
    ? companyNavItems 
    : (currentUserRole === 'sub_agent' 
        ? agentNavItems.filter(item => item.label !== 'Payments') 
        : agentNavItems);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  const [pendingBookings, setPendingBookings] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const bookingsRes = role === 'company'
          ? await companyApi.getBookings({ status: 'pending' })
          : await agentApi.getBookings({ status: 'pending' });
        
        if (bookingsRes.success) {
          const total = (bookingsRes as any).pagination?.totalItems 
            || (bookingsRes as any).data?.pagination?.totalItems 
            || ((bookingsRes as any).bookings || (bookingsRes as any).data?.bookings || []).length;
          setPendingBookings(total);
        }

        const chatsRes = await chatApi.getChats();
        if (chatsRes.success && chatsRes.data?.chats) {
          const totalUnread = chatsRes.data.chats.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0);
          setUnreadMessages(totalUnread);
        }
      } catch (err) {
        console.error('Error fetching sidebar counts', err);
      }
    };
    fetchCounts();
  }, [role]);

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onClose}
        />
      )}
      <aside className={clsx(
        'fixed left-0 top-0 bottom-0 bg-sidebar-gradient shadow-sidebar-pill z-30 flex flex-col overflow-hidden transition-all duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'md:translate-x-0 md:left-3 md:top-3 md:bottom-3 md:rounded-[28px]',
        isCollapsed ? 'w-20' : 'w-[250px]'
      )}>
        <div className={clsx("flex items-center px-5 py-5 border-b border-white/10 transition-all duration-300", isCollapsed ? "justify-center gap-0" : "gap-3 justify-between")}>
          <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={onToggleCollapse}>
            <div className="w-10 h-10 rounded-clay-sm overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0 shadow-clay-sm">
              <img src="/NoBG Logo.png" alt="iléSure" className="w-8 h-8 object-contain" />
            </div>
            <div className={clsx("transition-all duration-300 whitespace-nowrap", isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block")}>
              <div className="text-white font-bold text-lg leading-tight tracking-tight">{typeof user?.companyId === 'object' ? (user.companyId.name || user.companyId.tradingName) : 'iléSure'}</div>
              <div className="text-white/50 text-xs font-medium tracking-widest uppercase">
                {role === 'company' ? 'Company' : role === 'sub_agent' ? 'Sub-Agent' : 'Agent / Landlord'}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {!isCollapsed && <div className="text-white/30 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">Menu</div>}
          {navItems.map(({ path, label, icon: Icon, end }) => {
            const isActive = end ? location.pathname === path : location.pathname.startsWith(path);
            return (
              <NavLink
                key={path}
                to={path}
                onClick={onClose}
                title={isCollapsed ? label : undefined}
                className={clsx(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-clay-sm text-sm font-medium transition-all duration-150 group mx-1',
                  isActive
                    ? 'bg-white/12 text-white nav-active'
                    : 'text-white/65 hover:text-white hover:bg-white/8',
                  isCollapsed && "justify-center px-0"
                )}
              >
                <Icon className={clsx('w-5 h-5 flex-shrink-0 transition-transform duration-150', isActive ? 'text-mustard-light' : 'group-hover:scale-110')} />
                {!isCollapsed && <span className="truncate">{label}</span>}
                {!isCollapsed && label === 'Bookings' && pendingBookings > 0 && (
                  <span className="ml-auto bg-mustard-light text-burnt-brown-dark text-[10px] font-bold rounded-pill px-2 py-0.5 min-w-[20px] text-center">{pendingBookings}</span>
                )}
                {!isCollapsed && label === 'Messages' && unreadMessages > 0 && (
                  <span className="ml-auto bg-status-error text-white text-[10px] font-bold rounded-pill px-2 py-0.5 min-w-[20px] text-center">{unreadMessages}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          {!isCollapsed && role === 'sub_agent' && (
            <div className="px-3 py-2 mb-2 rounded-clay-sm bg-white/5 border border-white/10">
              <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-0.5">Affiliated Company</div>
              <div className="text-white/80 text-xs font-medium truncate">
                {(typeof user?.companyId === 'object' 
                  ? user.companyId.name || user.companyId.tradingName 
                  : user?.company?.name) || 'Company'}
              </div>
            </div>
          )}
          <NavLink
            to={role === 'company' ? '/company/settings' : '/agent/settings'}
            onClick={onClose}
            title={isCollapsed ? 'Settings' : undefined}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-clay-sm text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 transition-all duration-150 group",
              isCollapsed && "justify-center px-0"
            )}
          >
            <Settings02Icon className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
            {!isCollapsed && "Settings"}
          </NavLink>
          <div className={clsx(
            "flex items-center gap-3 px-3 py-3 mt-2 rounded-clay-sm bg-white/8",
            isCollapsed && "justify-center px-0"
          )}>
            <div className="w-8 h-8 rounded-pill bg-mustard-light flex items-center justify-center text-burnt-brown-dark font-bold text-sm flex-shrink-0 cursor-pointer" onClick={() => isCollapsed && setShowLogoutModal(true)}>
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-semibold truncate">{user?.fullName}</div>
                  <div className="text-white/40 text-xs truncate">
                    {role === 'sub_agent' ? 'Sub-Agent' : role === 'company' ? 'Company Admin' : 'Agent / Landlord'}
                  </div>
                </div>
                <button onClick={() => setShowLogoutModal(true)} className="text-white/40 hover:text-status-error transition-colors duration-150" title="Logout">
                  <Logout02Icon className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-clay-lg">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-burnt-brown-pale flex items-center justify-center mx-auto mb-4">
                <Logout02Icon className="w-7 h-7 text-burnt-brown" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Logout</h3>
              <p className="text-sm text-text-tertiary mt-1">Are you sure you want to logout?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 rounded-clay-sm border border-clay-border text-text-secondary font-medium hover:bg-clay-border-light transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 rounded-clay-sm bg-burnt-brown text-white font-medium hover:bg-burnt-brown-dark transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}