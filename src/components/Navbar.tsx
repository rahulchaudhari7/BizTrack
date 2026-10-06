import React, { useState } from 'react';
import {
  Menu,
  Plus,
  ShoppingCart,
  Receipt,
  Package,
  Truck,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface NavbarProps {
  onOpenMobileMenu: () => void;
  onQuickAction?: (action: 'expense' | 'sale' | 'purchase' | 'product') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu, onQuickAction }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleAction = (type: 'expense' | 'sale' | 'purchase' | 'product') => {
    setDropdownOpen(false);
    if (onQuickAction) {
      onQuickAction(type);
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left side: Hamburger button + Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Workspace • {user?.municipality || 'Nepal'}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-tight truncate max-w-[180px] sm:max-w-xs md:max-w-md">
              {user?.businessName || 'Business Dashboard'}
            </h2>
          </div>
        </div>

        {/* Right side: Currency Badge, Quick Add & Google User Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Currency Indicator */}
          <div className="hidden lg:flex items-center px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
            <span>Base:</span>
            <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-white text-indigo-700 shadow-xs border border-slate-200">
              {user?.currencySymbol || 'रु'} {user?.currency || 'NPR'}
            </span>
          </div>

          {/* Quick Action Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-xs shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">Quick Add</span>
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    Create New
                  </div>
                  <button
                    onClick={() => handleAction('expense')}
                    className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer text-left"
                  >
                    <Receipt className="w-4 h-4 text-rose-500" />
                    <span>New Expense</span>
                  </button>
                  <button
                    onClick={() => handleAction('sale')}
                    className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer text-left"
                  >
                    <ShoppingCart className="w-4 h-4 text-emerald-500" />
                    <span>Record Sale / Income</span>
                  </button>
                  <button
                    onClick={() => handleAction('purchase')}
                    className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer text-left"
                  >
                    <Truck className="w-4 h-4 text-amber-500" />
                    <span>Stock Purchase</span>
                  </button>
                  <button
                    onClick={() => handleAction('product')}
                    className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer text-left"
                  >
                    <Package className="w-4 h-4 text-blue-500" />
                    <span>Add New Product</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* User Profile & Google Account Header Section */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              title="Google Account Menu"
            >
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-600/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-linear-to-tr from-indigo-600 to-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                  {user?.name || 'Google User'}
                </div>
                <div className="text-[10px] font-medium text-slate-500 truncate max-w-[120px]">
                  {user?.email}
                </div>
              </div>
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-3 z-40 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center space-x-3 p-2 bg-slate-50 rounded-xl border border-slate-100 mb-2">
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {user?.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {user?.email}
                      </div>
                      <div className="inline-flex items-center space-x-1 mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                        <span>Google Verified</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 px-2 py-1">
                    Business: <span className="font-semibold text-slate-700">{user?.businessName}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 mt-2">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-100 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout from BizTrack</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
