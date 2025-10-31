import React, { useState, useMemo } from 'react';
import { useAuditLogs, AuditLog } from '@/hooks/useAuditLogs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileText, Search, RefreshCw, Loader2, Eye, Filter } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

const AuditLogs: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [adminFilter, setAdminFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useAuditLogs({
    page,
    limit: 50,
    search: search || undefined,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    toast.success('Audit log listesi yenilendi');
  };

  const handleViewDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailModalOpen(true);
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: 'success',
      UPDATE: 'default',
      DELETE: 'destructive',
      LOGIN: 'default',
      LOGOUT: 'default',
    };
    return <Badge variant={colors[action] as any || 'outline'}>{action}</Badge>;
  };

  const columns: ColumnDef<AuditLog>[] = useMemo(
    () => [
      {
        accessorKey: 'action',
        header: 'Aksiyon',
        cell: ({ row }) => getActionBadge(row.original.action),
      },
      {
        accessorKey: 'resource',
        header: 'Kaynak',
        cell: ({ row }) => <span className="font-medium">{row.original.resource}</span>,
      },
      {
        accessorKey: 'admin',
        header: 'Admin',
        cell: ({ row }) => (
          <span className="text-sm">{row.original.admin?.name || row.original.admin?.email || 'System'}</span>
        ),
      },
      {
        accessorKey: 'resourceId',
        header: 'Kaynak ID',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground font-mono">
            {row.original.resourceId || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'ipAddress',
        header: 'IP Adresi',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground font-mono">
            {row.original.ipAddress || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Tarih',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'İşlemler',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleViewDetail(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    []
  );

  // Filter data based on filters
  const filteredData = useMemo(() => {
    if (!data?.logs) return [];
    let filtered = [...data.logs];

    if (actionFilter !== 'all') {
      filtered = filtered.filter((log) => log.action === actionFilter);
    }
    if (resourceFilter !== 'all') {
      filtered = filtered.filter((log) => log.resource === resourceFilter);
    }
    if (adminFilter !== 'all') {
      filtered = filtered.filter((log) => log.adminId === adminFilter);
    }
    if (startDate) {
      filtered = filtered.filter((log) => new Date(log.createdAt) >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((log) => new Date(log.createdAt) <= endDate);
    }

    return filtered;
  }, [data?.logs, actionFilter, resourceFilter, adminFilter, startDate, endDate]);

  // Get unique values for filters
  const uniqueActions = useMemo(() => {
    if (!data?.logs) return [];
    return Array.from(new Set(data.logs.map((log) => log.action))).sort();
  }, [data?.logs]);

  const uniqueResources = useMemo(() => {
    if (!data?.logs) return [];
    return Array.from(new Set(data.logs.map((log) => log.resource))).sort();
  }, [data?.logs]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground mt-2">
            Tüm sistem aktiviteleri ve denetim kayıtları
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Aksiyon</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kaynak</Label>
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {uniqueResources.map((resource) => (
                    <SelectItem key={resource} value={resource}>
                      {resource}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tarih Aralığı</Label>
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                placeholder="Tüm tarihler"
              />
            </div>

            <div className="space-y-2">
              <Label>Filtreleri Temizle</Label>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setActionFilter('all');
                  setResourceFilter('all');
                  setAdminFilter('all');
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}
              >
                Temizle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Log Listesi</CardTitle>
          <CardDescription>
            {filteredData.length} kayıt gösteriliyor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredData}
            searchKey="resource"
            searchPlaceholder="Kaynak ara..."
            enableColumnVisibility={true}
            initialPageSize={50}
          />
        </CardContent>
      </Card>

      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Detayları</DialogTitle>
            <DialogDescription>Kayıt detayları ve bilgileri</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Aksiyon</Label>
                  <p className="font-medium">{selectedLog.action}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Kaynak</Label>
                  <p className="font-medium">{selectedLog.resource}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Admin</Label>
                  <p className="font-medium">
                    {selectedLog.admin?.name || selectedLog.admin?.email || 'System'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Tarih</Label>
                  <p className="font-medium">{formatDate(selectedLog.createdAt)}</p>
                </div>
                {selectedLog.resourceId && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Kaynak ID</Label>
                    <p className="font-medium font-mono">{selectedLog.resourceId}</p>
                  </div>
                )}
                {selectedLog.ipAddress && (
                  <div>
                    <Label className="text-xs text-muted-foreground">IP Adresi</Label>
                    <p className="font-medium font-mono">{selectedLog.ipAddress}</p>
                  </div>
                )}
              </div>
              {selectedLog.details && (
                <div>
                  <Label className="text-xs text-muted-foreground">Detaylar</Label>
                  <pre className="mt-2 p-4 bg-muted rounded-md text-sm overflow-auto">
                    {typeof selectedLog.details === 'string'
                      ? selectedLog.details
                      : JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.reason && (
                <div>
                  <Label className="text-xs text-muted-foreground">Sebep</Label>
                  <p className="font-medium">{selectedLog.reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLogs;
