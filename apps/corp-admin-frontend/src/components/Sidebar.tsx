import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Building2, Key, Users, Settings } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { admin } = useAuthStore();

  const menuItems = [
    { icon: Shield, label: 'Dashboard', path: '/' },
    { icon: Building2, label: 'Tenant\'lar', path: '/tenants' },
    { icon: Key, label: 'Lisanslar', path: '/licenses' },
    { icon: Users, label: 'Kullanıcılar', path: '/users' },
    { icon: Settings, label: 'Ayarlar', path: '/settings' }
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Control Plane</h1>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          <div className="font-medium text-slate-900 dark:text-white">{admin?.name}</div>
          <div className="text-xs">{admin?.email}</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

