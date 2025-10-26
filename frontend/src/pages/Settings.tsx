import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import { Settings as SettingsType } from '../types';
import api from '../lib/api';
import { Save, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

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
      toast.success('✓ Ayarlar başarıyla kaydedildi!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ayarlar kaydedilemedi');
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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-slate-700 bg-clip-text text-transparent">Ayarlar</h1>
        <p className="text-muted-foreground mt-2 font-semibold">Sistem ayarlarını yönetin</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-2 border-blue-400 dark:border-blue-900 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-b-2">
            <CardTitle className="flex items-center gap-3 text-xl font-black text-slate-900 dark:text-white">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center shadow-md">
                <Store className="w-5 h-5 text-white" />
              </div>
              Market Bilgileri
            </CardTitle>
            <CardDescription className="font-semibold">
              Market için temel bilgiler
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="storeName" className="font-semibold">Market Adı</Label>
                <Input
                  id="storeName"
                  value={settings.storeName}
                  onChange={(e) => handleChange('storeName', e.target.value)}
                  required
                  className="h-11"
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
          <Button type="submit" disabled={saving} className="h-12 px-6 font-bold bg-gradient-to-r from-blue-600 to-slate-700 hover:from-blue-500 hover:to-slate-600 shadow-lg">
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Settings;


