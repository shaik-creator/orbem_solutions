import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  CheckSquare,
  CreditCard,
  FileText,
  LayoutDashboard,
  Package,
  Plane,
  PlaneTakeoff,
  Settings,
  Sparkles,
  Truck,
  UserRound,
  UsersRound
} from 'lucide-react';
import { classNames } from '../../utils/formatters';
import { useAuth } from '../../services/authService';

const navGroups = [
  {
    section: 'Main',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/bookings', label: 'Bookings', icon: Package, badge: '12' },
      { to: '/shipments', label: 'Shipments', icon: Truck },
      { to: '/documents', label: 'Documents', icon: FileText, badge: '5', urgent: true }
    ]
  },
  {
    section: 'Finance',
    items: [
      { to: '/payments', label: 'Revenue', icon: CreditCard },
      { to: '/reports', label: 'Reports', icon: BarChart3 },
      { to: '/airline-rates', label: 'Rates', icon: Plane }
    ]
  },
  {
    section: 'People',
    items: [
      { to: '/customers', label: 'Customers', icon: UsersRound },
      { to: '/tasks', label: 'Staff', icon: CheckSquare },
      { to: '/calendar', label: 'Calendar', icon: CalendarDays }
    ]
  },
  {
    section: 'Support',
    items: [
      { to: '/notifications', label: 'Alerts', icon: Bell, badge: '3', urgent: true },
      { to: '/assistant', label: 'Assistant', icon: Bot },
      { to: '/settings', label: 'Account Center', icon: Settings, account: true }
    ]
  }
];

function getInitials(name) {
  return String(name || 'Ops User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function Tooltip({ label, collapsed }) {
  return (
    <span
      className={classNames(
        'pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 hidden -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-xl border border-white/10 bg-[#071226] px-3 py-2 text-xs font-bold text-white opacity-0 shadow-2xl transition duration-200 lg:block',
        collapsed ? 'group-hover:translate-x-0 group-hover:opacity-100' : 'lg:hidden'
      )}
    >
      {label}
    </span>
  );
}

function SidebarNavItem({ item, collapsed, onClose, accountActive }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onClose}
      title={item.label}
      className={({ isActive }) => {
        const active = isActive || (item.account && accountActive);
        return classNames(
          'group relative flex min-h-11 items-center rounded-2xl text-sm font-semibold transition-all duration-200',
          collapsed ? 'lg:justify-center lg:px-0' : 'gap-3 px-3',
          active
            ? 'bg-white/[0.14] text-white shadow-[0_12px_28px_rgba(37,99,235,0.22),inset_0_0_0_1px_rgba(255,255,255,0.15)]'
            : 'text-white/60 hover:bg-white/[0.10] hover:text-white'
        );
      }}
    >
      {({ isActive }) => {
        const active = isActive || (item.account && accountActive);
        return (
          <>
            <span
              className={classNames(
                'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200',
                active ? 'bg-white text-[#0f2f63] shadow-lg shadow-blue-500/20' : 'bg-white/[0.06] text-white/60 group-hover:bg-white/[0.13] group-hover:text-white'
              )}
            >
              {active ? <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#5ee6bb] shadow-[0_0_12px_rgba(94,230,187,0.9)]" /> : null}
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span className={classNames('min-w-0 flex-1 truncate transition-all duration-200', collapsed ? 'lg:w-0 lg:overflow-hidden lg:opacity-0' : 'opacity-100')}>{item.label}</span>
            {item.badge ? (
              <span
                className={classNames(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold transition-all duration-200',
                  collapsed ? 'lg:w-0 lg:overflow-hidden lg:p-0 lg:opacity-0' : 'opacity-100',
                  item.urgent ? 'bg-[#ef4444] text-white shadow-[0_0_18px_rgba(239,68,68,0.35)]' : 'bg-[#fbbf24] text-[#422006]'
                )}
              >
                {item.badge}
              </span>
            ) : null}
            <Tooltip label={item.label} collapsed={collapsed} />
          </>
        );
      }}
    </NavLink>
  );
}

export default function Sidebar({ open, collapsed = true, onClose, onExpand, onCollapse }) {
  const { user } = useAuth();
  const location = useLocation();
  const initials = getInitials(user?.name);
  const accountActive = ['/settings', '/profile'].includes(location.pathname);

  return (
    <>
      <aside
        onMouseEnter={onExpand}
        onMouseLeave={onCollapse}
        className={classNames(
          'fixed inset-y-0 left-0 z-40 flex h-screen w-[278px] shrink-0 transform flex-col overflow-hidden bg-[#071226] text-white shadow-2xl transition-[width,transform] duration-300 ease-out lg:sticky lg:top-0 lg:translate-x-0',
          collapsed ? 'lg:w-[76px]' : 'lg:w-[278px]',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.24),transparent_34%),radial-gradient(circle_at_80%_90%,rgba(29,158,117,0.20),transparent_30%),linear-gradient(180deg,#102a55_0%,#0b1730_48%,#06101f_100%)]" />
        <div className="pointer-events-none absolute -right-24 top-28 h-44 w-44 rounded-full bg-[#2563eb]/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-24 h-40 w-40 rounded-full bg-[#1d9e75]/18 blur-3xl" />

        <div className={classNames('relative flex h-[88px] shrink-0 items-center gap-3 border-b border-white/10 transition-all duration-300', collapsed ? 'lg:justify-center lg:px-3' : 'px-5')}>
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.12] text-white shadow-[0_16px_36px_rgba(0,0,0,0.18)]">
            <span className="absolute inset-1 rounded-xl bg-gradient-to-br from-[#38bdf8]/30 to-[#1d9e75]/30" />
            <PlaneTakeoff className="relative h-5 w-5" />
          </div>
          <div className={classNames('min-w-0 transition-all duration-200', collapsed ? 'lg:w-0 lg:overflow-hidden lg:opacity-0' : 'opacity-100')}>
            <p className="truncate text-xl font-black tracking-[0.10em]">ORBEM</p>
            <p className="mt-0.5 truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Operations OS</p>
          </div>
        </div>

        <nav className={classNames('relative min-h-0 flex-1 space-y-3 overflow-y-auto py-4 transition-all duration-300', collapsed ? 'px-2.5' : 'px-3.5')}>
          {navGroups.map((group) => (
            <div key={group.section}>
              <div className={classNames('px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.20em] text-white/32 transition-all duration-200', collapsed ? 'lg:h-2 lg:overflow-hidden lg:py-0 lg:opacity-0' : 'opacity-100')}>
                {group.section}
              </div>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <SidebarNavItem
                    key={`${group.section}-${item.to}-${item.label}`}
                    item={item}
                    collapsed={collapsed}
                    onClose={onClose}
                    accountActive={accountActive}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="relative shrink-0 border-t border-white/10 p-3">
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) =>
              classNames(
                'group relative flex items-center rounded-2xl border p-2.5 transition-all duration-200',
                collapsed ? 'lg:justify-center lg:px-2' : 'gap-3',
                isActive || accountActive ? 'border-white/18 bg-white/[0.14] shadow-[0_14px_30px_rgba(37,99,235,0.18)]' : 'border-white/10 bg-white/[0.07] hover:bg-white/[0.12]'
              )
            }
            title={user?.name || 'Profile'}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#38bdf8] via-[#2563eb] to-[#1d9e75] text-xs font-black text-white shadow-lg shadow-blue-950/30">
              {initials || 'OU'}
            </span>
            <span className={classNames('min-w-0 transition-all duration-200', collapsed ? 'lg:w-0 lg:overflow-hidden lg:opacity-0' : 'opacity-100')}>
              <span className="block truncate text-sm font-bold text-white">{user?.name || 'Ops User'}</span>
              <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-white/48">
                <Sparkles className="h-3 w-3" />
                {user?.role || 'Operations'}
              </span>
            </span>
            <Tooltip label="Account Center" collapsed={collapsed} />
          </NavLink>
          <NavLink
            to="/settings"
            onClick={onClose}
            className={classNames('mt-2 flex min-h-10 items-center rounded-2xl text-sm font-bold text-white/60 transition hover:bg-white/[0.10] hover:text-white', collapsed ? 'lg:justify-center lg:px-0' : 'gap-3 px-3')}
            title="Settings"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06]">
              <UserRound className="h-4 w-4" />
            </span>
            <span className={classNames('truncate transition-all duration-200', collapsed ? 'lg:w-0 lg:overflow-hidden lg:opacity-0' : 'opacity-100')}>Profile & Settings</span>
            <Tooltip label="Profile & Settings" collapsed={collapsed} />
          </NavLink>
        </div>
      </aside>
      {open ? <button className="fixed inset-0 z-30 bg-gray-900/40 lg:hidden" onClick={onClose} aria-label="Close sidebar" /> : null}
    </>
  );
}
