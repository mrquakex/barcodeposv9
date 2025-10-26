import React, { useState, useEffect } from 'react';
import { Store, User, Bell, Shield, Globe, DollarSign, Save } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentButton from '../components/fluent/FluentButton';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

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
      setSettings(response.data);
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
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
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
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="fluent-title text-foreground">Settings</h1>
          <p className="fluent-body text-foreground-secondary mt-1">
            Manage your store settings
          </p>
        </div>
        <FluentButton
          appearance="primary"
          icon={<Save className="w-4 h-4" />}
          onClick={handleSave}
          isLoading={isSaving}
        >
          Save Changes
        </FluentButton>
      </div>

      {/* Store Information */}
      <FluentCard depth="depth-4" className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Store className="w-5 h-5 text-primary" />
          <h3 className="fluent-heading text-foreground">Store Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FluentInput
            label="Store Name"
            value={settings.storeName}
            onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
          />
          <FluentInput
            label="Email"
            type="email"
            value={settings.storeEmail}
            onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
          />
          <FluentInput
            label="Phone"
            value={settings.storePhone}
            onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
          />
          <FluentInput
            label="Currency"
            value={settings.currency}
            onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
          />
          <div className="md:col-span-2">
            <label className="fluent-body-small text-foreground-secondary block mb-2">
              Address
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
          <h3 className="fluent-heading text-foreground">Localization</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="fluent-body-small text-foreground-secondary block mb-2">
              Locale
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
              Timezone
            </label>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full h-10 px-3 bg-input border border-border rounded text-foreground fluent-body focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Europe/Istanbul">Istanbul</option>
              <option value="Europe/London">London</option>
              <option value="America/New_York">New York</option>
            </select>
          </div>
        </div>
      </FluentCard>

      {/* Receipt */}
      <FluentCard depth="depth-4" className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-primary" />
          <h3 className="fluent-heading text-foreground">Receipt Settings</h3>
        </div>
        <div>
          <label className="fluent-body-small text-foreground-secondary block mb-2">
            Receipt Footer
          </label>
          <textarea
            value={settings.receiptFooter}
            onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-input border border-border rounded text-foreground fluent-body focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Thank you for your business..."
          />
        </div>
      </FluentCard>
    </div>
  );
};

export default Settings;

