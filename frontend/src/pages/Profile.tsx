import React, { useState } from 'react';
import { User, Mail, Lock, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentButton from '../components/fluent/FluentButton';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      await api.put('/users/profile', { name: formData.name, email: formData.email });
      toast.success(t('profile.profileUpdated'));
    } catch (error) {
      toast.error(t('profile.updateError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error(t('profile.passwordMismatch') || 'Şifreler eşleşmiyor');
      return;
    }
    setIsSaving(true);
    try {
      await api.put('/users/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast.success(t('profile.passwordChanged'));
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(t('profile.passwordChangeError') || 'Şifre değiştirilemedi');
    } finally {
      setIsSaving(false);
    }
  };

  // Trial badge calculation
  const trialEnds = user?.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const now = new Date();
  const trialActive = trialEnds ? trialEnds > now : false;
  const remainingDays = trialActive
    ? Math.max(0, Math.ceil((trialEnds!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="fluent-title text-foreground">{t('profile.title')}</h1>
        <p className="fluent-body text-foreground-secondary mt-1">{t('profile.manageSettings') || 'Hesap ayarlarınızı yönetin'}</p>
        {trialActive && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 bg-primary/10 border border-primary/30">
            <span className="text-xs font-semibold text-primary">Deneme Sürümü</span>
            <span className="text-xs text-foreground-secondary">{remainingDays} gün kaldı</span>
          </div>
        )}
      </div>

      <FluentCard depth="depth-4" className="p-6">
        <h3 className="fluent-heading text-foreground mb-4">{t('profile.personalInfo')}</h3>
        <div className="space-y-4">
          <FluentInput
            label={t('common.name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            icon={<User className="w-4 h-4" />}
          />
          <FluentInput
            label={t('customers.email')}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            icon={<Mail className="w-4 h-4" />}
          />
          <FluentButton
            appearance="primary"
            icon={<Save className="w-4 h-4" />}
            onClick={handleUpdateProfile}
            loading={isSaving}
          >
            {t('profile.saveChanges') || 'Değişiklikleri Kaydet'}
          </FluentButton>
        </div>
      </FluentCard>

      <FluentCard depth="depth-4" className="p-6">
        <h3 className="fluent-heading text-foreground mb-4">{t('profile.changePassword')}</h3>
        <div className="space-y-4">
          <FluentInput
            label={t('profile.currentPassword')}
            type="password"
            value={formData.currentPassword}
            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            icon={<Lock className="w-4 h-4" />}
          />
          <FluentInput
            label={t('profile.newPassword')}
            type="password"
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            icon={<Lock className="w-4 h-4" />}
          />
          <FluentInput
            label={t('profile.confirmPassword')}
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            icon={<Lock className="w-4 h-4" />}
          />
          <FluentButton
            appearance="primary"
            icon={<Save className="w-4 h-4" />}
            onClick={handleChangePassword}
            loading={isSaving}
          >
            {t('profile.changePassword')}
          </FluentButton>
        </div>
      </FluentCard>

      <FluentCard depth="depth-4" className="p-6">
        <h3 className="fluent-heading text-foreground mb-4">Account Information</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-foreground-secondary">{t('userManagement.role')}</span>
            <span className="text-foreground font-medium">{user?.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground-secondary">{t('profile.accountStatus') || 'Hesap Durumu'}</span>
            <span className="text-success font-medium">{t('common.active')}</span>
          </div>
        </div>
      </FluentCard>
    </div>
  );
};

export default Profile;

