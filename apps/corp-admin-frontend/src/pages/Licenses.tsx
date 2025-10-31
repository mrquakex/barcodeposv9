import React, { useState } from 'react';
import { useLicenses, License } from '@/hooks/useLicenses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Key, Search, Plus, Edit, RefreshCw, Loader2, Trash2, Download, AlertTriangle } from 'lucide-react';
import { exportLicenses } from '@/lib/export';
import { formatDate } from '@/lib/utils';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { LicenseCreateModal } from '@/components/modals/LicenseCreateModal';
import { LicenseEditModal } from '@/components/modals/LicenseEditModal';
import { DeleteConfirmDialog } from '@/components/modals/DeleteConfirmDialog';
import api from '@/lib/api';

const Licenses: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const queryClient = useQueryClient();
  
  const { data, isLoading, error, refetch } = useLicenses({
    page,
    limit: 20,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/licenses/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Lisans başarıyla silindi');
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
      setDeleteDialogOpen(false);
      setSelectedLicense(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Lisans silinirken bir hata oluştu');
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['licenses'] });
    toast.success('Lisans listesi yenilendi');
  };

  const handleCreateClick = () => {
    setCreateModalOpen(true);
  };

  const handleEditClick = (license: License) => {
    setSelectedLicense(license);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (license: License) => {
    setSelectedLicense(license);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedLicense) {
      deleteMutation.mutate(selectedLicense.id);
    }
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Aktif</Badge>;
      case 'EXPIRED':
        return <Badge variant="destructive">Süresi Dolmuş</Badge>;
      case 'TRIAL':
        return <Badge variant="warning">Deneme</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lisanslar</h1>
          <p className="text-muted-foreground mt-2">
            Tüm lisansları görüntüle ve yönet
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              exportLicenses().catch((error) => {
                toast.error(error.message || 'Export başarısız oldu');
              });
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Dışa Aktar
          </Button>
          <Button onClick={handleCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Lisans
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lisans Listesi</CardTitle>
              <CardDescription>
                {data?.pagination?.total || 0} lisans bulundu
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Lisans ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-sm">Tenant</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Plan</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Durum</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Başlangıç</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Bitiş</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Mobil</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {data?.licenses?.map((license) => (
                  <tr key={license.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">
                      {license.tenant?.name || license.tenantId}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="default">{license.plan}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(license.status)}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {formatDate(license.startsAt)}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {license.expiresAt ? (
                        <div className="flex items-center gap-2">
                          <span className={(() => {
                            const daysUntilExpiry = Math.ceil((new Date(license.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                            if (daysUntilExpiry < 0) return 'text-destructive';
                            if (daysUntilExpiry <= 7) return 'text-orange-500';
                            if (daysUntilExpiry <= 30) return 'text-yellow-500';
                            return 'text-muted-foreground';
                          })()}>
                            {formatDate(license.expiresAt)}
                          </span>
                          {license.expiresAt && (() => {
                            const daysUntilExpiry = Math.ceil((new Date(license.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                            if (daysUntilExpiry < 0) {
                              return <AlertTriangle className="h-4 w-4 text-destructive" title="Süresi dolmuş" />;
                            }
                            if (daysUntilExpiry <= 7) {
                              return <AlertTriangle className="h-4 w-4 text-orange-500" title="Yakında sona eriyor" />;
                            }
                            if (daysUntilExpiry <= 30) {
                              return <AlertTriangle className="h-4 w-4 text-yellow-500" title="30 gün içinde sona erecek" />;
                            }
                            return null;
                          })()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {license.includesMobile ? (
                        <Badge variant="success">Evet</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Hayır</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditClick(license)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteClick(license)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
        </CardContent>
      </Card>

      <LicenseCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      <LicenseEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        license={selectedLicense}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Lisansı Sil"
        description="Bu lisansı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        itemName={`${selectedLicense?.tenant?.name || selectedLicense?.tenantId} - ${selectedLicense?.plan}`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Licenses;
