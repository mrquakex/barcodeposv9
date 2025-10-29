import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { 
  ArrowLeft, Moon, Sun, Bell, Vibrate, Volume2, 
  LogOut, User, Mail, Phone, Shield, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { soundEffects } from '../../lib/sound-effects';
import toast from 'react-hot-toast';

const MobileSettings: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [sound, setSound] = useState(true);

  const hapticFeedback = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  };

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, value: boolean) => {
    setter(!value);
    hapticFeedback(ImpactStyle.Light);
    soundEffects.tap();
  };

  const handleLogout = () => {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      logout();
      toast.success('Çıkış yapıldı');
      navigate('/login');
    }
  };

  return (
    <div className="mobile-settings-ultra">
      {/* Header */}
      <div className="mobile-header-ultra">
        <button onClick={() => navigate(-1)} className="back-btn-ultra">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1>Ayarlar</h1>
        <div className="w-6 h-6" />
      </div>

      {/* Profile Section */}
      <div className="settings-section-ultra">
        <h3 className="section-title-ultra">Profil</h3>
        <div className="profile-card-ultra">
          <div className="profile-avatar-ultra">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="profile-info-ultra">
            <h4>{user?.name || 'Kullanıcı'}</h4>
            <p>{user?.email || 'email@example.com'}</p>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="settings-section-ultra">
        <h3 className="section-title-ultra">Görünüm</h3>
        <div className="setting-item-ultra">
          <div className="setting-label-ultra">
            {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            <span>Karanlık Mod</span>
          </div>
          <label className="toggle-ultra">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={() => handleToggle(setDarkMode, darkMode)}
            />
            <span className="slider-ultra" />
          </label>
        </div>
      </div>

      {/* Notifications */}
      <div className="settings-section-ultra">
        <h3 className="section-title-ultra">Bildirimler</h3>
        <div className="setting-item-ultra">
          <div className="setting-label-ultra">
            <Bell className="w-5 h-5" />
            <span>Bildirimler</span>
          </div>
          <label className="toggle-ultra">
            <input
              type="checkbox"
              checked={notifications}
              onChange={() => handleToggle(setNotifications, notifications)}
            />
            <span className="slider-ultra" />
          </label>
        </div>
        <div className="setting-item-ultra">
          <div className="setting-label-ultra">
            <Vibrate className="w-5 h-5" />
            <span>Titreşim</span>
          </div>
          <label className="toggle-ultra">
            <input
              type="checkbox"
              checked={vibration}
              onChange={() => handleToggle(setVibration, vibration)}
            />
            <span className="slider-ultra" />
          </label>
        </div>
        <div className="setting-item-ultra">
          <div className="setting-label-ultra">
            <Volume2 className="w-5 h-5" />
            <span>Ses Efektleri</span>
          </div>
          <label className="toggle-ultra">
            <input
              type="checkbox"
              checked={sound}
              onChange={() => handleToggle(setSound, sound)}
            />
            <span className="slider-ultra" />
          </label>
        </div>
      </div>

      {/* Account */}
      <div className="settings-section-ultra">
        <h3 className="section-title-ultra">Hesap</h3>
        <button className="setting-item-ultra clickable" onClick={() => { toast('Yakında...'); hapticFeedback(); }}>
          <div className="setting-label-ultra">
            <Shield className="w-5 h-5" />
            <span>Güvenlik</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
        <button className="setting-item-ultra clickable logout" onClick={handleLogout}>
          <div className="setting-label-ultra">
            <LogOut className="w-5 h-5" />
            <span>Çıkış Yap</span>
          </div>
        </button>
      </div>

      {/* App Info */}
      <div className="app-info-ultra">
        <p className="app-name">BarcodePOS PRO</p>
        <p className="app-version">Versiyon 4.2.0</p>
      </div>
    </div>
  );
};

export default MobileSettings;

