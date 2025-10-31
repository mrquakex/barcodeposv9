import React, { useEffect } from 'react';
import { initializeSocket, onDashboardUpdate, onAlert, disconnectSocket } from '@/lib/socket-client';
import { useDashboardStats, useDashboardActivities } from '@/hooks/useDashboardStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Key, Users, TrendingUp, Activity, AlertCircle, FileText, Clock, Wifi, WifiOff, DollarSign, TrendingDown, Zap, Server } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { formatNumber, formatDate, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const Dashboard: React.FC = () => {
  const { data: stats, isLoading, error, refetch } = useDashboardStats();
  const { data: activities } = useDashboardActivities(5);
  const { admin } = useAuthStore();

  // Get expiring licenses
  const { data: licensesData } = useQuery({
    queryKey: ['licenses', 'expiring'],
    queryFn: async () => {
      const response = await api.get('/licenses', { params: { limit: 1000 } });
      return response.data;
    },
  });

  const expiringLicenses = licensesData?.licenses?.filter((license: any) => {
    if (!license.expiresAt || license.status !== 'ACTIVE') return false;
    const daysUntilExpiry = Math.ceil((new Date(license.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
  }) || [];

  // Get advanced metrics
  const { data: metricsData } = useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      const response = await api.get('/metrics');
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const metrics = metricsData?.metrics;

  // Initialize WebSocket for real-time updates
  useEffect(() => {
    if (admin?.id) {
      try {
        const socket = initializeSocket(admin.id);
        
        const unsubscribeDashboard = onDashboardUpdate((data) => {
          refetch();
        });

        const unsubscribeAlerts = onAlert((alert) => {
          // Handle real-time alerts
        });

        return () => {
          unsubscribeDashboard();
          unsubscribeAlerts();
          disconnectSocket();
        };
      } catch (error) {
        console.warn('WebSocket initialization failed:', error);
      }
    }
  }, [admin?.id, refetch]);

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
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      link: '/tenants',
    },
    {
      title: 'Aktif Lisanslar',
      value: formatNumber(stats?.activeLicenses || 0),
      description: `${stats?.totalLicenses || 0} toplam`,
      icon: Key,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      link: '/licenses',
    },
    {
      title: 'Toplam Kullanıcı',
      value: formatNumber(stats?.totalUsers || 0),
      description: 'Sistemdeki tüm kullanıcılar',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      link: '/users',
    },
    {
      title: 'Yakında Bitecek',
      value: formatNumber(expiringLicenses.length),
      description: '30 gün içinde sona erecek lisanslar',
      icon: Key,
      color: expiringLicenses.length > 0 ? 'text-orange-600' : 'text-gray-600',
      bgColor: expiringLicenses.length > 0 ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-gray-50 dark:bg-gray-900/20',
      link: '/licenses',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Sistem genel bakış ve istatistikler
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Link
              key={index}
              to={card.link || '#'}
              className={card.link ? 'cursor-pointer' : 'cursor-default'}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aylık Tekrar Eden Gelir (MRR)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(parseFloat(metrics.mrr))}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.churnRate}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ortalama Müşteri Yaşam Değeri (CLV)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(parseFloat(metrics.clv))}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sistem Uptime</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.systemUptime}%</div>
              <p className="text-xs text-muted-foreground mt-1">API: {metrics.apiResponseTime}ms • Hata: {metrics.errorRate}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Son Aktiviteler
            </CardTitle>
            <CardDescription>En son sistem aktiviteleri</CardDescription>
          </CardHeader>
          <CardContent>
            {activities?.activities?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Henüz aktivite kaydı yok</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities?.activities?.slice(0, 5).map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="p-1.5 bg-primary/10 rounded">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{activity.admin?.name || activity.admin?.email}</span>
                        <Badge variant="outline" className="text-xs">
                          {activity.action}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {activity.resource} {activity.resourceId ? `#${activity.resourceId}` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <Link to="/audit-logs" className="block text-center text-sm text-primary hover:underline mt-4">
                  Tüm aktiviteleri görüntüle →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Yakında Bitecek Lisanslar
            </CardTitle>
            <CardDescription>Süresi 30 gün içinde dolacak lisanslar</CardDescription>
          </CardHeader>
          <CardContent>
            {expiringLicenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Yakında bitecek lisans yok</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expiringLicenses.slice(0, 5).map((license: any) => {
                  const daysUntilExpiry = Math.ceil((new Date(license.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={license.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{license.tenant?.name || license.tenantId}</span>
                          <Badge variant={daysUntilExpiry <= 7 ? 'destructive' : 'warning'} className="text-xs">
                            {daysUntilExpiry} gün
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDate(license.expiresAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Link to="/licenses" className="block text-center text-sm text-primary hover:underline mt-4">
                  Tümünü görüntüle →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
