import React, { useState } from 'react';
import { 
  Smartphone, Download, CheckCircle, Zap, Shield, Wifi, 
  Clock, BarChart3, Package, ShoppingCart, Users, Star,
  AlertCircle, ExternalLink, RefreshCw, PlayCircle
} from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentButton from '../components/fluent/FluentButton';
import FluentBadge from '../components/fluent/FluentBadge';

const DownloadAPK: React.FC = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    setIsDownloading(true);
    // HTTPS domain link (Cloudflare allows <100MB files)
    const apkUrl = 'https://barcodepos.trade/apk/BarcodePOS_WebUpdated.apk';
    const link = document.createElement('a');
    link.href = apkUrl;
    link.download = 'BarcodePOS_WebUpdated.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      setIsDownloading(false);
    }, 3000);
  };

  const features = [
    {
      icon: BarChart3,
      title: 'Stok Yönetimi',
      description: 'Ultra enterprise stok takibi, ABC analizi, stok uyarıları',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: ShoppingCart,
      title: 'Hızlı POS',
      description: 'Barkod okuma, indirim, iade, çoklu ödeme, offline satış',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Users,
      title: 'Müşteri Takibi',
      description: 'Borç yönetimi, hızlı iletişim, satış geçmişi',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: Package,
      title: 'Ürün Detayları',
      description: '6 tab, KPI kartları, grafikler, varyant yönetimi',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: Wifi,
      title: 'Offline Çalışma',
      description: 'İnternet olmadan satış, otomatik senkronizasyon',
      gradient: 'from-indigo-500 to-blue-500'
    },
    {
      icon: Shield,
      title: 'Güvenli & Hızlı',
      description: 'Biometric auth, dark mode, haptic feedback',
      gradient: 'from-violet-500 to-purple-500'
    }
  ];

  const updates = [
    'Stok Yönetimi Ultra Enterprise Özellikler',
    'Ürün Detay Sayfası (6 Tab, KPI, Grafikler)',
    'Stok Uyarıları Dashboard',
    'Gelişmiş Stok Hareketleri',
    'Stok Sayım Upgrade',
    'ABC Analizi ile Stok Değerleme',
    'Microsoft Fluent Design uyumlu arayüz',
    'Biometric Authentication',
    'Push Notifications',
    'Network Status Monitoring'
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
            <Smartphone className="w-7 h-7 text-primary" />
            Mobil Uygulama İndir
          </h1>
          <p className="text-foreground-secondary mt-1">
            BarcodePOS PRO - Android telefonunuzdan işletmenizi yönetin
          </p>
        </div>
      </div>

      {/* Download Card */}
      <FluentCard depth="depth-8" className="p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* APK Icon */}
          <div className="shrink-0">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Smartphone className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              BarcodePOS PRO - Mobil Uygulama
            </h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
              <FluentBadge appearance="info">
                <Star className="w-3.5 h-3.5 mr-1" />
                v2.0 Web Entegrasyonlu
              </FluentBadge>
              <FluentBadge appearance="default">
                <Download className="w-3.5 h-3.5 mr-1" />
                93 MB
              </FluentBadge>
              <FluentBadge appearance="default">
                <Clock className="w-3.5 h-3.5 mr-1" />
                30 Ekim 2025
              </FluentBadge>
            </div>
            <p className="text-foreground-secondary text-sm mb-4">
              Profesyonel stok ve satış yönetim sisteminiz artık cebinizde! 
              Android telefonunuzdan tüm işlemlerinizi hızlıca yönetin.
            </p>
            <FluentButton
              size="large"
              onClick={handleDownload}
              disabled={isDownloading}
              icon={isDownloading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              className="font-semibold"
            >
              {isDownloading ? 'İndiriliyor...' : 'APK İndir (93 MB)'}
            </FluentButton>
          </div>
        </div>
      </FluentCard>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FluentCard depth="depth-8" className="p-5 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
          <p className="text-2xl font-bold text-foreground mb-1">100%</p>
          <p className="text-sm text-foreground-secondary">Hızlı & Güvenilir</p>
        </FluentCard>

        <FluentCard depth="depth-8" className="p-5 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-success/10 text-success rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <p className="text-2xl font-bold text-foreground mb-1">50+</p>
          <p className="text-sm text-foreground-secondary">Özellik</p>
        </FluentCard>

        <FluentCard depth="depth-8" className="p-5 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-warning/10 text-warning rounded-xl flex items-center justify-center">
            <Wifi className="w-6 h-6" />
          </div>
          <p className="text-2xl font-bold text-foreground mb-1">Offline</p>
          <p className="text-sm text-foreground-secondary">Çalışma Desteği</p>
        </FluentCard>

        <FluentCard depth="depth-8" className="p-5 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-info/10 text-info rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <p className="text-2xl font-bold text-foreground mb-1">Güvenli</p>
          <p className="text-sm text-foreground-secondary">Biometric Auth</p>
        </FluentCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Features */}
        <FluentCard depth="depth-4" className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Özellikler
          </h2>
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 rounded-lg bg-background-alt hover:bg-background-hover transition-colors border border-border/50"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br ${feature.gradient}`}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-foreground-secondary">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </FluentCard>

        {/* Updates */}
        <FluentCard depth="depth-4" className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-success" />
            Bu Sürümdeki Yenilikler
          </h2>
          <div className="space-y-2">
            {updates.map((update, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-background-alt transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <p className="text-sm text-foreground">{update}</p>
              </div>
            ))}
          </div>
        </FluentCard>
      </div>

      {/* Installation Guide */}
      <FluentCard depth="depth-4" className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-info" />
          Kurulum Adımları
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-background-alt border border-border/50">
            <div className="w-8 h-8 shrink-0 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">APK'yı İndir</h3>
              <p className="text-sm text-foreground-secondary">
                Yukarıdaki butona tıklayın
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-background-alt border border-border/50">
            <div className="w-8 h-8 shrink-0 bg-warning/10 text-warning rounded-lg flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">İzin Verin</h3>
              <p className="text-sm text-foreground-secondary">
                Bilinmeyen kaynaklar için izin
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-background-alt border border-border/50">
            <div className="w-8 h-8 shrink-0 bg-success/10 text-success rounded-lg flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">Kurun</h3>
              <p className="text-sm text-foreground-secondary">
                APK'yı açın ve kurun
              </p>
            </div>
          </div>
        </div>
      </FluentCard>

      {/* System Requirements */}
      <FluentCard depth="depth-4" className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Sistem Gereksinimleri
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 p-3 bg-background-alt rounded-lg border border-border/50">
            <CheckCircle className="w-4 h-4 text-success shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Android 7.0+</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-background-alt rounded-lg border border-border/50">
            <CheckCircle className="w-4 h-4 text-success shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">2GB RAM</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-background-alt rounded-lg border border-border/50">
            <CheckCircle className="w-4 h-4 text-success shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">100MB Alan</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-background-alt rounded-lg border border-border/50">
            <CheckCircle className="w-4 h-4 text-success shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Kamera</p>
            </div>
          </div>
        </div>
      </FluentCard>
    </div>
  );
};

export default DownloadAPK;

