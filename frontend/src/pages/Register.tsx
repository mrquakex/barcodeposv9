import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, ArrowLeft, Building2, User, Mail, Lock, Phone } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import FluentButton from '../components/fluent/FluentButton';
import FluentInput from '../components/fluent/FluentInput';
import FluentCard from '../components/fluent/FluentCard';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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

    if (!agreedToTerms) {
      toast.error('Kullanım koşullarını kabul etmelisiniz!');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        businessName: formData.businessName,
        phone: formData.phone,
      });

      toast.success('Hesabınız başarıyla oluşturuldu! Giriş yapabilirsiniz.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Kayıt olurken bir hata oluştu!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <FluentCard depth="depth-16" className="w-full max-w-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
            <h1 className="fluent-title text-foreground mb-2">Yeni Hesap Oluştur</h1>
            <p className="fluent-body text-foreground-secondary">
              BarcodePOS'a hoş geldiniz! Hemen kaydolun ve başlayın.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ad Soyad */}
              <FluentInput
                label="Ad Soyad"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Adınız ve soyadınız"
                required
                icon={<User className="w-4 h-4" />}
              />

              {/* Email */}
              <FluentInput
                label="E-posta"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ornek@email.com"
                required
                icon={<Mail className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* İşletme Adı */}
              <FluentInput
                label="İşletme Adı"
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="İşletmenizin adı"
                icon={<Building2 className="w-4 h-4" />}
              />

              {/* Telefon */}
              <FluentInput
                label="Telefon"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0555 123 45 67"
                icon={<Phone className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Şifre */}
              <div className="relative">
                <FluentInput
                  label="Şifre"
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

              {/* Şifre Tekrar */}
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
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start gap-3 p-4 bg-background-alt rounded-lg border border-border">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 rounded border-border"
                id="terms"
              />
              <label htmlFor="terms" className="text-sm text-foreground-secondary cursor-pointer">
                <span className="text-primary font-medium">Kullanım Koşulları</span> ve{' '}
                <span className="text-primary font-medium">Gizlilik Politikası</span>'nı okudum ve kabul ediyorum.
              </label>
            </div>

            {/* Submit Button */}
            <FluentButton
              type="submit"
              appearance="primary"
              size="large"
              className="w-full"
              loading={isLoading}
              icon={<UserPlus className="w-5 h-5" />}
            >
              Hesap Oluştur
            </FluentButton>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-foreground-secondary">Zaten hesabınız var mı?</span>
            </div>
          </div>

          {/* Login Link */}
          <Link to="/login">
            <FluentButton
              appearance="subtle"
              size="large"
              className="w-full"
              icon={<ArrowLeft className="w-5 h-5" />}
            >
              Giriş Yap
            </FluentButton>
          </Link>
        </div>
      </FluentCard>
    </div>
  );
};

export default Register;


import { UserPlus, Eye, EyeOff, ArrowLeft, Building2, User, Mail, Lock, Phone } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import FluentButton from '../components/fluent/FluentButton';
import FluentInput from '../components/fluent/FluentInput';
import FluentCard from '../components/fluent/FluentCard';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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

    if (!agreedToTerms) {
      toast.error('Kullanım koşullarını kabul etmelisiniz!');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        businessName: formData.businessName,
        phone: formData.phone,
      });

      toast.success('Hesabınız başarıyla oluşturuldu! Giriş yapabilirsiniz.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Kayıt olurken bir hata oluştu!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <FluentCard depth="depth-16" className="w-full max-w-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
            <h1 className="fluent-title text-foreground mb-2">Yeni Hesap Oluştur</h1>
            <p className="fluent-body text-foreground-secondary">
              BarcodePOS'a hoş geldiniz! Hemen kaydolun ve başlayın.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ad Soyad */}
              <FluentInput
                label="Ad Soyad"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Adınız ve soyadınız"
                required
                icon={<User className="w-4 h-4" />}
              />

              {/* Email */}
              <FluentInput
                label="E-posta"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ornek@email.com"
                required
                icon={<Mail className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* İşletme Adı */}
              <FluentInput
                label="İşletme Adı"
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="İşletmenizin adı"
                icon={<Building2 className="w-4 h-4" />}
              />

              {/* Telefon */}
              <FluentInput
                label="Telefon"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0555 123 45 67"
                icon={<Phone className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Şifre */}
              <div className="relative">
                <FluentInput
                  label="Şifre"
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

              {/* Şifre Tekrar */}
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
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start gap-3 p-4 bg-background-alt rounded-lg border border-border">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 rounded border-border"
                id="terms"
              />
              <label htmlFor="terms" className="text-sm text-foreground-secondary cursor-pointer">
                <span className="text-primary font-medium">Kullanım Koşulları</span> ve{' '}
                <span className="text-primary font-medium">Gizlilik Politikası</span>'nı okudum ve kabul ediyorum.
              </label>
            </div>

            {/* Submit Button */}
            <FluentButton
              type="submit"
              appearance="primary"
              size="large"
              className="w-full"
              loading={isLoading}
              icon={<UserPlus className="w-5 h-5" />}
            >
              Hesap Oluştur
            </FluentButton>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-foreground-secondary">Zaten hesabınız var mı?</span>
            </div>
          </div>

          {/* Login Link */}
          <Link to="/login">
            <FluentButton
              appearance="subtle"
              size="large"
              className="w-full"
              icon={<ArrowLeft className="w-5 h-5" />}
            >
              Giriş Yap
            </FluentButton>
          </Link>
        </div>
      </FluentCard>
    </div>
  );
};

export default Register;

