import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, User, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { soundEffects } from '../../lib/sound-effects';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import toast from 'react-hot-toast';

const MobileLogin: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('admin@barcodepos.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const hapticFeedback = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    soundEffects.tap();
    hapticFeedback(ImpactStyle.Medium);

    try {
      await login(email, password);
      toast.success('Hoş geldiniz! 🎉', { duration: 2000 });
      soundEffects.cashRegister();
      hapticFeedback(ImpactStyle.Heavy);
      
      setTimeout(() => navigate('/dashboard'), 300);
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Giriş başarısız!');
      soundEffects.error();
      hapticFeedback(ImpactStyle.Heavy);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mobile-login-clean">
      {/* Logo & Title */}
      <div className="login-header-clean">
        <div className="login-logo-clean">
          <div className="logo-icon-clean">BP</div>
        </div>
        <h1 className="login-title-clean">BarcodePOS PRO</h1>
        <p className="login-subtitle-clean">Profesyonel POS Sistemi</p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="login-form-clean">
        {/* Email */}
        <div className="input-group-clean">
          <label className="input-label-clean">E-posta</label>
          <div className="input-wrapper-clean">
            <User className="input-icon-clean" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta adresiniz"
              className="input-field-clean"
              required
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password */}
        <div className="input-group-clean">
          <label className="input-label-clean">Şifre</label>
          <div className="input-wrapper-clean">
            <Lock className="input-icon-clean" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifreniz"
              className="input-field-clean"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => {
                setShowPassword(!showPassword);
                soundEffects.tap();
                hapticFeedback();
              }}
              className="password-toggle-clean"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="login-btn-clean"
        >
          <LogIn className="w-5 h-5" />
          <span>{isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}</span>
        </button>
      </form>

      {/* Demo Info */}
      <div className="login-footer-clean">
        <div className="demo-badge-clean">
          <p className="demo-title-clean">Demo Hesap</p>
          <p className="demo-info-clean">admin@barcodepos.com / admin123</p>
        </div>
        <p className="version-text-clean">v2.7.2 - Premium</p>
      </div>
    </div>
  );
};

export default MobileLogin;

