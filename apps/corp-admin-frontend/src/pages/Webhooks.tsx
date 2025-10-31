import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Webhook, Plus, Trash2, TestTube, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const Webhooks: React.FC = () => {
  const [webhooks, setWebhooks] = useState<any[]>([]);

  const handleCreate = () => {
    toast.info('Webhook oluşturma yakında eklenecek');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground mt-2">
            Webhook endpoint'leri ve event yönetimi
          </p>
        </div>
        <Button onClick={handleCreate}>
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
              <Button onClick={handleCreate} className="mt-4">
                İlk Webhook'u Oluştur
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{webhook.url}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Events: {webhook.events?.join(', ') || 'None'}
                    </div>
                    <div className="mt-2">
                      <Badge variant={webhook.active ? 'success' : 'secondary'}>
                        {webhook.active ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="icon" title="Test">
                      <TestTube className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Yenile">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Webhooks;

