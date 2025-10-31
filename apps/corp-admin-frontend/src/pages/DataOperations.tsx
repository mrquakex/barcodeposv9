import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Database, Loader2 } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const DataOperations: React.FC = () => {
  const [exportType, setExportType] = useState('tenants');
  const [exportFormat, setExportFormat] = useState('json');
  const [importFile, setImportFile] = useState<File | null>(null);

  const exportMutation = useMutation({
    mutationFn: async ({ type, format }: { type: string; format: string }) => {
      const response = await api.get('/data-operations/export', {
        params: { type, format },
        responseType: format === 'csv' ? 'blob' : 'json',
      });
      return { data: response.data, format };
    },
    onSuccess: ({ data, format }) => {
      if (format === 'csv') {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${exportType}_export.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('Veri dışa aktarıldı');
      } else {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${exportType}_export.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('Veri dışa aktarıldı');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Dışa aktarma başarısız oldu');
    },
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', exportType);
      const response = await api.post('/data-operations/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Veri içe aktarıldı');
      setImportFile(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'İçe aktarma başarısız oldu');
    },
  });

  const { data: backupStatus } = useQuery({
    queryKey: ['backup-status'],
    queryFn: async () => {
      const response = await api.get('/data-operations/backup/status');
      return response.data;
    },
  });

  const handleExport = () => {
    exportMutation.mutate({ type: exportType, format: exportFormat });
  };

  const handleImport = () => {
    if (importFile) {
      importMutation.mutate(importFile);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Veri İşlemleri</h1>
        <p className="text-muted-foreground mt-2">
          Veri dışa aktarma, içe aktarma ve yedekleme işlemleri
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Veri Dışa Aktarma
            </CardTitle>
            <CardDescription>Verileri JSON veya CSV formatında dışa aktarın</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exportType">Veri Tipi</Label>
              <Select value={exportType} onValueChange={setExportType}>
                <SelectTrigger id="exportType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenants">Tenant'lar</SelectItem>
                  <SelectItem value="licenses">Lisanslar</SelectItem>
                  <SelectItem value="users">Kullanıcılar</SelectItem>
                  <SelectItem value="full">Tam Yedek</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exportFormat">Format</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger id="exportFormat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleExport}
              disabled={exportMutation.isPending}
              className="w-full"
            >
              {exportMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Dışa Aktarılıyor...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Dışa Aktar
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Veri İçe Aktarma
            </CardTitle>
            <CardDescription>JSON formatında veri içe aktarın</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="importFile">Dosya Seç</Label>
              <Input
                id="importFile"
                type="file"
                accept=".json,.csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </div>

            <Button
              onClick={handleImport}
              disabled={!importFile || importMutation.isPending}
              className="w-full"
              variant="outline"
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  İçe Aktarılıyor...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  İçe Aktar
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Yedekleme Durumu
          </CardTitle>
          <CardDescription>Otomatik yedekleme ayarları ve durumu</CardDescription>
        </CardHeader>
        <CardContent>
          {backupStatus ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Son Yedekleme</span>
                <span className="text-sm text-muted-foreground">
                  {backupStatus.lastBackup ? new Date(backupStatus.lastBackup).toLocaleString('tr-TR') : 'Henüz yedek alınmadı'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Yedekleme Sıklığı</span>
                <span className="text-sm text-muted-foreground">{backupStatus.backupFrequency}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Yedekleme durumu yükleniyor...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataOperations;

