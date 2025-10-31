import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Building2, Key, Users, Settings, BarChart3, FileText, Activity, CreditCard, Code, Webhook, FileBarChart, AlertTriangle, BookOpen, Bell, UserCog, Database, Plug, TrendingUp, Monitor } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();
  const { admin } = useAuthStore();

  const menuItems = [
    { icon: Shield, label: 'Dashboard', path: '/' },
    { icon: Building2, label: 'Tenant\'lar', path: '/tenants' },
    { icon: Key, label: 'Lisanslar', path: '/licenses' },
    { icon: Users, label: 'Kullanıcılar', path: '/users' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: TrendingUp, label: 'Gelişmiş Analytics', path: '/advanced-analytics' },
    { icon: FileText, label: 'Audit Logs', path: '/audit-logs' },
    { icon: AlertTriangle, label: 'Güvenlik Denetimi', path: '/security-audit' },
    { icon: Bell, label: 'Uyarılar', path: '/alerts' },
    { icon: Activity, label: 'Sistem Sağlığı', path: '/system-health' },
    { icon: Monitor, label: 'Monitoring', path: '/monitoring' },
    { icon: CreditCard, label: 'Faturalandırma', path: '/billing' },
    { icon: Code, label: 'API Yönetimi', path: '/api-management' },
    { icon: BookOpen, label: 'API Dokümantasyonu', path: '/api-docs' },
    { icon: Webhook, label: 'Webhooks', path: '/webhooks' },
    { icon: FileBarChart, label: 'Raporlar', path: '/reports' },
    { icon: Settings, label: 'Ayarlar', path: '/settings' },
    { icon: Shield, label: 'Rol Yönetimi', path: '/role-management' },
    { icon: UserCog, label: 'Admin Yönetimi', path: '/admin-management' },
    { icon: Database, label: 'Veri İşlemleri', path: '/data-operations' },
    { icon: Plug, label: 'Entegrasyonlar', path: '/integrations' }
  ];

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Control Plane</h1>
            <p className="text-xs text-muted-foreground">Sistem Yönetimi</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="text-sm">
          <div className="font-medium">{admin?.name}</div>
          <div className="text-xs text-muted-foreground">{admin?.email}</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

