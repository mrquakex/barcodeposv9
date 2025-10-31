import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Server, Database, Cpu, HardDrive, Zap } from 'lucide-react';

const SystemHealth: React.FC = () => {
  const healthMetrics = [
    { name: 'API Response Time', value: '120ms', status: 'healthy', icon: Zap },
    { name: 'Database', value: 'Connected', status: 'healthy', icon: Database },
    { name: 'CPU Usage', value: '45%', status: 'healthy', icon: Cpu },
    { name: 'Memory Usage', value: '62%', status: 'warning', icon: HardDrive },
    { name: 'Disk Usage', value: '38%', status: 'healthy', icon: Server },
    { name: 'Uptime', value: '99.9%', status: 'healthy', icon: Activity },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="success">Sağlıklı</Badge>;
      case 'warning':
        return <Badge variant="warning">Uyarı</Badge>;
      case 'error':
        return <Badge variant="destructive">Hata</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sistem Sağlığı</h1>
        <p className="text-muted-foreground mt-2">
          Anlık sistem metrikleri ve sağlık durumu
        </p>
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
                <div className="mt-2">{getStatusBadge(metric.status)}</div>
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
              <Badge variant="success">Bağlı</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Redis Cache</span>
              <Badge variant="secondary">Yakında</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemHealth;

