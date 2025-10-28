import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Package, PlusCircle, Users, Building2, FileText,
  BarChart3, TrendingUp, PackageSearch, ClipboardList, DollarSign, 
  Receipt, UserCog, Grid3x3, Store, Coins, Bell, User, Sun, Moon
} from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { soundEffects } from '../../lib/sound-effects';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

interface MenuButton {
  icon: React.ElementType;
  title: string;
  path: string;
  gradient: string;
  emoji: string;
}

const MobileDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

  const handleNavigation = async (path: string) => {
    navigate(path);
    soundEffects.tap();
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
  };

  // 18 ANA BUTON
  const menuButtons: MenuButton[] = [
    { icon: ShoppingCart, title: 'Satış Yap', path: '/pos', gradient: 'linear-gradient(135deg, #3F8EFC 0%, #74C0FC 100%)', emoji: '💰' },
    { icon: Package, title: 'Ürünler', path: '/products', gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)', emoji: '📦' },
    { icon: PlusCircle, title: 'Ürün Ekle', path: '/products/add', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)', emoji: '➕' },
    { icon: Users, title: 'Müşteriler', path: '/customers', gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)', emoji: '👥' },
    { icon: Building2, title: 'Firmalar', path: '/suppliers', gradient: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)', emoji: '🏭' },
    { icon: FileText, title: 'Alış Faturaları', path: '/purchase-orders', gradient: 'linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%)', emoji: '📄' },
    { icon: BarChart3, title: 'Satış Raporu', path: '/sales', gradient: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)', emoji: '📊' },
    { icon: TrendingUp, title: 'Ürünsel Rapor', path: '/reports', gradient: 'linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%)', emoji: '📈' },
    { icon: Grid3x3, title: 'Grupsal Rapor', path: '/reports?type=group', gradient: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)', emoji: '🗂️' },
    { icon: PackageSearch, title: 'Stok Sayımı', path: '/stock-count', gradient: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)', emoji: '📋' },
    { icon: DollarSign, title: 'Gelirler', path: '/cash-register?type=income', gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)', emoji: '💵' },
    { icon: Receipt, title: 'Giderler', path: '/expenses', gradient: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)', emoji: '💸' },
    { icon: UserCog, title: 'Personeller', path: '/employees', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)', emoji: '👨‍💼' },
    { icon: Grid3x3, title: 'Ürün Grupları', path: '/categories', gradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)', emoji: '🗂️' },
    { icon: Store, title: 'Şubeler', path: '/branches', gradient: 'linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%)', emoji: '🏪' },
    { icon: Coins, title: 'Döviz Kurları', path: '/settings?tab=exchange', gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)', emoji: '💱' },
    { icon: Bell, title: 'Bildirimler', path: '/notifications', gradient: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)', emoji: '🔔' },
    { icon: User, title: 'Profil', path: '/profile', gradient: 'linear-gradient(135deg, #64748B 0%, #94A3B8 100%)', emoji: '👤' },
  ];

  return (
    <div className="mobile-app-wrapper" style={{
      background: theme === 'dark' 
        ? 'linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 50%, #1C1C1E 100%)'
        : 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 50%, #F8FAFC 100%)',
      minHeight: '100vh',
      paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
    }}>
      {/* Header with User Info */}
      <div style={{
        background: 'linear-gradient(135deg, #3F8EFC 0%, #74C0FC 100%)',
        padding: '24px 20px',
        paddingTop: 'calc(24px + env(safe-area-inset-top))',
        borderBottomLeftRadius: '24px',
        borderBottomRightRadius: '24px',
        boxShadow: '0 8px 32px rgba(63, 142, 252, 0.3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: 'white',
              marginBottom: '4px',
              letterSpacing: '-0.5px',
            }}>
              {getGreeting()} 👋
            </h1>
            <p style={{
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: '500',
            }}>
              {user?.name || 'Kullanıcı'} - BarcodePOS
            </p>
          </div>
          
          {/* Theme Toggle */}
          <button
            onClick={() => {
              toggleTheme();
              soundEffects.tap();
              if (Capacitor.isNativePlatform()) {
                Haptics.impact({ style: ImpactStyle.Light });
              }
            }}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
          >
            {theme === 'dark' ? (
              <Sun className="w-6 h-6 text-yellow-300" />
            ) : (
              <Moon className="w-6 h-6 text-white" />
            )}
          </button>
        </div>

        {/* Live Clock */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: 'white',
            fontFamily: 'monospace',
          }}>
            {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{
            flex: 1,
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '500',
          }}>
            {currentTime.toLocaleDateString('tr-TR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </div>
        </div>
      </div>

      {/* Menu Grid - 18 Buttons */}
      <div style={{
        padding: '20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
      }}>
        {menuButtons.map((button, index) => (
          <button
            key={index}
            onClick={() => handleNavigation(button.path)}
            style={{
              background: theme === 'dark' 
                ? 'rgba(44, 44, 46, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              padding: '16px 12px',
              border: theme === 'dark' 
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid rgba(0, 0, 0, 0.06)',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: theme === 'dark'
                ? '0 4px 16px rgba(0, 0, 0, 0.4)'
                : '0 4px 16px rgba(0, 0, 0, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {/* Gradient Icon Background */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: button.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              position: 'relative',
            }}>
              <button.icon className="w-7 h-7 text-white" />
              {/* Emoji Badge */}
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                fontSize: '16px',
                background: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              }}>
                {button.emoji}
              </span>
            </div>

            {/* Button Text */}
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: theme === 'dark' ? '#FFFFFF' : '#1F2937',
              textAlign: 'center',
              lineHeight: '1.2',
            }}>
              {button.title}
            </span>
          </button>
        ))}
      </div>

      {/* Quick Stats Footer */}
      <div style={{
        padding: '0 20px 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #10B98120 0%, #059669 20 100%)',
          borderRadius: '16px',
          padding: '16px',
          border: '1px solid rgba(16, 185, 129, 0.2)',
        }}>
          <p style={{ fontSize: '12px', color: '#059669', marginBottom: '4px', fontWeight: '600' }}>
            Bugünkü Satış
          </p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: '#10B981' }}>
            ₺0,00
          </p>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #3F8EFC20 0%, #74C0FC20 100%)',
          borderRadius: '16px',
          padding: '16px',
          border: '1px solid rgba(63, 142, 252, 0.2)',
        }}>
          <p style={{ fontSize: '12px', color: '#3F8EFC', marginBottom: '4px', fontWeight: '600' }}>
            Bugünkü Sipariş
          </p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: '#3F8EFC' }}>
            0
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileDashboard;
