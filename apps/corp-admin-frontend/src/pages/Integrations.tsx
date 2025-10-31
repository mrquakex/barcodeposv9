import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Trash2, TestTube, Loader2, Plug, Key } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
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
import { Switch } from '@/components/ui/switch';

const Integrations: React.FC = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [ssoModalOpen, setSsoModalOpen] = useState(false);
  const [testIntegrationId, setTestIntegrationId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: integrationsData, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const response = await api.get('/integrations');
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/integrations/${id}`);
    },
    onSuccess: () => {
      toast.success('Entegrasyon silindi');
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Entegrasyon silinemedi');
    },
  });

  const testMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/integrations/${id}/test`);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Entegrasyon testi başarılı');
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Entegrasyon testi başarısız');
    },
  });

  const integrations = integrationsData?.integrations || [];

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
          <h1 className="text-3xl font-bold tracking-tight">Entegrasyonlar</h1>
          <p className="text-muted-foreground mt-2">
            Üçüncü parti servisler ve SSO yapılandırmaları
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSsoModalOpen(true)}>
            <Key className="h-4 w-4 mr-2" />
            SSO Kurulumu
          </Button>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Entegrasyon
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration: any) => (
          <Card key={integration.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Plug className="h-5 w-5" />
                  {integration.name}
                </CardTitle>
                {integration.isActive ? (
                  <Badge variant="success">Aktif</Badge>
                ) : (
                  <Badge variant="secondary">Pasif</Badge>
                )}
              </div>
              <CardDescription>{integration.type}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Oluşturulma: {new Date(integration.createdAt).toLocaleDateString('tr-TR')}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTestIntegrationId(integration.id);
                    testMutation.mutate(integration.id);
                  }}
                  disabled={testMutation.isPending && testIntegrationId === integration.id}
                >
                  {testMutation.isPending && testIntegrationId === integration.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteMutation.mutate(integration.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {integrations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Plug className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Henüz entegrasyon oluşturulmamış</p>
          </CardContent>
        </Card>
      )}

      <IntegrationCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      <SSOSetupModal
        open={ssoModalOpen}
        onOpenChange={setSsoModalOpen}
      />
    </div>
  );
};

function IntegrationCreateModal({ open, onOpenChange }: any) {
  const [type, setType] = useState('WEBHOOK');
  const [name, setName] = useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/integrations', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Entegrasyon oluşturuldu');
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      onOpenChange(false);
      setName('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Entegrasyon oluşturulamadı');
    },
  });

  const handleSubmit = () => {
    createMutation.mutate({ type, name, config: {} });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Entegrasyon Oluştur</DialogTitle>
          <DialogDescription>Yeni bir entegrasyon ekleyin</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tip</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEBHOOK">Webhook</SelectItem>
                <SelectItem value="PAYMENT">Ödeme</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">İsim</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Entegrasyon adı"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={!name || createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Oluştur
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SSOSetupModal({ open, onOpenChange }: any) {
  const [provider, setProvider] = useState('SAML');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [metadataUrl, setMetadataUrl] = useState('');
  const queryClient = useQueryClient();

  const setupMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/integrations/sso/setup', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('SSO kurulumu tamamlandı');
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      onOpenChange(false);
      setClientId('');
      setClientSecret('');
      setMetadataUrl('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'SSO kurulumu başarısız');
    },
  });

  const handleSubmit = () => {
    setupMutation.mutate({ provider, clientId, clientSecret, metadataUrl });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>SSO Kurulumu</DialogTitle>
          <DialogDescription>Single Sign-On yapılandırması</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SAML">SAML 2.0</SelectItem>
                <SelectItem value="OAuth2">OAuth 2.0</SelectItem>
                <SelectItem value="OpenID">OpenID Connect</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientId">Client ID</Label>
            <Input
              id="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Client ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientSecret">Client Secret</Label>
            <Input
              id="clientSecret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Client Secret"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="metadataUrl">Metadata URL</Label>
            <Input
              id="metadataUrl"
              value={metadataUrl}
              onChange={(e) => setMetadataUrl(e.target.value)}
              placeholder="https://example.com/saml/metadata"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={!clientId || !clientSecret || setupMutation.isPending}>
            {setupMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kurulumu Tamamla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default Integrations;

