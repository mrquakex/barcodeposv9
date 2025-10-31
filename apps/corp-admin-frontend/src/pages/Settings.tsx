import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Settings as SettingsIcon, Shield, Key, Bell, Server, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';

const Settings: React.FC = () => {
  const { data: generalData } = useSettings('general');
  const { data: securityData } = useSettings('security');
  const { data: licenseData } = useSettings('license');
  const { data: notificationData } = useSettings('notifications');
  const { data: systemData } = useSettings('system');

  const updateGeneral = useUpdateSettings();
  const updateSecurity = useUpdateSettings();
  const updateLicense = useUpdateSettings();
  const updateNotifications = useUpdateSettings();
  const updateSystem = useUpdateSettings();

  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'BarcodePOS Control Plane',
    siteUrl: 'https://admin.barcodepos.trade',
    timezone: 'Europe/Istanbul',
    language: 'tr',
  });

  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    sessionTimeout: 30,
    mfaRequired: false,
    ipWhitelistEnabled: false,
  });

  const [licenseSettings, setLicenseSettings] = useState({
    defaultPlan: 'STANDARD',
    trialDays: 14,
    autoRenewal: false,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailEnabled: true,
    emailSmtpHost: '',
    emailSmtpPort: 587,
    emailFrom: '',
    notificationsEnabled: true,
  });

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    cacheEnabled: true,
    debugMode: false,
  });

  useEffect(() => {
    if (generalData?.settings) setGeneralSettings(generalData.settings);
    if (securityData?.settings) setSecuritySettings(securityData.settings);
    if (licenseData?.settings) setLicenseSettings(licenseData.settings);
    if (notificationData?.settings) setNotificationSettings(notificationData.settings);
    if (systemData?.settings) setSystemSettings(systemData.settings);
  }, [generalData, securityData, licenseData, notificationData, systemData]);

  const handleSaveGeneral = () => {
    updateGeneral.mutate(
      { category: 'general', settings: generalSettings },
      {
        onSuccess: () => toast.success('Genel ayarlar kaydedildi'),
        onError: () => toast.error('Ayarlar kaydedilemedi'),
      }
    );
  };

  const handleSaveSecurity = () => {
    updateSecurity.mutate(
      { category: 'security', settings: securitySettings },
      {
        onSuccess: () => toast.success('Güvenlik ayarları kaydedildi'),
        onError: () => toast.error('Ayarlar kaydedilemedi'),
      }
    );
  };

  const handleSaveLicense = () => {
    updateLicense.mutate(
      { category: 'license', settings: licenseSettings },
      {
        onSuccess: () => toast.success('Lisans ayarları kaydedildi'),
        onError: () => toast.error('Ayarlar kaydedilemedi'),
      }
    );
  };

  const handleSaveNotifications = () => {
    updateNotifications.mutate(
      { category: 'notifications', settings: notificationSettings },
      {
        onSuccess: () => toast.success('Bildirim ayarları kaydedildi'),
        onError: () => toast.error('Ayarlar kaydedilemedi'),
      }
    );
  };

  const handleSaveSystem = () => {
    updateSystem.mutate(
      { category: 'system', settings: systemSettings },
      {
        onSuccess: () => toast.success('Sistem ayarları kaydedildi'),
        onError: () => toast.error('Ayarlar kaydedilemedi'),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-muted-foreground mt-2">
          Sistem yapılandırması ve güvenlik ayarları
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <SettingsIcon className="h-4 w-4 mr-2" />
            Genel
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Güvenlik
          </TabsTrigger>
          <TabsTrigger value="licenses">
            <Key className="h-4 w-4 mr-2" />
            Lisans
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Bildirimler
          </TabsTrigger>
          <TabsTrigger value="system">
            <Server className="h-4 w-4 mr-2" />
            Sistem
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Genel Ayarlar</CardTitle>
              <CardDescription>Sistem genel yapılandırması</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Adı</Label>
                <Input
                  id="siteName"
                  value={generalSettings.siteName}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteUrl">Site URL</Label>
                <Input
                  id="siteUrl"
                  type="url"
                  value={generalSettings.siteUrl}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, siteUrl: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Saat Dilimi</Label>
                <Select
                  value={generalSettings.timezone}
                  onValueChange={(value) => setGeneralSettings({ ...generalSettings, timezone: value })}
                >
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Istanbul">Istanbul (UTC+3)</SelectItem>
                    <SelectItem value="UTC">UTC (UTC+0)</SelectItem>
                    <SelectItem value="America/New_York">New York (UTC-5)</SelectItem>
                    <SelectItem value="Europe/London">London (UTC+0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Dil</Label>
                <Select
                  value={generalSettings.language}
                  onValueChange={(value) => setGeneralSettings({ ...generalSettings, language: value })}
                >
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tr">Türkçe</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveGeneral} disabled={updateGeneral.isPending}>
                {updateGeneral.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Güvenlik Ayarları</CardTitle>
              <CardDescription>Şifre politikası, MFA, IP kısıtlamaları</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Şifre Politikası</h3>
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Minimum Şifre Uzunluğu</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min="6"
                    max="32"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: parseInt(e.target.value) || 8 })}
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Büyük Harf Gereksinimi</Label>
                      <p className="text-sm text-muted-foreground">Şifrede en az bir büyük harf olmalı</p>
                    </div>
                    <Switch
                      checked={securitySettings.passwordRequireUppercase}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, passwordRequireUppercase: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Küçük Harf Gereksinimi</Label>
                      <p className="text-sm text-muted-foreground">Şifrede en az bir küçük harf olmalı</p>
                    </div>
                    <Switch
                      checked={securitySettings.passwordRequireLowercase}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, passwordRequireLowercase: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sayı Gereksinimi</Label>
                      <p className="text-sm text-muted-foreground">Şifrede en az bir sayı olmalı</p>
                    </div>
                    <Switch
                      checked={securitySettings.passwordRequireNumbers}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, passwordRequireNumbers: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Özel Karakter Gereksinimi</Label>
                      <p className="text-sm text-muted-foreground">Şifrede en az bir özel karakter olmalı</p>
                    </div>
                    <Switch
                      checked={securitySettings.passwordRequireSpecialChars}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, passwordRequireSpecialChars: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Oturum Yönetimi</h3>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Oturum Timeout (dakika)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="5"
                    max="1440"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) || 30 })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">MFA (Multi-Factor Authentication)</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>MFA Zorunlu</Label>
                    <p className="text-sm text-muted-foreground">Tüm kullanıcılar için MFA zorunlu olsun</p>
                  </div>
                  <Switch
                    checked={securitySettings.mfaRequired}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, mfaRequired: checked })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">IP Whitelist</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>IP Whitelist Aktif</Label>
                    <p className="text-sm text-muted-foreground">Sadece izin verilen IP adreslerinden erişim</p>
                  </div>
                  <Switch
                    checked={securitySettings.ipWhitelistEnabled}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, ipWhitelistEnabled: checked })}
                  />
                </div>
              </div>

              <Button onClick={handleSaveSecurity} disabled={updateSecurity.isPending}>
                {updateSecurity.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="licenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lisans Ayarları</CardTitle>
              <CardDescription>Varsayılan planlar ve fiyatlandırma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultPlan">Varsayılan Plan</Label>
                <Select
                  value={licenseSettings.defaultPlan}
                  onValueChange={(value) => setLicenseSettings({ ...licenseSettings, defaultPlan: value })}
                >
                  <SelectTrigger id="defaultPlan">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="trialDays">Deneme Süresi (gün)</Label>
                <Input
                  id="trialDays"
                  type="number"
                  min="0"
                  max="365"
                  value={licenseSettings.trialDays}
                  onChange={(e) => setLicenseSettings({ ...licenseSettings, trialDays: parseInt(e.target.value) || 14 })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Otomatik Yenileme</Label>
                  <p className="text-sm text-muted-foreground">Lisanslar otomatik olarak yenilensin</p>
                </div>
                <Switch
                  checked={licenseSettings.autoRenewal}
                  onCheckedChange={(checked) => setLicenseSettings({ ...licenseSettings, autoRenewal: checked })}
                />
              </div>
              <Button onClick={handleSaveLicense} disabled={updateLicense.isPending}>
                {updateLicense.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bildirim Ayarları</CardTitle>
              <CardDescription>E-posta ve sistem bildirimleri</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>E-posta Bildirimleri</Label>
                  <p className="text-sm text-muted-foreground">E-posta bildirimleri gönderilsin</p>
                </div>
                <Switch
                  checked={notificationSettings.emailEnabled}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailEnabled: checked })}
                />
              </div>
              {notificationSettings.emailEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="emailSmtpHost">SMTP Sunucusu</Label>
                    <Input
                      id="emailSmtpHost"
                      placeholder="smtp.example.com"
                      value={notificationSettings.emailSmtpHost}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, emailSmtpHost: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailSmtpPort">SMTP Port</Label>
                    <Input
                      id="emailSmtpPort"
                      type="number"
                      value={notificationSettings.emailSmtpPort}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, emailSmtpPort: parseInt(e.target.value) || 587 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailFrom">Gönderen E-posta</Label>
                    <Input
                      id="emailFrom"
                      type="email"
                      placeholder="noreply@example.com"
                      value={notificationSettings.emailFrom}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, emailFrom: e.target.value })}
                    />
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sistem Bildirimleri</Label>
                  <p className="text-sm text-muted-foreground">Sistem içi bildirimler gösterilsin</p>
                </div>
                <Switch
                  checked={notificationSettings.notificationsEnabled}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, notificationsEnabled: checked })}
                />
              </div>
              <Button onClick={handleSaveNotifications} disabled={updateNotifications.isPending}>
                {updateNotifications.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sistem Ayarları</CardTitle>
              <CardDescription>Sistem genel yapılandırması</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Bakım Modu</Label>
                  <p className="text-sm text-muted-foreground">Sistem bakım modunda olsun</p>
                </div>
                <Switch
                  checked={systemSettings.maintenanceMode}
                  onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, maintenanceMode: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cache Aktif</Label>
                  <p className="text-sm text-muted-foreground">Veriler cache'lensin</p>
                </div>
                <Switch
                  checked={systemSettings.cacheEnabled}
                  onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, cacheEnabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Debug Modu</Label>
                  <p className="text-sm text-muted-foreground">Geliştirme için debug logları aktif olsun</p>
                </div>
                <Switch
                  checked={systemSettings.debugMode}
                  onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, debugMode: checked })}
                />
              </div>
              <Button onClick={handleSaveSystem} disabled={updateSystem.isPending}>
                {updateSystem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
