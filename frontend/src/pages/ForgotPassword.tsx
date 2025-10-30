import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import FluentButton from '../components/fluent/FluentButton';
import FluentInput from '../components/fluent/FluentInput';
import FluentCard from '../components/fluent/FluentCard';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

const ForgotPassword: React.FC = () => {
  const { theme } = useThemeStore();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setEmailSent(true);
      toast.success('Şifre sıfırlama linki email adresinize gönderildi!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Bir hata oluştu!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <FluentCard depth="depth-16" className="w-full max-w-md">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              {emailSent ? (
                <CheckCircle className="w-8 h-8 text-success" />
              ) : (
                <KeyRound className="w-8 h-8 text-primary" />
              )}
            </div>
            <h1 className="fluent-title text-foreground mb-2">
              {emailSent ? 'Email Gönderildi!' : 'Şifremi Unuttum'}
            </h1>
            <p className="fluent-body text-foreground-secondary">
              {emailSent
                ? 'Şifre sıfırlama talimatlarını email adresinize gönderdik.'
                : 'Email adresinizi girin, size şifre sıfırlama linki gönderelim.'}
            </p>
          </div>

          {!emailSent ? (
            <>
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <FluentInput
                  label="E-posta"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  required
                  icon={<Mail className="w-4 h-4" />}
                />

                <FluentButton
                  type="submit"
                  appearance="primary"
                  size="large"
                  className="w-full"
                  loading={isLoading}
                  icon={<Send className="w-5 h-5" />}
                >
                  Sıfırlama Linki Gönder
                </FluentButton>
              </form>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-foreground-secondary">
                  <strong className="text-primary">Not:</strong> Şifre sıfırlama linki 1 saat geçerlidir.
                  Email gelmezse spam klasörünü kontrol edin.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Success Message */}
              <div className="space-y-4">
                <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                  <p className="text-sm text-success text-center">
                    ✓ Şifre sıfırlama linki <strong>{email}</strong> adresine gönderildi.
                  </p>
                </div>

                <div className="p-4 bg-background-alt rounded-lg border border-border">
                  <p className="text-sm text-foreground-secondary">
                    <strong>Sonraki adımlar:</strong>
                  </p>
                  <ol className="mt-2 space-y-2 text-sm text-foreground-secondary list-decimal list-inside">
                    <li>Email kutunuzu kontrol edin</li>
                    <li>Şifre sıfırlama linkine tıklayın</li>
                    <li>Yeni şifrenizi oluşturun</li>
                    <li>Yeni şifrenizle giriş yapın</li>
                  </ol>
                </div>

                {/* Resend Button */}
                <FluentButton
                  onClick={() => setEmailSent(false)}
                  appearance="subtle"
                  size="large"
                  className="w-full"
                  icon={<Send className="w-5 h-5" />}
                >
                  Tekrar Gönder
                </FluentButton>
              </div>
            </>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-foreground-secondary">ya da</span>
            </div>
          </div>

          {/* Back to Login */}
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
      </FluentCard>
    </div>
  );
};

export default ForgotPassword;
