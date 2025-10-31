import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Key, Plus, Copy, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const ApiManagement: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const handleGenerateKey = () => {
    toast.info('API Key oluşturma yakında eklenecek');
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('API Key kopyalandı');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Yönetimi</h1>
          <p className="text-muted-foreground mt-2">
            API anahtarları ve kullanım istatistikleri
          </p>
        </div>
        <Button onClick={handleGenerateKey}>
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
              <Button onClick={handleGenerateKey} className="mt-4">
                İlk API Key'i Oluştur
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{key.name}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Oluşturulma: {key.createdAt}
                    </div>
                    <div className="mt-2">
                      <Input
                        type={showKeys[key.id] ? 'text' : 'password'}
                        value={key.value}
                        readOnly
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowKeys({ ...showKeys, [key.id]: !showKeys[key.id] })}
                    >
                      {showKeys[key.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyKey(key.value)}
                    >
                      <Copy className="h-4 w-4" />
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

      <Card>
        <CardHeader>
          <CardTitle>API Dokümantasyonu</CardTitle>
          <CardDescription>REST API endpoint'leri ve kullanım örnekleri</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            API dokümantasyonu yakında eklenecek (Swagger UI)
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiManagement;

