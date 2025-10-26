import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  LogOut,
  FolderOpen,
  UserCircle,
  Building2,
  TrendingUp,
  DollarSign,
  PiggyBank,
  ShoppingBag,
  Gift,
  Ticket,
  Building,
  Shield,
  UserCog,
  Receipt,
  Brain,
  Bot,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { icon: ShoppingCart, label: 'Satış (POS)', path: '/pos', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { icon: Zap, label: 'Hızlı Satış', path: '/quick-sale', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { icon: Receipt, label: 'Satışlar', path: '/sales', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { icon: Package, label: 'Ürünler', path: '/products', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { icon: FolderOpen, label: 'Kategoriler', path: '/categories', roles: ['ADMIN', 'MANAGER'] },
    { icon: Building2, label: 'Tedarikçiler', path: '/suppliers', roles: ['ADMIN', 'MANAGER'] },
    { icon: ShoppingBag, label: 'Satın Alma', path: '/purchase-orders', roles: ['ADMIN', 'MANAGER'] },
    { icon: TrendingUp, label: 'Stok Hareketleri', path: '/stock-movements', roles: ['ADMIN', 'MANAGER'] },
    { icon: DollarSign, label: 'Giderler', path: '/expenses', roles: ['ADMIN', 'MANAGER'] },
    { icon: PiggyBank, label: 'Finans', path: '/finance', roles: ['ADMIN', 'MANAGER'] },
    { icon: Users, label: 'Müşteriler', path: '/customers', roles: ['ADMIN', 'MANAGER'] },
    { icon: Gift, label: 'Kampanyalar', path: '/campaigns', roles: ['ADMIN', 'MANAGER'] },
    { icon: Ticket, label: 'Kuponlar', path: '/coupons', roles: ['ADMIN', 'MANAGER'] },
    { icon: BarChart3, label: 'Raporlar', path: '/reports', roles: ['ADMIN', 'MANAGER'] },
    { icon: Brain, label: 'AI İçgörüleri', path: '/ai-insights', roles: ['ADMIN', 'MANAGER'] },
    { icon: Bot, label: 'AI Asistan', path: '/ai-chat', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { icon: Building, label: 'Şubeler', path: '/branches', roles: ['ADMIN'] },
    { icon: UserCog, label: 'Kullanıcılar', path: '/user-management', roles: ['ADMIN'] },
    { icon: Shield, label: 'Aktivite Logları', path: '/activity-logs', roles: ['ADMIN'] },
    { icon: UserCircle, label: 'Profil', path: '/profile', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { icon: Settings, label: 'Ayarlar', path: '/settings', roles: ['ADMIN', 'MANAGER'] },
  ];

  const filteredMenu = menuItems.filter((item) => item.roles.includes(user?.role || ''));

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div 
      className={cn(
        "flex h-screen flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 border-r-2 border-slate-200 dark:border-slate-800 shadow-xl transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-20"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo */}
      <div className="p-6 border-b-2 border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-600 to-slate-700 text-white">
        <div className={cn(
          "transition-all duration-300",
          isExpanded ? "opacity-100" : "opacity-0 w-0 h-0 overflow-hidden"
        )}>
          <h1 className="text-3xl font-black tracking-tight whitespace-nowrap">BarcodePOS</h1>
          <p className="text-xs text-blue-100 mt-1 font-semibold whitespace-nowrap">Market Yönetim Sistemi v9</p>
        </div>
        
        {!isExpanded && (
          <div className="flex items-center justify-center">
            <h1 className="text-2xl font-black text-white">BP</h1>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-3">
        {filteredMenu.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold group relative',
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-slate-700 text-white shadow-lg'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-slate-50 dark:hover:from-blue-950/20 dark:hover:to-slate-950/20 hover:shadow-md border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-white")} />
              <span className={cn(
                "text-sm transition-all duration-300 whitespace-nowrap",
                isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
              )}>
                {item.label}
              </span>
              
              {/* Tooltip when collapsed */}
              {!isExpanded && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 transition-all font-semibold hover:shadow-md border border-transparent hover:border-red-300 group relative"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className={cn(
            "text-sm transition-all duration-300 whitespace-nowrap",
            isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
          )}>
            Çıkış Yap
          </span>
          
          {/* Tooltip when collapsed */}
          {!isExpanded && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
              Çıkış Yap
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
