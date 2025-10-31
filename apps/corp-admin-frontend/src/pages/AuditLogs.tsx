import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Search, RefreshCw, Loader2, Filter } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const AuditLogs: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  
  const { data, isLoading, error, refetch } = useAuditLogs({
    page,
    limit: 50,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    toast.success('Audit log listesi yenilendi');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive">Veriler yüklenirken bir hata oluştu</p>
          <Button onClick={() => refetch()} className="mt-4">Tekrar Dene</Button>
        </div>
      </div>
    );
  }

  const logs = data?.logs || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground mt-2">
            Sistem aktivite kayıtları ve denetim logları
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtrele
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audit Log Listesi</CardTitle>
              <CardDescription>
                Tüm sistem aktiviteleri kaydı
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Log ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Henüz log kaydı yok</p>
            </div>
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm">Zaman</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Admin</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Aksiyon</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Kaynak</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-sm">{log.admin?.email}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{log.action}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">{log.resource}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {log.ipAddress || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Sayfa {data.pagination.page} / {data.pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Önceki
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                    disabled={page === data.pagination.totalPages}
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogs;

