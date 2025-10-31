import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Shield, Key, Bell, Server } from 'lucide-react';

const Settings: React.FC = () => {
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
              <div className="text-sm text-muted-foreground">
                Genel ayarlar yakında eklenecek
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Güvenlik Ayarları</CardTitle>
              <CardDescription>Şifre politikası, MFA, IP kısıtlamaları</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Güvenlik ayarları yakında eklenecek
              </div>
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
              <div className="text-sm text-muted-foreground">
                Lisans ayarları yakında eklenecek
              </div>
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
              <div className="text-sm text-muted-foreground">
                Bildirim ayarları yakında eklenecek
              </div>
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
              <div className="text-sm text-muted-foreground">
                Sistem ayarları yakında eklenecek
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;

