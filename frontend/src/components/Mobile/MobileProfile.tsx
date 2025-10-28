import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, MapPin, Building2, Calendar,
  Settings, LogOut, Sun, Moon, ChevronRight, Shield
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { soundEffects } from '../../lib/sound-effects';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import toast from 'react-hot-toast';

const MobileProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const hapticFeedback = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  };

  const handleLogout = async () => {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      soundEffects.tap();
      hapticFeedback(ImpactStyle.Medium);
      logout();
      toast.success('Çıkış yapıldı');
      navigate('/login');
    }
  };

  const menuItems = [
    { icon: Settings, label: 'Ayarlar', path: '/settings', badge: null },
    { icon: Shield, label: 'Güvenlik', path: '/security', badge: null },
  ];

  return (
    <div className="mobile-profile-pro">
      {/* Profile Header */}
      <div className="profile-header-pro">
        <div className="profile-avatar-pro">
          <User className="avatar-icon-pro" />
        </div>
        <h2 className="profile-name-pro">{user?.name || 'Kullanıcı'}</h2>
        <p className="profile-role-pro">{user?.role === 'ADMIN' ? 'Yönetici' : 'Kullanıcı'}</p>
      </div>

      {/* Profile Info Cards */}
      <div className="profile-info-section">
        <div className="info-card-pro">
          <Mail className="info-icon-pro" />
          <div className="info-content-pro">
            <p className="info-label-pro">E-posta</p>
            <p className="info-value-pro">{user?.email || 'Belirtilmemiş'}</p>
          </div>
        </div>

        <div className="info-card-pro">
          <Phone className="info-icon-pro" />
          <div className="info-content-pro">
            <p className="info-label-pro">Telefon</p>
            <p className="info-value-pro">+90 555 123 45 67</p>
          </div>
        </div>

        <div className="info-card-pro">
          <Building2 className="info-icon-pro" />
          <div className="info-content-pro">
            <p className="info-label-pro">Şube</p>
            <p className="info-value-pro">Merkez Şube</p>
          </div>
        </div>

        <div className="info-card-pro">
          <Calendar className="info-icon-pro" />
          <div className="info-content-pro">
            <p className="info-label-pro">Kayıt Tarihi</p>
            <p className="info-value-pro">15 Ocak 2025</p>
          </div>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="profile-section-pro">
        <h3 className="section-title-pro">Görünüm</h3>
        <button
          onClick={() => {
            toggleTheme();
            soundEffects.tap();
            hapticFeedback();
            toast.success(theme === 'dark' ? '☀️ Açık Tema' : '🌙 Koyu Tema');
          }}
          className="theme-toggle-card-pro"
        >
          <div className="toggle-left-pro">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <div>
              <p className="toggle-title-pro">
                {theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}
              </p>
              <p className="toggle-subtitle-pro">
                {theme === 'dark' ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Menu Items */}
      <div className="profile-section-pro">
        <h3 className="section-title-pro">Diğer</h3>
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => {
              soundEffects.tap();
              hapticFeedback();
              navigate(item.path);
            }}
            className="menu-item-card-pro"
          >
            <div className="toggle-left-pro">
              <item.icon className="w-5 h-5" />
              <span className="menu-item-label-pro">{item.label}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        ))}
      </div>

      {/* Logout Button */}
      <div className="profile-section-pro">
        <button onClick={handleLogout} className="logout-btn-pro">
          <LogOut className="w-5 h-5" />
          <span>Çıkış Yap</span>
        </button>
      </div>

      {/* App Version */}
      <div className="app-version-pro">
        <p>BarcodePOS PRO</p>
        <p>Versiyon 2.9.0</p>
      </div>
    </div>
  );
};

export default MobileProfile;
