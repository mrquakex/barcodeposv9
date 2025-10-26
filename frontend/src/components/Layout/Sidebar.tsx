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
        "hidden md:flex h-screen flex-col",
        "bg-background",                          // Pure white/black background
        "border-r border-border",                 // Thin border (Apple style)
        "transition-all duration-300 ease-out",
        isExpanded ? "w-64" : "w-20"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo/Brand (Apple Minimal) */}
      <div className="px-5 py-6 border-b border-border">
        <div className={cn(
          "transition-all duration-300",
          isExpanded ? "opacity-100" : "opacity-0 w-0 h-0 overflow-hidden"
        )}>
          <h1 className="text-[22px] font-semibold text-foreground tracking-tight whitespace-nowrap">
            BarcodePOS
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1 font-medium whitespace-nowrap">
            Market Yönetim Sistemi
          </p>
        </div>
        
        {!isExpanded && (
          <div className="flex items-center justify-center">
            <h1 className="text-[20px] font-semibold text-primary">B</h1>
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
                  'flex items-center gap-3',
                  'px-3 py-2.5',
                  'rounded-[10px]',              // Apple 10px radius
                  'transition-all duration-200',
                  'font-medium',                 // Medium weight (Apple)
                  'text-[15px]',                 // 15px font
                  'group relative',
                  isActive
                    ? 'bg-primary/10 text-primary'  // Apple tinted style for active
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0")} />
                <span className={cn(
                  "transition-all duration-300 whitespace-nowrap",
                  isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
                )}>
                  {item.label}
                </span>
                
                {!isExpanded && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-card border border-border text-foreground text-[13px] rounded-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 apple-shadow-md">
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
                className={cn(
                  "flex w-full items-center gap-3",
                  "px-3 py-2.5",
                  "rounded-[10px]",
                  "transition-all duration-200",
                  "font-medium",
                  "text-[15px]",
                  "text-foreground",
                  "hover:bg-muted",
                  "group relative"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={cn(
                  "transition-all duration-300 whitespace-nowrap flex-1 text-left",
                  isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
                )}>
                  {item.label}
                </span>
                {isExpanded && hasChildren && (
                  isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                
                {!isExpanded && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-card border border-border text-foreground text-[13px] rounded-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 apple-shadow-md">
                    {item.label}
                  </div>
                )}
              </button>

              {/* Children (Apple Sub-menu) */}
              {hasChildren && isOpen && isExpanded && (
                <div className="ml-3 mt-1 space-y-0.5 border-l border-border pl-2">
                  {item.children!.filter(child => child.roles.includes(user?.role || '')).map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive = child.path && location.pathname === child.path;

                    return (
                      <Link
                        key={child.path}
                        to={child.path!}
                        className={cn(
                          'flex items-center gap-2.5',
                          'px-3 py-2',
                          'rounded-[8px]',              // Slightly smaller radius for sub-items
                          'transition-all duration-200',
                          'font-normal',                // Normal weight for sub-items
                          'text-[14px]',                // Slightly smaller font
                          'group relative',
                          isChildActive
                            ? 'bg-primary/10 text-primary'   // Same tinted style
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <ChildIcon className="w-4 h-4 flex-shrink-0" />
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

      {/* Logout (Apple Footer) */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-3",
            "px-3 py-2.5",
            "rounded-[10px]",
            "hover:bg-destructive/10",
            "text-destructive",
            "transition-all duration-200",
            "font-medium",
            "text-[15px]",
            "group relative"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className={cn(
            "transition-all duration-300 whitespace-nowrap",
            isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
          )}>
            Çıkış Yap
          </span>
          
          {/* Tooltip when collapsed */}
          {!isExpanded && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-card border border-border text-foreground text-[13px] rounded-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 apple-shadow-md">
              Çıkış Yap
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
