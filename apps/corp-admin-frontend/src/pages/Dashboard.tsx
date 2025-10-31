import React from 'react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Key, Users, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

const Dashboard: React.FC = () => {
  const { data: stats, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive">Veriler yüklenirken bir hata oluştu</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Toplam Tenant',
      value: formatNumber(stats?.totalTenants || 0),
      description: `${stats?.activeTenants || 0} aktif`,
      icon: Building2,
      trend: '+12%',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Aktif Lisanslar',
      value: formatNumber(stats?.activeLicenses || 0),
      description: `${stats?.totalLicenses || 0} toplam`,
      icon: Key,
      trend: '+5%',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Toplam Kullanıcı',
      value: formatNumber(stats?.totalUsers || 0),
      description: 'Tüm tenant\'lar',
      icon: Users,
      trend: '+8%',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Sistem Sağlığı',
      value: `${stats?.systemHealth?.uptime || 0}%`,
      description: `${stats?.systemHealth?.responseTime || 0}ms yanıt süresi`,
      icon: Activity,
      trend: 'Stable',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Sistem genel bakış ve hızlı erişim
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={`${card.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                <div className="flex items-center mt-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  {card.trend}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Son Aktiviteler</CardTitle>
            <CardDescription>Son sistem aktiviteleri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Henüz aktivite yok
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sistem Durumu</CardTitle>
            <CardDescription>Anlık sistem durumu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Durum</span>
                <span className="text-sm font-medium text-green-600">
                  {stats?.systemHealth?.status === 'healthy' ? 'Sağlıklı' : 'Uyarı'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Uptime</span>
                <span className="text-sm font-medium">{stats?.systemHealth?.uptime}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Yanıt Süresi</span>
                <span className="text-sm font-medium">{stats?.systemHealth?.responseTime}ms</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
