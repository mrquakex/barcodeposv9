import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Plus, Copy, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
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

const ApiManagement: React.FC = () => {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const queryClient = useQueryClient();

  const { data: apiKeysData, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const response = await api.get('/api-keys');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await api.post('/api-keys', { name });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('API Key oluşturuldu. Bu key\'i kopyalayın - tekrar gösterilmeyecek!');
      toast.info(`API Key: ${data.apiKey}`, { duration: 10000 });
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setCreateModalOpen(false);
      setNewKeyName('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'API Key oluşturulamadı');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api-keys/${id}`);
    },
    onSuccess: () => {
      toast.success('API Key silindi');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'API Key silinemedi');
    },
  });

  const apiKeys = apiKeysData?.apiKeys || [];

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('API Key kopyalandı');
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
          <h1 className="text-3xl font-bold tracking-tight">API Yönetimi</h1>
          <p className="text-muted-foreground mt-2">
            API anahtarları ve kullanım istatistikleri
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni API Key
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Oluşturulmuş API anahtarları</CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-12">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Henüz API key oluşturulmamış</p>
              <Button onClick={() => setCreateModalOpen(true)} className="mt-4">
                İlk API Key'i Oluştur
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key: any) => (
                <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{key.name || 'Unnamed Key'}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {showKeys[key.id] ? key.key : '••••••••••••••••'}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowKeys({ ...showKeys, [key.id]: !showKeys[key.id] })}
                      >
                        {showKeys[key.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyKey(key.key)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Oluşturulma: {new Date(key.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(key.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni API Key Oluştur</DialogTitle>
            <DialogDescription>
              API key oluşturmak için bir isim verin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">API Key İsmi</Label>
              <Input
                id="keyName"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Örn: Production API Key"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              İptal
            </Button>
            <Button
              onClick={() => createMutation.mutate(newKeyName)}
              disabled={!newKeyName || createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApiManagement;
