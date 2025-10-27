import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';

/* ============================================
   BOTTOM NAVIGATION - Mobile Only
   Microsoft Fluent Design
   ============================================ */

interface NavItem {
  icon: any;
  label: string;
  path: string;
  badge?: number;
}

const BottomNav: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const navItems: NavItem[] = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/dashboard' },
    { icon: ShoppingCart, label: t('nav.pos'), path: '/pos' },
    { icon: Package, label: t('nav.products'), path: '/products' },
    { icon: Users, label: t('nav.customers'), path: '/customers' },
    { icon: BarChart3, label: t('nav.reports'), path: '/reports' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background-alt border-t border-border mobile-safe-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative',
                isActive
                  ? 'text-primary'
                  : 'text-foreground-secondary hover:text-foreground'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b" />
              )}

              <Icon className={cn('w-5 h-5', isActive && 'scale-110')} strokeWidth={2} />
              <span className="fluent-caption font-medium">{item.label}</span>

              {/* Badge */}
              {item.badge !== undefined && item.badge > 0 && (
                <div className="absolute top-1 right-1/4 w-4 h-4 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

