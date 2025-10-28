import React, { useState, useEffect } from 'react';
import { Store, User, Bell, Shield, Globe, Banknote, Save } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentButton from '../components/fluent/FluentButton';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface Settings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  currency: string;
  locale: string;
  timezone: string;
  receiptFooter: string;
}

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Settings>({
    storeName: '',
    storeAddress: '',
    storePhone: '',
    storeEmail: '',
    currency: 'TRY',
    locale: 'tr-TR',
    timezone: 'Europe/Istanbul',
    receiptFooter: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(response.data.settings || response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put('/settings', settings);
      toast.success(t('settings.settingsSaved'));
    } catch (error) {
      toast.error(t('settings.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground-secondary">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 fluent-mica">
      {/* 🎨 Modern Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{t('settings.title')}</h1>
          <p className="text-base text-foreground-secondary">
            {t('settings.manageSettings') || 'Mağaza ayarlarınızı yönetin'}
          </p>
        </div>
        <FluentButton
          appearance="primary"
          icon={<Save className="w-4 h-4" />}
          onClick={handleSave}
          loading={isSaving}
        >
          {t('settings.saveSettings')}
        </FluentButton>
      </div>

      {/* Store Information */}
      <FluentCard depth="depth-4" className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Store className="w-5 h-5 text-primary" />
          <h3 className="fluent-heading text-foreground">{t('settings.storeSettings')}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FluentInput
            label={t('settings.storeName')}
            value={settings.storeName}
            onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
          />
          <FluentInput
            label={t('settings.storeEmail')}
            type="email"
            value={settings.storeEmail}
            onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
          />
          <FluentInput
            label={t('settings.storePhone')}
            value={settings.storePhone}
            onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
          />
          <FluentInput
            label={t('settings.currency')}
            value={settings.currency}
            onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
          />
          <div className="md:col-span-2">
            <label className="fluent-body-small text-foreground-secondary block mb-2">
              {t('customers.address')}
            </label>
            <textarea
              value={settings.storeAddress}
              onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-input border border-border rounded text-foreground fluent-body focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>
      </FluentCard>

      {/* Localization */}
      <FluentCard depth="depth-4" className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-primary" />
          <h3 className="fluent-heading text-foreground">{t('settings.localization') || 'Yerelleştirme'}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="fluent-body-small text-foreground-secondary block mb-2">
              {t('settings.locale')}
            </label>
            <select
              value={settings.locale}
              onChange={(e) => setSettings({ ...settings, locale: e.target.value })}
              className="w-full h-10 px-3 bg-input border border-border rounded text-foreground fluent-body focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="tr-TR">Turkish (TR)</option>
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
            </select>
          </div>
          <div>
            <label className="fluent-body-small text-foreground-secondary block mb-2">
              {t('settings.timezone')}
            </label>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full h-10 px-3 bg-input border border-border rounded text-foreground fluent-body focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Europe/Istanbul">İstanbul</option>
              <option value="Europe/London">Londra</option>
              <option value="America/New_York">New York</option>
            </select>
          </div>
        </div>
      </FluentCard>

      {/* Receipt */}
      <FluentCard depth="depth-4" className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Banknote className="w-5 h-5 text-primary" />
          <h3 className="fluent-heading text-foreground">{t('settings.receiptSettings') || 'Fiş Ayarları'}</h3>
        </div>
        <div>
          <label className="fluent-body-small text-foreground-secondary block mb-2">
            {t('settings.receiptFooter')}
          </label>
          <textarea
            value={settings.receiptFooter}
            onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-input border border-border rounded text-foreground fluent-body focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder={t('settings.receiptFooterPlaceholder') || 'Alışverişiniz için teşekkürler...'}
          />
        </div>
      </FluentCard>
    </div>
  );
};

export default Settings;

