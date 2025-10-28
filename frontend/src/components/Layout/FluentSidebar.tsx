import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, BarChart3, 
  Settings, ChevronRight, Search, Menu, X,
  FolderOpen, Building2, TrendingUp, ShoppingBag, FileText,
  Banknote, Receipt, Wallet, UserCog, ClipboardList, Smartphone
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';
import FluentBadge from '../fluent/FluentBadge';
import { useTranslation } from 'react-i18next';

/* ============================================
   FLUENT SIDEBAR - Microsoft Navigation
   Compact & Expandable, Category-based
   ============================================ */

interface MenuItem {
  icon: any;
  label: string;
  path?: string;
  badge?: number;
  children?: MenuItem[];
  roles?: string[];
}

interface FluentSidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const FluentSidebar: React.FC<FluentSidebarProps> = ({ isMobileOpen = false, onMobileClose }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [openCategories, setOpenCategories] = useState<string[]>(['Inventory', 'Finance']);

  // 📱 Close mobile sidebar on route change
  useEffect(() => {
    if (isMobileOpen) {
      onMobileClose?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/dashboard', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { icon: ShoppingCart, label: t('nav.pos'), path: '/pos', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { 
      icon: Package, 
      label: t('nav.inventory'),
      roles: ['ADMIN', 'MANAGER'],
      children: [
        { icon: Package, label: t('nav.products'), path: '/products' },
        { icon: FolderOpen, label: t('nav.categories'), path: '/categories' },
        { icon: TrendingUp, label: t('nav.stockMovements'), path: '/stock-movements' },
        { icon: ClipboardList, label: t('nav.stockCount'), path: '/stock-count' },
        { icon: ShoppingBag, label: t('nav.stockTransfer'), path: '/stock-transfer' },
        { icon: FileText, label: t('nav.purchaseOrders'), path: '/purchase-orders' },
        { icon: Building2, label: t('nav.suppliers'), path: '/suppliers' },
      ]
    },
    { icon: Users, label: t('nav.customers'), path: '/customers', roles: ['ADMIN', 'MANAGER'] },
    { 
      icon: Receipt, 
      label: t('nav.sales'),
      roles: ['ADMIN', 'MANAGER'],
      children: [
        { icon: Receipt, label: t('nav.salesHistory'), path: '/sales' },
        { icon: FileText, label: t('nav.returns'), path: '/returns' },
        { icon: FileText, label: t('nav.eInvoice'), path: '/e-invoice' },
      ]
    },
    { 
      icon: Banknote, 
      label: t('nav.finance'),
      roles: ['ADMIN', 'MANAGER'],
      children: [
        { icon: Banknote, label: t('nav.expenses'), path: '/expenses' },
        { icon: BarChart3, label: t('nav.profitLoss'), path: '/profit-loss' },
        { icon: Wallet, label: t('nav.cashRegister'), path: '/cash-register' },
      ]
    },
    { icon: BarChart3, label: t('nav.reports'), path: '/reports', roles: ['ADMIN', 'MANAGER'] },
    { 
      icon: UserCog, 
      label: t('nav.operations'),
      roles: ['ADMIN'],
      children: [
        { icon: ClipboardList, label: t('nav.shifts'), path: '/shifts' },
        { icon: UserCog, label: t('nav.employees'), path: '/employees' },
        { icon: Building2, label: t('nav.branches'), path: '/branches' },
      ]
    },
    { icon: Smartphone, label: '📱 Mobil Uygulama', path: '/indir.html', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { icon: Settings, label: t('nav.settings'), path: '/settings', roles: ['ADMIN', 'MANAGER'] },
  ];

  const filteredMenu = menuItems.filter(item => 
    !item.roles || item.roles.includes(user?.role || '')
  );

  const toggleCategory = (label: string) => {
    setOpenCategories(prev =>
      prev.includes(label) ? prev.filter(c => c !== label) : [...prev, label]
    );
  };

  return (
    <>
      {/* 💠 Sidebar - Microsoft Fluent Design */}
      {/* Desktop: Hover to expand | Mobile: Drawer */}
      <aside
        className={cn(
          'h-screen bg-background border-r border-border flex flex-col transition-all duration-300 ease-out overflow-visible',
          // 📱 Mobile: Drawer (slides in from left)
          'fixed left-0 top-0 z-50 w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          // 💻 Desktop: Always visible, hover to expand
          'md:relative md:translate-x-0 md:z-0',
          isExpanded ? 'md:w-64' : 'md:w-16'
        )}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Header */}
        <div className="h-16 border-b border-border flex items-center px-4">
          {(isExpanded || isMobileOpen) ? (
            <div className="flex items-center justify-between w-full">
              <h1 className="fluent-title text-foreground">BarcodePOS</h1>
              {/* 📱 Mobile Close Button */}
              <button
                onClick={() => {
                  setIsExpanded(false);
                  onMobileClose?.();
                }}
                className="md:hidden p-1 hover:bg-background-alt rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsExpanded(true)}
              className="p-2 hover:bg-background-alt rounded"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search (Expanded or Mobile) */}
        {(isExpanded || isMobileOpen) && (
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-secondary" />
              <input
                type="text"
                placeholder={t('common.search')}
                className="w-full h-8 pl-10 pr-3 bg-input border-0 rounded text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto fluent-scrollbar p-2">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = item.path && location.pathname === item.path;
            const isOpen = openCategories.includes(item.label);
            const hasChildren = item.children && item.children.length > 0;

            if (!hasChildren && item.path) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 mb-1 rounded',
                    'transition-all fluent-motion-fast',
                    'group relative',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-background-alt'
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {(isExpanded || isMobileOpen) && (
                    <>
                      <span className="fluent-body flex-1">{item.label}</span>
                      {item.badge !== undefined && (
                        <FluentBadge size="small" appearance="error">{item.badge}</FluentBadge>
                      )}
                    </>
                  )}
                  {!isExpanded && !isMobileOpen && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-card border border-border rounded fluent-depth-8 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            }

            if (hasChildren) {
              return (
                <div key={item.label} className="mb-1">
                  <button
                    onClick={() => (isExpanded || isMobileOpen) && toggleCategory(item.label)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded',
                      'transition-all fluent-motion-fast',
                      'text-foreground hover:bg-background-alt'
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {(isExpanded || isMobileOpen) && (
                      <>
                        <span className="fluent-body flex-1 text-left">{item.label}</span>
                        <ChevronRight 
                          className={cn(
                            'w-4 h-4 transition-transform',
                            isOpen && 'rotate-90'
                          )}
                        />
                      </>
                    )}
                  </button>
                  {(isExpanded || isMobileOpen) && isOpen && item.children && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = child.path && location.pathname === child.path;
                        return (
                          <Link
                            key={child.path}
                            to={child.path!}
                            className={cn(
                              'flex items-center gap-3 px-3 py-1.5 rounded',
                              'transition-all fluent-motion-fast',
                              isChildActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-foreground-secondary hover:bg-background-alt hover:text-foreground'
                            )}
                          >
                            <ChildIcon className="w-4 h-4 shrink-0" />
                            <span className="fluent-body-small">{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}
        </nav>

        {/* Footer (User - Expanded or Mobile) */}
        {(isExpanded || isMobileOpen) && (
          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="fluent-body-small font-medium text-foreground truncate">{user?.name}</p>
                <p className="fluent-caption text-foreground-secondary">{user?.role}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default FluentSidebar;

