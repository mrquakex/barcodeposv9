import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Mail, Shield, Moon, Sun, LogOut, 
  Key, Bell, Info, HelpCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { soundEffects } from '../../lib/sound-effects';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import toast from 'react-hot-toast';

const MobileProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = async () => {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      soundEffects.tap();
      await logout();
      navigate('/login');
    }
  };

  const menuItems = [
    { icon: Key, label: 'Şifre Değiştir', action: () => toast('Çok yakında!', { icon: '🔑' }) },
    { icon: Bell, label: 'Bildirim Ayarları', action: () => navigate('/notifications') },
    { icon: Info, label: 'Hakkında', action: () => toast('BarcodePOS v2.1.0', { icon: '📱' }) },
    { icon: HelpCircle, label: 'Yardım', action: () => toast('Destek ekibi ile iletişime geçin', { icon: '💬' }) },
  ];

  return (
    <div className="mobile-app-wrapper">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #64748B 0%, #94A3B8 100%)',
        padding: '16px',
        paddingTop: 'calc(16px + env(safe-area-inset-top))',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-lg bg-white/20"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-xl font-bold text-white">Profil</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* User Card */}
        <div style={{
          background: 'linear-gradient(135deg, #3F8EFC 0%, #74C0FC 100%)',
          borderRadius: '20px',
          padding: '24px',
          textAlign: 'center',
          color: 'white',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <User className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-1">{user?.name || 'Kullanıcı'}</h2>
          <p className="text-sm opacity-90 mb-1">
            <Mail className="w-4 h-4 inline mr-1" />
            {user?.email || 'email@example.com'}
          </p>
          <div style={{
            display: 'inline-block',
            padding: '6px 12px',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.2)',
            fontSize: '12px',
            fontWeight: '600',
            marginTop: '8px',
          }}>
            <Shield className="w-3 h-3 inline mr-1" />
            {user?.role === 'ADMIN' ? 'Yönetici' : user?.role === 'MANAGER' ? 'Müdür' : 'Kasiyer'}
          </div>
        </div>

        {/* Theme Toggle Card */}
        <div style={{
          background: theme === 'dark' ? 'rgba(44, 44, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '16px',
          border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-blue-500" />
            ) : (
              <Sun className="w-5 h-5 text-orange-500" />
            )}
            <span className="font-medium text-foreground">
              {theme === 'dark' ? 'Koyu Tema' : 'Açık Tema'}
            </span>
          </div>
          <button
            onClick={() => {
              toggleTheme();
              soundEffects.tap();
              if (Capacitor.isNativePlatform()) {
                Haptics.impact({ style: ImpactStyle.Light });
              }
            }}
            style={{
              width: '52px',
              height: '32px',
              borderRadius: '16px',
              background: theme === 'dark' ? '#3F8EFC' : '#E5E7EB',
              position: 'relative',
              transition: 'all 0.3s',
            }}
          >
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'white',
              position: 'absolute',
              top: '3px',
              left: theme === 'dark' ? '23px' : '3px',
              transition: 'all 0.3s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>

        {/* Menu Items */}
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                soundEffects.tap();
                item.action();
              }}
              style={{
                width: '100%',
                background: theme === 'dark' ? 'rgba(44, 44, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '12px',
                padding: '16px',
                border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3F8EFC 0%, #74C0FC 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="flex-1 text-left font-medium text-foreground">{item.label}</span>
              <span className="text-foreground-secondary">›</span>
            </button>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
            color: 'white',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            border: 'none',
            cursor: 'pointer',
            marginTop: '24px',
          }}
        >
          <LogOut className="w-5 h-5" />
          Çıkış Yap
        </button>

        {/* App Info */}
        <div className="text-center text-sm text-foreground-secondary py-4">
          <p>BarcodePOS Mobile</p>
          <p>Versiyon 2.1.0</p>
          <p className="text-xs mt-2">© 2025 Tüm hakları saklıdır</p>
        </div>
      </div>
    </div>
  );
};

export default MobileProfile;

