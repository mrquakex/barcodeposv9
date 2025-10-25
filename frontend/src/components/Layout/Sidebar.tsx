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
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { icon: ShoppingCart, label: 'Satış (POS)', path: '/pos', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
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
    <div className="flex h-screen w-64 flex-col bg-card border-r">
      {/* Logo */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-primary">BarcodePOS</h1>
        <p className="text-xs text-muted-foreground mt-1">Market Yönetim Sistemi</p>
      </div>

      {/* User Info */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold">
              {user?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredMenu.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent text-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Çıkış Yap</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

