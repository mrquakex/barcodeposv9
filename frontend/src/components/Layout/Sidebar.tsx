import React from 'react';
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
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { icon: ShoppingCart, label: 'Satış (POS)', path: '/pos', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
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
    <div className="flex h-screen w-64 flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 border-r-2 border-slate-200 dark:border-slate-800 shadow-xl">
      {/* Logo */}
      <div className="p-6 border-b-2 border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-600 to-slate-700 text-white">
        <h1 className="text-3xl font-black tracking-tight">BarcodePOS</h1>
        <p className="text-xs text-blue-100 mt-1 font-semibold">Market Yönetim Sistemi v9</p>
      </div>

      {/* User Info */}
      <div className="p-4 border-b-2 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950/30 dark:to-slate-950/30 border-2 border-blue-200 dark:border-blue-900 shadow-md">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center shadow-md">
            <span className="text-white font-black text-lg">
              {user?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black truncate text-slate-900 dark:text-white">{user?.name}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredMenu.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold',
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-slate-700 text-white shadow-lg scale-[1.02]'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-slate-50 dark:hover:from-blue-950/20 dark:hover:to-slate-950/20 hover:shadow-md hover:scale-[1.01] border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-white")} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 transition-all font-semibold hover:shadow-md hover:scale-[1.02] border border-transparent hover:border-red-300"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Çıkış Yap</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

