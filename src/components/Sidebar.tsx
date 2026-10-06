import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  HeartHandshake,
  Package,
  ShoppingCart,
  Truck,
  Users,
  Building2,
  CreditCard,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  X,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  lowStockAlertCount?: number;
  dueAlertCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  lowStockAlertCount = 0,
  dueAlertCount = 0,
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Expenses', to: '/expenses', icon: Receipt },
    { name: 'Personal Expenses', to: '/personal-expenses', icon: HeartHandshake },
    {
      name: 'Products',
      to: '/products',
      icon: Package,
      badge: lowStockAlertCount > 0 ? `${lowStockAlertCount} Low` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    { name: 'Sales', to: '/sales', icon: ShoppingCart },
    { name: 'Purchases', to: '/purchases', icon: Truck },
    { name: 'Customers', to: '/customers', icon: Users },
    { name: 'Suppliers', to: '/suppliers', icon: Building2 },
    {
      name: 'Due / Receivables',
      to: '/due',
      icon: CreditCard,
      badge: dueAlertCount > 0 ? 'Dues' : undefined,
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    { name: 'Invoices', to: '/invoices', icon: FileText },
    { name: 'Reports', to: '/reports', icon: BarChart3 },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl tracking-tighter">
            BT
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-tight leading-tight flex items-center gap-1.5">
              BizTrack Nepal
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                NP
              </span>
            </h1>
            <p className="text-xs text-slate-400 truncate max-w-[140px]">
              {user?.businessName || 'My Business'}
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                }`
              }
            >
              <div className="flex items-center space-x-2.5">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${item.badgeColor || 'bg-slate-700 text-slate-200'}`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom User & Logout section */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-800 mb-2 flex items-center space-x-2.5">
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-700"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-linear-to-tr from-indigo-500 to-emerald-400 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
            </div>
          )}
          <div className="truncate flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-200 truncate">{user?.name}</div>
            <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
          </div>
          <div className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            {user?.currencySymbol || 'रु'}
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
        {sidebarContent}
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-full z-50 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
