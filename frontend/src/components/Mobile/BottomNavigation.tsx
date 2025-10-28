import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, DollarSign, Users, Settings, ShoppingCart } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { cn } from '../../lib/utils';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = [
    { icon: Home, label: 'Ana Sayfa', path: '/dashboard' },
    { icon: ShoppingCart, label: 'POS', path: '/pos' },
    { icon: Package, label: 'Ürünler', path: '/products' },
    { icon: Users, label: 'Müşteriler', path: '/customers' },
    { icon: Settings, label: 'Ayarlar', path: '/settings' },
  ];

  const handleNavigation = async (path: string) => {
    // Haptic feedback
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      // Haptics might not be available on web
    }
    navigate(path);
  };

  return (
    <nav className="bottom-navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <button
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            className={cn(
              'bottom-nav-item',
              isActive && 'active'
            )}
          >
            <Icon className="w-6 h-6" />
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavigation;

