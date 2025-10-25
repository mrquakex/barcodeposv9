import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import { Settings as SettingsType } from '../types';
import api from '../lib/api';
import { Save, Store } from 'lucide-react';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(response.data.settings);
    } catch (error) {
      console.error('Settings fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      await api.put('/settings', settings);
      alert('Ayarlar başarıyla kaydedildi');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ayarlar kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof SettingsType, value: string) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Ayarlar yüklenemedi</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Ayarlar</h1>
        <p className="text-muted-foreground mt-1">Sistem ayarlarını yönetin</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Market Bilgileri
            </CardTitle>
            <CardDescription>
              Market için temel bilgiler
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="storeName">Market Adı</Label>
                <Input
                  id="storeName"
                  value={settings.storeName}
                  onChange={(e) => handleChange('storeName', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storePhone">Telefon</Label>
                <Input
                  id="storePhone"
                  type="tel"
                  value={settings.storePhone || ''}
                  onChange={(e) => handleChange('storePhone', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeAddress">Adres</Label>
              <Input
                id="storeAddress"
                value={settings.storeAddress || ''}
                onChange={(e) => handleChange('storeAddress', e.target.value)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="storeEmail">Email</Label>
                <Input
                  id="storeEmail"
                  type="email"
                  value={settings.storeEmail || ''}
                  onChange={(e) => handleChange('storeEmail', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeTax">Vergi No</Label>
                <Input
                  id="storeTax"
                  value={settings.storeTax || ''}
                  onChange={(e) => handleChange('storeTax', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fiş Ayarları</CardTitle>
            <CardDescription>
              Fiş altı mesajı ve görünüm ayarları
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="receiptFooter">Fiş Altı Mesajı</Label>
              <Input
                id="receiptFooter"
                placeholder="Örn: Alışverişiniz için teşekkür ederiz!"
                value={settings.receiptFooter || ''}
                onChange={(e) => handleChange('receiptFooter', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Para Birimi</Label>
              <Input
                id="currency"
                value={settings.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Settings;

