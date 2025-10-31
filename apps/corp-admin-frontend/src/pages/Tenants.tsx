import React, { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useTenants, Tenant } from '@/hooks/useTenants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Edit, RefreshCw, Loader2, Trash2, Download, Eye } from 'lucide-react';
import { exportTenants } from '@/lib/export';
import { TenantDetailModal } from '@/components/modals/TenantDetailModal';
import { formatDate } from '@/lib/utils';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { TenantCreateModal } from '@/components/modals/TenantCreateModal';
import { TenantEditModal } from '@/components/modals/TenantEditModal';
import { DeleteConfirmDialog } from '@/components/modals/DeleteConfirmDialog';
import { DataTable } from '@/components/ui/data-table';
import api from '@/lib/api';

const Tenants: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const queryClient = useQueryClient();
  
  const { data, isLoading, error, refetch } = useTenants({
    page,
    limit: 100, // Fetch more data for client-side pagination in DataTable
    search: search || undefined,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/tenants/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Tenant başarıyla silindi');
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setDeleteDialogOpen(false);
      setSelectedTenant(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Tenant silinirken bir hata oluştu');
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['tenants'] });
    toast.success('Tenant listesi yenilendi');
  };

  const handleCreateClick = () => {
    setCreateModalOpen(true);
  };

  const handleEditClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setEditModalOpen(true);
  };

  const handleDetailClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setDetailModalOpen(true);
  };

  const handleDeleteClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedTenant) {
      deleteMutation.mutate(selectedTenant.id);
    }
  };

  const columns: ColumnDef<Tenant>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Tenant',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'userCount',
        header: 'Kullanıcı',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.userCount}</span>
        ),
      },
      {
        accessorKey: 'productCount',
        header: 'Ürün',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.productCount}</span>
        ),
      },
      {
        accessorKey: 'activeLicense',
        header: 'Lisans',
        cell: ({ row }) => (
          row.original.activeLicense ? (
            <Badge variant="success">{row.original.activeLicense.plan}</Badge>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Durum',
        cell: ({ row }) => (
          row.original.isActive ? (
            <Badge variant="success">Aktif</Badge>
          ) : (
            <Badge variant="destructive">Pasif</Badge>
          )
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Oluşturulma',
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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDetailClick(row.original)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditClick(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteClick(row.original)}
              disabled={row.original.userCount > 0 || row.original.productCount > 0 || row.original.licenseCount > 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    []
  );

  if (isLoading && !data) {
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
          <h1 className="text-3xl font-bold tracking-tight">Tenant'lar</h1>
          <p className="text-muted-foreground mt-2">
            Tüm işletmeleri görüntüle ve yönet
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
              exportTenants().catch((error) => {
                toast.error(error.message || 'Export başarısız oldu');
              });
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Dışa Aktar
          </Button>
          <Button onClick={handleCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Tenant
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tenant Listesi</CardTitle>
              <CardDescription>
                {data?.pagination?.total || 0} tenant bulundu
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data?.tenants || []}
            searchKey="name"
            searchPlaceholder="Tenant ara..."
            enableRowSelection={false}
            enableColumnVisibility={true}
            initialPageSize={20}
          />
        </CardContent>
      </Card>

      <TenantCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      <TenantEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        tenant={selectedTenant}
      />

      <TenantDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        tenant={selectedTenant}
        onEdit={handleEditClick}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Tenant'ı Sil"
        description="Bu tenant'ı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        itemName={selectedTenant?.name}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Tenants;
