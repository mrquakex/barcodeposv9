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
  Scan,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

interface MenuItem {
  icon: any;
  label: string;
  path?: string;
  roles: string[];
  children?: MenuItem[];
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [openCategories, setOpenCategories] = useState<string[]>(['Ürünler', 'Finans', 'Pazarlama', 'Yönetim']);

  // 🏢 KURUMSAL KATEGORİLİ MENÜ
  const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { icon: Zap, label: 'Satış', path: '/pos', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { 
      icon: Package, 
      label: 'Ürünler', 
      roles: ['ADMIN', 'MANAGER', 'CASHIER'],
      children: [
        { icon: Package, label: 'Ürünler', path: '/products', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
        { icon: FolderOpen, label: 'Kategoriler', path: '/categories', roles: ['ADMIN', 'MANAGER'] },
        { icon: Building2, label: 'Tedarikçiler', path: '/suppliers', roles: ['ADMIN', 'MANAGER'] },
        { icon: ShoppingBag, label: 'Satın Alma', path: '/purchase-orders', roles: ['ADMIN', 'MANAGER'] },
        { icon: TrendingUp, label: 'Stok Hareketleri', path: '/stock-movements', roles: ['ADMIN', 'MANAGER'] },
      ]
    },
    { icon: Users, label: 'Müşteriler', path: '/customers', roles: ['ADMIN', 'MANAGER'] },
    { 
      icon: PiggyBank, 
      label: 'Finans', 
      roles: ['ADMIN', 'MANAGER'],
      children: [
        { icon: PiggyBank, label: 'Finans', path: '/finance', roles: ['ADMIN', 'MANAGER'] },
        { icon: DollarSign, label: 'Giderler', path: '/expenses', roles: ['ADMIN', 'MANAGER'] },
      ]
    },
    { icon: BarChart3, label: 'Raporlar', path: '/reports', roles: ['ADMIN', 'MANAGER'] },
    { 
      icon: Gift, 
      label: 'Pazarlama', 
      roles: ['ADMIN', 'MANAGER'],
      children: [
        { icon: Gift, label: 'Kampanyalar', path: '/campaigns', roles: ['ADMIN', 'MANAGER'] },
        { icon: Ticket, label: 'Kuponlar', path: '/coupons', roles: ['ADMIN', 'MANAGER'] },
      ]
    },
    { 
      icon: Shield, 
      label: 'Yönetim', 
      roles: ['ADMIN'],
      children: [
        { icon: Building, label: 'Şubeler', path: '/branches', roles: ['ADMIN'] },
        { icon: UserCog, label: 'Kullanıcılar', path: '/user-management', roles: ['ADMIN'] },
        { icon: Shield, label: 'Aktivite Logları', path: '/activity-logs', roles: ['ADMIN'] },
      ]
    },
    { icon: Bot, label: 'AI Asistan', path: '/ai-chat', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { icon: Settings, label: 'Ayarlar', path: '/settings', roles: ['ADMIN', 'MANAGER'] },
  ];

  const filteredMenu = menuItems.filter((item) => item.roles.includes(user?.role || ''));

  const toggleCategory = (label: string) => {
    setOpenCategories(prev => 
      prev.includes(label) ? prev.filter(c => c !== label) : [...prev, label]
    );
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div 
      className={cn(
        "hidden md:flex h-screen flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 border-r-2 border-slate-200 dark:border-slate-800 shadow-xl transition-all duration-300 ease-in-out",
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
          const isActive = item.path && location.pathname === item.path;
          const isOpen = openCategories.includes(item.label);
          const hasChildren = item.children && item.children.length > 0;

          // Parent category (with or without children)
          if (!hasChildren && item.path) {
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
                
                {!isExpanded && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          }

          // Category with children
          return (
            <div key={item.label}>
              <button
                onClick={() => toggleCategory(item.label)}
                className="flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold group relative text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-slate-50 dark:hover:from-blue-950/20 dark:hover:to-slate-950/20 hover:shadow-md border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={cn(
                  "text-sm transition-all duration-300 whitespace-nowrap flex-1 text-left",
                  isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
                )}>
                  {item.label}
                </span>
                {isExpanded && hasChildren && (
                  isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                )}
                
                {!isExpanded && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                    {item.label}
                  </div>
                )}
              </button>

              {/* Children */}
              {hasChildren && isOpen && isExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.children!.filter(child => child.roles.includes(user?.role || '')).map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive = child.path && location.pathname === child.path;

                    return (
                      <Link
                        key={child.path}
                        to={child.path!}
                        className={cn(
                          'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all font-medium text-sm group relative',
                          isChildActive
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-700 dark:hover:text-blue-400'
                        )}
                      >
                        <ChildIcon className={cn("w-4 h-4 flex-shrink-0", isChildActive && "text-white")} />
                        <span className="whitespace-nowrap">
                          {child.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
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
