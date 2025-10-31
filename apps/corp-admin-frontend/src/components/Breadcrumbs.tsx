import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/tenants': 'Tenant\'lar',
  '/licenses': 'Lisanslar',
  '/users': 'Kullanıcılar',
  '/analytics': 'Analytics',
  '/audit-logs': 'Audit Logs',
  '/security-audit': 'Güvenlik Denetimi',
  '/alerts': 'Uyarılar',
  '/system-health': 'Sistem Sağlığı',
  '/billing': 'Faturalandırma',
  '/api-management': 'API Yönetimi',
  '/api-docs': 'API Dokümantasyonu',
  '/webhooks': 'Webhooks',
  '/reports': 'Raporlar',
  '/settings': 'Ayarlar',
  '/settings/mfa': 'MFA Kurulumu',
  '/role-management': 'Rol Yönetimi',
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const paths = location.pathname.split('/').filter(Boolean);
  
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Ana Sayfa', href: '/' },
    ...paths.map((path, index) => {
      const fullPath = '/' + paths.slice(0, index + 1).join('/');
      return {
        label: routeLabels[fullPath] || path.charAt(0).toUpperCase() + path.slice(1),
        href: index < paths.length - 1 ? fullPath : undefined,
      };
    }),
  ];

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {crumb.href ? (
            <Link
              to={crumb.href}
              className="hover:text-foreground transition-colors"
            >
              {index === 0 ? <Home className="h-4 w-4" /> : crumb.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{crumb.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

