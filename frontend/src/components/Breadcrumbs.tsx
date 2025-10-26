import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../lib/utils';

/* ============================================
   APPLE BREADCRUMBS (Finder Style)
   macOS Navigation Pattern
   ============================================ */

interface BreadcrumbItem {
  label: string;
  path: string;
}

const Breadcrumbs: React.FC = () => {
  const location = useLocation();

  // Convert pathname to breadcrumb items
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Path to label mapping (Turkish)
  const pathLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    pos: 'Satış',
    products: 'Ürünler',
    customers: 'Müşteriler',
    suppliers: 'Tedarikçiler',
    categories: 'Kategoriler',
    sales: 'Satış Geçmişi',
    'stock-movements': 'Stok Hareketleri',
    'purchase-orders': 'Satın Alma',
    expenses: 'Giderler',
    finance: 'Finans',
    reports: 'Raporlar',
    campaigns: 'Kampanyalar',
    coupons: 'Kuponlar',
    branches: 'Şubeler',
    'user-management': 'Kullanıcılar',
    'activity-logs': 'Aktivite Logları',
    'ai-chat': 'AI Asistan',
    settings: 'Ayarlar',
    profile: 'Profil',
  };

  const breadcrumbs: BreadcrumbItem[] = pathnames.map((pathname, index) => {
    const path = `/${pathnames.slice(0, index + 1).join('/')}`;
    const label = pathLabels[pathname] || pathname;
    return { label, path };
  });

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center gap-2 mb-4 text-[13px]">
      {/* Home Link */}
      <Link
        to="/dashboard"
        className={cn(
          'flex items-center gap-1.5',
          'px-2 py-1',
          'rounded-[6px]',
          'text-muted-foreground',
          'hover:text-foreground',
          'hover:bg-muted',
          'transition-all duration-150'
        )}
      >
        <Home className="w-3.5 h-3.5" />
        <span className="font-medium">Ana Sayfa</span>
      </Link>

      {/* Breadcrumb Items */}
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        
        return (
          <React.Fragment key={crumb.path}>
            {/* Chevron Separator */}
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
            
            {/* Breadcrumb Link/Text */}
            {isLast ? (
              <span className={cn(
                'px-2 py-1',
                'font-semibold',
                'text-foreground'
              )}>
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className={cn(
                  'px-2 py-1',
                  'rounded-[6px]',
                  'font-medium',
                  'text-muted-foreground',
                  'hover:text-foreground',
                  'hover:bg-muted',
                  'transition-all duration-150'
                )}
              >
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;

