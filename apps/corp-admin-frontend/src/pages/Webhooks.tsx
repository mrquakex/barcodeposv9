import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Webhook, Plus, Trash2, TestTube, RefreshCw, Loader2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

const Webhooks: React.FC = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: webhooksData, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const response = await api.get('/webhooks');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (webhookData: any) => {
      const response = await api.post('/webhooks', webhookData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Webhook oluşturuldu');
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Webhook oluşturulamadı');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.patch(`/webhooks/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Webhook güncellendi');
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setEditModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Webhook güncellenemedi');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/webhooks/${id}`);
    },
    onSuccess: () => {
      toast.success('Webhook silindi');
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Webhook silinemedi');
    },
  });

  const testMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/webhooks/${id}/test`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Test webhook gönderildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Test webhook gönderilemedi');
    },
  });

  const webhooks = webhooksData?.webhooks || [];

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
          <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground mt-2">
            Webhook endpoint'leri ve event yönetimi
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Webhook
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Endpoints</CardTitle>
          <CardDescription>Kayıtlı webhook endpoint'leri</CardDescription>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center py-12">
              <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Henüz webhook oluşturulmamış</p>
              <Button onClick={() => setCreateModalOpen(true)} className="mt-4">
                İlk Webhook'u Oluştur
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook: any) => (
                <div key={webhook.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{webhook.url}</div>
                    <div className="flex items-center gap-2 mt-2">
                      {webhook.events?.map((event: string) => (
                        <Badge key={event} variant="outline">{event}</Badge>
                      ))}
                      {webhook.isActive ? (
                        <Badge variant="success">Aktif</Badge>
                      ) : (
                        <Badge variant="destructive">Pasif</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => testMutation.mutate(webhook.id)}
                      disabled={testMutation.isPending}
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedWebhook(webhook);
                        setEditModalOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(webhook.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <WebhookModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />

      {/* Edit Modal */}
      <WebhookModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        webhook={selectedWebhook}
        onSubmit={(data) => {
          if (selectedWebhook) {
            updateMutation.mutate({ id: selectedWebhook.id, data });
          }
        }}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
};

function WebhookModal({ open, onOpenChange, webhook, onSubmit, isLoading }: any) {
  const [url, setUrl] = useState(webhook?.url || '');
  const [secret, setSecret] = useState(webhook?.secret || '');
  const [events, setEvents] = useState<string[]>(webhook?.events || []);
  const [isActive, setIsActive] = useState(webhook?.isActive ?? true);

  React.useEffect(() => {
    if (webhook) {
      setUrl(webhook.url);
      setSecret(webhook.secret);
      setEvents(webhook.events || []);
      setIsActive(webhook.isActive ?? true);
    } else {
      setUrl('');
      setSecret('');
      setEvents([]);
      setIsActive(true);
    }
  }, [webhook, open]);

  const availableEvents = ['tenant.created', 'tenant.updated', 'license.created', 'license.expired', 'user.created'];

  const toggleEvent = (event: string) => {
    if (events.includes(event)) {
      setEvents(events.filter((e) => e !== event));
    } else {
      setEvents([...events, event]);
    }
  };

  const handleSubmit = () => {
    onSubmit({ url, secret, events, isActive });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{webhook ? 'Webhook Düzenle' : 'Yeni Webhook Oluştur'}</DialogTitle>
          <DialogDescription>
            Webhook endpoint'i ve event'leri yapılandırın
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="url">Webhook URL</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/webhook"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secret">Secret (Opsiyonel)</Label>
            <Input
              id="secret"
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Webhook secret key"
            />
          </div>
          <div className="space-y-2">
            <Label>Events</Label>
            <div className="grid grid-cols-2 gap-2">
              {availableEvents.map((event) => (
                <div key={event} className="flex items-center space-x-2">
                  <Checkbox
                    id={event}
                    checked={events.includes(event)}
                    onCheckedChange={() => toggleEvent(event)}
                  />
                  <label htmlFor={event} className="text-sm">{event}</label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked as boolean)}
            />
            <label htmlFor="isActive" className="text-sm">Aktif</label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={!url || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {webhook ? 'Kaydet' : 'Oluştur'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default Webhooks;
