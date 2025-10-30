import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import FluentButton from '../components/fluent/FluentButton';
import FluentInput from '../components/fluent/FluentInput';
import FluentCard from '../components/fluent/FluentCard';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { theme } = useThemeStore();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Token kontrolü
    if (!token) {
      setTokenError(true);
      toast.error('Geçersiz şifre sıfırlama linki!');
    }
  }, [theme, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Şifreler eşleşmiyor!');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır!');
      return;
    }

    if (!token) {
      toast.error('Geçersiz token!');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        password: formData.password,
      });

      setResetSuccess(true);
      toast.success('Şifreniz başarıyla sıfırlandı!');
      
      // 3 saniye sonra login sayfasına yönlendir
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Şifre sıfırlanırken bir hata oluştu!');
      if (error.response?.status === 400) {
        setTokenError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;

    if (strength <= 25) return { strength, label: 'Zayıf', color: 'bg-destructive' };
    if (strength <= 50) return { strength, label: 'Orta', color: 'bg-warning' };
    if (strength <= 75) return { strength, label: 'İyi', color: 'bg-info' };
    return { strength, label: 'Güçlü', color: 'bg-success' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
        <FluentCard depth="depth-16" className="w-full max-w-md">
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-full mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="fluent-title text-foreground mb-2">Geçersiz Link</h1>
            <p className="fluent-body text-foreground-secondary mb-6">
              Şifre sıfırlama linki geçersiz veya süresi dolmuş. Lütfen yeni bir link talep edin.
            </p>
            <Link to="/forgot-password">
              <FluentButton appearance="primary" size="large" className="w-full">
                Yeni Link Talep Et
              </FluentButton>
            </Link>
            <Link to="/login">
              <FluentButton appearance="subtle" size="large" className="w-full mt-4">
                Giriş Sayfasına Dön
              </FluentButton>
            </Link>
          </div>
        </FluentCard>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
        <FluentCard depth="depth-16" className="w-full max-w-md">
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h1 className="fluent-title text-foreground mb-2">Şifre Sıfırlandı!</h1>
            <p className="fluent-body text-foreground-secondary mb-6">
              Şifreniz başarıyla sıfırlandı. Yeni şifrenizle giriş yapabilirsiniz.
            </p>
            <div className="p-4 bg-success/10 rounded-lg border border-success/20 mb-6">
              <p className="text-sm text-success">
                Giriş sayfasına yönlendiriliyorsunuz...
              </p>
            </div>
            <Link to="/login">
              <FluentButton appearance="primary" size="large" className="w-full">
                Hemen Giriş Yap
              </FluentButton>
            </Link>
          </div>
        </FluentCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <FluentCard depth="depth-16" className="w-full max-w-md">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="fluent-title text-foreground mb-2">Yeni Şifre Oluştur</h1>
            <p className="fluent-body text-foreground-secondary">
              Hesabınız için yeni bir güvenli şifre belirleyin.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="relative">
              <FluentInput
                label="Yeni Şifre"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="En az 6 karakter"
                required
                icon={<Lock className="w-4 h-4" />}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-foreground-secondary hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground-secondary">Şifre Gücü:</span>
                  <span className={`font-medium ${passwordStrength.strength > 50 ? 'text-success' : 'text-warning'}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="w-full h-2 bg-background-alt rounded-full overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                    style={{ width: `${passwordStrength.strength}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Confirm Password */}
            <div className="relative">
              <FluentInput
                label="Şifre Tekrar"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Şifrenizi tekrar girin"
                required
                icon={<Lock className="w-4 h-4" />}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-foreground-secondary hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Match Indicator */}
            {formData.confirmPassword && (
              <div className="flex items-center gap-2 text-sm">
                {formData.password === formData.confirmPassword ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-success">Şifreler eşleşiyor</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-destructive" />
                    <span className="text-destructive">Şifreler eşleşmiyor</span>
                  </>
                )}
              </div>
            )}

            {/* Submit Button */}
            <FluentButton
              type="submit"
              appearance="primary"
              size="large"
              className="w-full"
              loading={isLoading}
              icon={<CheckCircle className="w-5 h-5" />}
            >
              Şifreyi Sıfırla
            </FluentButton>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-foreground-secondary">
              <strong className="text-primary">Güvenlik Önerisi:</strong> Şifreniz en az 8 karakter uzunluğunda olmalı,
              büyük/küçük harf, rakam ve özel karakter içermelidir.
            </p>
          </div>

          {/* Back to Login */}
          <div className="mt-6">
            <Link to="/login">
              <FluentButton
                appearance="subtle"
                size="large"
                className="w-full"
                icon={<ArrowLeft className="w-5 h-5" />}
              >
                Giriş Sayfasına Dön
              </FluentButton>
            </Link>
          </div>
        </div>
      </FluentCard>
    </div>
  );
};

export default ResetPassword;


import { Lock, Eye, EyeOff, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import FluentButton from '../components/fluent/FluentButton';
import FluentInput from '../components/fluent/FluentInput';
import FluentCard from '../components/fluent/FluentCard';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { theme } = useThemeStore();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Token kontrolü
    if (!token) {
      setTokenError(true);
      toast.error('Geçersiz şifre sıfırlama linki!');
    }
  }, [theme, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Şifreler eşleşmiyor!');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır!');
      return;
    }

    if (!token) {
      toast.error('Geçersiz token!');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        password: formData.password,
      });

      setResetSuccess(true);
      toast.success('Şifreniz başarıyla sıfırlandı!');
      
      // 3 saniye sonra login sayfasına yönlendir
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Şifre sıfırlanırken bir hata oluştu!');
      if (error.response?.status === 400) {
        setTokenError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;

    if (strength <= 25) return { strength, label: 'Zayıf', color: 'bg-destructive' };
    if (strength <= 50) return { strength, label: 'Orta', color: 'bg-warning' };
    if (strength <= 75) return { strength, label: 'İyi', color: 'bg-info' };
    return { strength, label: 'Güçlü', color: 'bg-success' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
        <FluentCard depth="depth-16" className="w-full max-w-md">
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-full mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="fluent-title text-foreground mb-2">Geçersiz Link</h1>
            <p className="fluent-body text-foreground-secondary mb-6">
              Şifre sıfırlama linki geçersiz veya süresi dolmuş. Lütfen yeni bir link talep edin.
            </p>
            <Link to="/forgot-password">
              <FluentButton appearance="primary" size="large" className="w-full">
                Yeni Link Talep Et
              </FluentButton>
            </Link>
            <Link to="/login">
              <FluentButton appearance="subtle" size="large" className="w-full mt-4">
                Giriş Sayfasına Dön
              </FluentButton>
            </Link>
          </div>
        </FluentCard>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
        <FluentCard depth="depth-16" className="w-full max-w-md">
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h1 className="fluent-title text-foreground mb-2">Şifre Sıfırlandı!</h1>
            <p className="fluent-body text-foreground-secondary mb-6">
              Şifreniz başarıyla sıfırlandı. Yeni şifrenizle giriş yapabilirsiniz.
            </p>
            <div className="p-4 bg-success/10 rounded-lg border border-success/20 mb-6">
              <p className="text-sm text-success">
                Giriş sayfasına yönlendiriliyorsunuz...
              </p>
            </div>
            <Link to="/login">
              <FluentButton appearance="primary" size="large" className="w-full">
                Hemen Giriş Yap
              </FluentButton>
            </Link>
          </div>
        </FluentCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <FluentCard depth="depth-16" className="w-full max-w-md">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="fluent-title text-foreground mb-2">Yeni Şifre Oluştur</h1>
            <p className="fluent-body text-foreground-secondary">
              Hesabınız için yeni bir güvenli şifre belirleyin.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="relative">
              <FluentInput
                label="Yeni Şifre"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="En az 6 karakter"
                required
                icon={<Lock className="w-4 h-4" />}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-foreground-secondary hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground-secondary">Şifre Gücü:</span>
                  <span className={`font-medium ${passwordStrength.strength > 50 ? 'text-success' : 'text-warning'}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="w-full h-2 bg-background-alt rounded-full overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                    style={{ width: `${passwordStrength.strength}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Confirm Password */}
            <div className="relative">
              <FluentInput
                label="Şifre Tekrar"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Şifrenizi tekrar girin"
                required
                icon={<Lock className="w-4 h-4" />}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-foreground-secondary hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Match Indicator */}
            {formData.confirmPassword && (
              <div className="flex items-center gap-2 text-sm">
                {formData.password === formData.confirmPassword ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-success">Şifreler eşleşiyor</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-destructive" />
                    <span className="text-destructive">Şifreler eşleşmiyor</span>
                  </>
                )}
              </div>
            )}

            {/* Submit Button */}
            <FluentButton
              type="submit"
              appearance="primary"
              size="large"
              className="w-full"
              loading={isLoading}
              icon={<CheckCircle className="w-5 h-5" />}
            >
              Şifreyi Sıfırla
            </FluentButton>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-foreground-secondary">
              <strong className="text-primary">Güvenlik Önerisi:</strong> Şifreniz en az 8 karakter uzunluğunda olmalı,
              büyük/küçük harf, rakam ve özel karakter içermelidir.
            </p>
          </div>

          {/* Back to Login */}
          <div className="mt-6">
            <Link to="/login">
              <FluentButton
                appearance="subtle"
                size="large"
                className="w-full"
                icon={<ArrowLeft className="w-5 h-5" />}
              >
                Giriş Sayfasına Dön
              </FluentButton>
            </Link>
          </div>
        </div>
      </FluentCard>
    </div>
  );
};

export default ResetPassword;

