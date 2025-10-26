import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Zap,
  Package,
  Users,
  Menu,
  X,
  ShoppingCart,
  BarChart3,
  Settings,
  Building2,
  Gift,
  Ticket,
  FolderOpen,
  UserCog,
  Shield,
  UserCircle,
  Receipt,
  Brain,
  Bot,
  TrendingUp,
  DollarSign,
  PiggyBank,
  ShoppingBag,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // 📱 MOBİL ANA MENÜ (5 item - Kurumsal)
  const mainNavItems = [
    { icon: LayoutDashboard, label: 'Ana Sayfa', path: '/dashboard', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { icon: Zap, label: 'Satış', path: '/pos', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { icon: Package, label: 'Ürünler', path: '/products', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { icon: Users, label: 'Müşteriler', path: '/customers', roles: ['ADMIN', 'MANAGER'] },
    { icon: Menu, label: 'Menü', path: '#', roles: ['ADMIN', 'MANAGER', 'CASHIER'], onClick: () => setShowMoreMenu(!showMoreMenu) },
  ];

  // 📱 MODAL MENÜ (Diğer sayfalar)
  const moreMenuItems = [
    { icon: Receipt, label: 'Satış Geçmişi', path: '/sales', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { icon: FolderOpen, label: 'Kategoriler', path: '/categories', roles: ['ADMIN', 'MANAGER'] },
    { icon: Building2, label: 'Tedarikçiler', path: '/suppliers', roles: ['ADMIN', 'MANAGER'] },
    { icon: ShoppingBag, label: 'Satın Alma', path: '/purchase-orders', roles: ['ADMIN', 'MANAGER'] },
    { icon: TrendingUp, label: 'Stok Hareketleri', path: '/stock-movements', roles: ['ADMIN', 'MANAGER'] },
    { icon: PiggyBank, label: 'Finans', path: '/finance', roles: ['ADMIN', 'MANAGER'] },
    { icon: DollarSign, label: 'Giderler', path: '/expenses', roles: ['ADMIN', 'MANAGER'] },
    { icon: Gift, label: 'Kampanyalar', path: '/campaigns', roles: ['ADMIN', 'MANAGER'] },
    { icon: Ticket, label: 'Kuponlar', path: '/coupons', roles: ['ADMIN', 'MANAGER'] },
    { icon: BarChart3, label: 'Raporlar', path: '/reports', roles: ['ADMIN', 'MANAGER'] },
    { icon: Bot, label: 'AI Asistan', path: '/ai-chat', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { icon: Building, label: 'Şubeler', path: '/branches', roles: ['ADMIN'] },
    { icon: UserCog, label: 'Kullanıcılar', path: '/user-management', roles: ['ADMIN'] },
    { icon: Shield, label: 'Aktivite Logları', path: '/activity-logs', roles: ['ADMIN'] },
    { icon: UserCircle, label: 'Profil', path: '/profile', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { icon: Settings, label: 'Ayarlar', path: '/settings', roles: ['ADMIN', 'MANAGER'] },
  ];

  const filteredMainNav = mainNavItems.filter((item) => item.roles.includes(user?.role || ''));
  const filteredMoreMenu = moreMenuItems.filter((item) => item.roles.includes(user?.role || ''));

  const handleNavClick = (item: typeof mainNavItems[0]) => {
    if (item.onClick) {
      item.onClick();
    } else {
      setShowMoreMenu(false);
    }
  };

  return (
    <>
      {/* Bottom Navigation - Sadece mobilde görünür */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg z-40">
        <div className="flex items-center justify-around px-2 py-2">
          {filteredMainNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.label === 'Daha Fazla' && showMoreMenu);

            if (item.path === '#') {
              // "Daha Fazla" butonu
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item)}
                  className={cn(
                    'flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all flex-1',
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-slate-700 text-white shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <Icon className={cn('w-5 h-5 mb-1', isActive && 'text-white')} />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => handleNavClick(item)}
                className={cn(
                  'flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all flex-1',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-slate-700 text-white shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <Icon className={cn('w-5 h-5 mb-1', isActive && 'text-white')} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* "Daha Fazla" Menüsü - Full screen modal */}
      <AnimatePresence>
        {showMoreMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowMoreMenu(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-2xl shadow-lg max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-slate-700 p-4 flex items-center justify-between rounded-t-2xl z-10">
                <h3 className="text-lg font-semibold text-white">Tüm Menüler</h3>
                <button
                  onClick={() => setShowMoreMenu(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Menu Grid */}
              <div className="p-4 grid grid-cols-3 gap-3">
                {filteredMoreMenu.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setShowMoreMenu(false)}
                      className={cn(
                        'flex flex-col items-center justify-center p-3 rounded-lg transition-all shadow-sm',
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-slate-700 text-white'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      )}
                    >
                      <Icon className={cn('w-6 h-6 mb-2', isActive && 'text-white')} />
                      <span className="text-xs font-medium text-center">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Bottom padding for safe area */}
              <div className="h-20" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BottomNav;

