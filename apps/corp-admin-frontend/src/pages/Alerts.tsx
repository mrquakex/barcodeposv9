import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Plus, CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const Alerts: React.FC = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const response = await api.get('/alerts');
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.patch(`/alerts/${id}`, { status });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Alert güncellendi');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Alert güncellenemedi');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/alerts/${id}`);
    },
    onSuccess: () => {
      toast.success('Alert silindi');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Alert silinemedi');
    },
  });

  const alerts = alertsData?.alerts || [];
  const activeAlerts = alerts.filter((a: any) => a.status === 'active');
  const criticalAlerts = activeAlerts.filter((a: any) => a.severity === 'critical');

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Kritik</Badge>;
      case 'error':
        return <Badge variant="destructive">Hata</Badge>;
      case 'warning':
        return <Badge variant="warning">Uyarı</Badge>;
      default:
        return <Badge variant="secondary">Bilgi</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Uyarılar</h1>
          <p className="text-muted-foreground mt-2">
            Sistem uyarıları ve bildirimler
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Uyarı
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Uyarılar</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Toplam aktif uyarı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kritik Uyarılar</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalAlerts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Acil müdahale gereken</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Uyarı</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Tüm uyarılar</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uyarı Listesi</CardTitle>
          <CardDescription>Tüm sistem uyarıları</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Henüz uyarı yok</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    alert.severity === 'critical' ? 'border-red-500 bg-red-50 dark:bg-red-950' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{alert.message}</span>
                        {getSeverityBadge(alert.severity)}
                        {alert.status === 'active' ? (
                          <Badge variant="outline">Aktif</Badge>
                        ) : (
                          <Badge variant="secondary">Kapatıldı</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {formatDate(alert.createdAt)} • {alert.type}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.status === 'active' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateMutation.mutate({ id: alert.id, status: 'resolved' })}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(alert.id)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateAlertModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </div>
  );
};

function CreateAlertModal({ open, onOpenChange }: any) {
  const [type, setType] = useState('');
  const [severity, setSeverity] = useState('info');
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (alertData: any) => {
      const response = await api.post('/alerts', alertData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Uyarı oluşturuldu');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      onOpenChange(false);
      setType('');
      setSeverity('info');
      setMessage('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Uyarı oluşturulamadı');
    },
  });

  const handleSubmit = () => {
    createMutation.mutate({ type, severity, message });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Uyarı Oluştur</DialogTitle>
          <DialogDescription>Manuel uyarı oluşturun</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tip</Label>
            <Input
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Örn: license_expiring, system_error"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="severity">Önem Seviyesi</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Bilgi</SelectItem>
                <SelectItem value="warning">Uyarı</SelectItem>
                <SelectItem value="error">Hata</SelectItem>
                <SelectItem value="critical">Kritik</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Mesaj</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Uyarı mesajı"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={!type || !message || createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Oluştur
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default Alerts;

