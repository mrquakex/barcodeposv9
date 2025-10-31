import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertTriangle, Zap, Clock, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

const Monitoring: React.FC = () => {
  const { data: monitoringData, isLoading } = useQuery({
    queryKey: ['monitoring'],
    queryFn: async () => {
      const response = await api.get('/monitoring');
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: errorStats } = useQuery({
    queryKey: ['monitoring', 'errors'],
    queryFn: async () => {
      const response = await api.get('/monitoring/errors');
      return response.data;
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const performance = monitoringData?.performance || {};
  const webVitals = monitoringData?.webVitals || {};
  const recentErrors = monitoringData?.errors?.slice(-10) || [];
  const stats = errorStats?.stats || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Monitoring</h1>
        <p className="text-muted-foreground mt-2">
          Sistem performansı, hata takibi ve web vitals
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Yanıt Süresi</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.averageResponseTime || 0}ms</div>
            <p className="text-xs text-muted-foreground mt-1">API yanıt süresi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hata Oranı</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.errorRate || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">Başarısız istekler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LCP</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{webVitals.LCP || 0}ms</div>
            <p className="text-xs text-muted-foreground mt-1">Largest Contentful Paint</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">FID</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{webVitals.FID || 0}ms</div>
            <p className="text-xs text-muted-foreground mt-1">First Input Delay</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hata İstatistikleri</CardTitle>
            <CardDescription>Hata logları ve dağılımı</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Toplam Hata</span>
                <Badge variant="destructive">{stats.total || 0}</Badge>
              </div>
              {stats.bySeverity && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Kritik</span>
                    <Badge variant="destructive">{stats.bySeverity.critical || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Yüksek</span>
                    <Badge variant="destructive">{stats.bySeverity.high || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Orta</span>
                    <Badge variant="warning">{stats.bySeverity.medium || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Düşük</span>
                    <Badge variant="secondary">{stats.bySeverity.low || 0}</Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Web Vitals</CardTitle>
            <CardDescription>Core Web Vitals metrikleri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">LCP</span>
                <span className="text-sm">{webVitals.LCP || 0}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">FID</span>
                <span className="text-sm">{webVitals.FID || 0}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CLS</span>
                <span className="text-sm">{webVitals.CLS || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">FCP</span>
                <span className="text-sm">{webVitals.FCP || 0}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">TTFB</span>
                <span className="text-sm">{webVitals.TTFB || 0}ms</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Son Hatalar</CardTitle>
          <CardDescription>En son sistem hataları</CardDescription>
        </CardHeader>
        <CardContent>
          {recentErrors.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Henüz hata kaydı yok</p>
          ) : (
            <div className="space-y-2">
              {recentErrors.map((error: any, idx: number) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{error.message}</span>
                    <Badge variant={error.severity === 'critical' ? 'destructive' : 'warning'}>
                      {error.severity}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(error.timestamp)}
                  </div>
                  {error.context && (
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                      {JSON.stringify(error.context, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Monitoring;

