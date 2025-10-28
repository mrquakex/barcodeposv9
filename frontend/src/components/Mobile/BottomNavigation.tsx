import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Package, Bell, User } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { soundEffects } from '../../lib/sound-effects';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  badge?: number;
}

const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = [
    { icon: Home, label: 'Ana Sayfa', path: '/dashboard' },
    { icon: ShoppingCart, label: 'Satış', path: '/pos' },
    { icon: Package, label: 'Ürünler', path: '/products' },
    { icon: Bell, label: 'Bildirimler', path: '/notifications' },
    { icon: User, label: 'Profil', path: '/profile' },
  ];

  const handleNavigation = async (path: string) => {
    if (location.pathname === path) return;

    soundEffects.tap();
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
    navigate(path);
  };

  return (
    <nav className="bottom-nav-pro">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || 
                        (item.path === '/dashboard' && location.pathname === '/');

        return (
          <button
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            className={`nav-item-pro ${isActive ? 'active' : ''}`}
          >
            <div className="nav-icon-wrapper">
              <Icon className="nav-icon" />
              {item.badge && item.badge > 0 && (
                <span className="nav-badge">{item.badge}</span>
              )}
              {isActive && <div className="active-indicator" />}
            </div>
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavigation;
