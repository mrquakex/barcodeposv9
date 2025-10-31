import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Server, Database, Cpu, HardDrive, Zap, RefreshCw, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';

const SystemHealth: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: systemHealth, isLoading: systemLoading } = useQuery({
    queryKey: ['system-health', refreshKey],
    queryFn: async () => {
      const response = await api.get('/system-health');
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: dbHealth, isLoading: dbLoading } = useQuery({
    queryKey: ['system-health', 'database', refreshKey],
    queryFn: async () => {
      const response = await api.get('/system-health/database');
      return response.data;
    },
    refetchInterval: 30000,
  });

  const getStatusBadge = (status: string, value: number, thresholds?: { warning: number; error: number }) => {
    if (status === 'error' || status === 'disconnected') {
      return <Badge variant="destructive">Hata</Badge>;
    }
    if (thresholds) {
      if (value >= thresholds.error) {
        return <Badge variant="destructive">Kritik</Badge>;
      }
      if (value >= thresholds.warning) {
        return <Badge variant="warning">Uyarı</Badge>;
      }
    }
    return <Badge variant="success">Sağlıklı</Badge>;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${formatNumber(bytes / Math.pow(k, i))} ${sizes[i]}`;
  };

  if (systemLoading || dbLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const cpuUsage = systemHealth?.cpu?.usage || 0;
  const memoryUsage = systemHealth?.memory?.usagePercent || 0;
  const dbStatus = dbHealth?.status === 'connected' ? 'healthy' : 'error';
  const dbResponseTime = dbHealth?.responseTime || 0;

  const healthMetrics = [
    {
      name: 'API Response Time',
      value: `${dbResponseTime}ms`,
      status: dbResponseTime < 100 ? 'healthy' : dbResponseTime < 500 ? 'warning' : 'error',
      icon: Zap,
    },
    {
      name: 'Database',
      value: dbHealth?.status === 'connected' ? 'Bağlı' : 'Bağlantı Hatası',
      status: dbStatus,
      icon: Database,
    },
    {
      name: 'CPU Kullanımı',
      value: `${cpuUsage.toFixed(1)}%`,
      status: cpuUsage < 70 ? 'healthy' : cpuUsage < 90 ? 'warning' : 'error',
      icon: Cpu,
      usage: cpuUsage,
      thresholds: { warning: 70, error: 90 },
    },
    {
      name: 'Bellek Kullanımı',
      value: `${memoryUsage.toFixed(1)}%`,
      status: memoryUsage < 80 ? 'healthy' : memoryUsage < 90 ? 'warning' : 'error',
      icon: HardDrive,
      usage: memoryUsage,
      thresholds: { warning: 80, error: 90 },
      details: `${formatBytes(systemHealth?.memory?.used || 0)} / ${formatBytes(systemHealth?.memory?.total || 0)}`,
    },
    {
      name: 'Disk Kullanımı',
      value: 'N/A',
      status: 'healthy',
      icon: Server,
    },
    {
      name: 'Uptime',
      value: systemHealth?.uptime?.formatted || 'N/A',
      status: 'healthy',
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sistem Sağlığı</h1>
          <p className="text-muted-foreground mt-2">
            Anlık sistem metrikleri ve sağlık durumu
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setRefreshKey((k) => k + 1)}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {healthMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                {metric.details && (
                  <div className="text-xs text-muted-foreground mt-1">{metric.details}</div>
                )}
                <div className="mt-2">
                  {getStatusBadge(metric.status, metric.usage || 0, metric.thresholds)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Servis Durumu</CardTitle>
          <CardDescription>Tüm sistem servislerinin durumu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">API Backend</span>
              <Badge variant="success">Çalışıyor</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Frontend</span>
              <Badge variant="success">Çalışıyor</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              {dbHealth?.status === 'connected' ? (
                <Badge variant="success">Bağlı ({dbResponseTime}ms)</Badge>
              ) : (
                <Badge variant="destructive">Bağlantı Hatası</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Platform</span>
              <span className="text-sm text-muted-foreground">
                {systemHealth?.platform} - {systemHealth?.hostname}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemHealth;
