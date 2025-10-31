import React, { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useUsers, User } from '@/hooks/useUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Edit, RefreshCw, Loader2, Trash2, Mail, Download } from 'lucide-react';
import { exportUsers } from '@/lib/export';
import { formatDate } from '@/lib/utils';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserCreateModal } from '@/components/modals/UserCreateModal';
import { UserEditModal } from '@/components/modals/UserEditModal';
import { DeleteConfirmDialog } from '@/components/modals/DeleteConfirmDialog';
import { DataTable } from '@/components/ui/data-table';
import api from '@/lib/api';

const UsersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  
  const { data, isLoading, error, refetch } = useUsers({
    page,
    limit: 100,
    search: search || undefined,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Kullanıcı başarıyla silindi');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Kullanıcı silinirken bir hata oluştu');
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    toast.success('Kullanıcı listesi yenilendi');
  };

  const handleCreateClick = () => {
    setCreateModalOpen(true);
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedUser) {
      deleteMutation.mutate(selectedUser.id);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return <Badge variant="default">Admin</Badge>;
      case 'MANAGER':
        return <Badge variant="secondary">Yönetici</Badge>;
      case 'CASHIER':
        return <Badge variant="outline">Kasiyer</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const columns: ColumnDef<User>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Kullanıcı',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{row.original.email}</span>
          </div>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Rol',
        cell: ({ row }) => getRoleBadge(row.original.role),
      },
      {
        accessorKey: 'tenant',
        header: 'Tenant',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.tenant?.name || '-'}
          </span>
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
              onClick={() => handleEditClick(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteClick(row.original)}
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
          <h1 className="text-3xl font-bold tracking-tight">Kullanıcılar</h1>
          <p className="text-muted-foreground mt-2">
            Tüm sistem kullanıcılarını görüntüle ve yönet
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
              exportUsers().catch((error) => {
                toast.error(error.message || 'Export başarısız oldu');
              });
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Dışa Aktar
          </Button>
          <Button onClick={handleCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Kullanıcı
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Kullanıcı Listesi</CardTitle>
              <CardDescription>
                {data?.pagination?.total || 0} kullanıcı bulundu
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data?.users || []}
            searchKey="name"
            searchPlaceholder="Kullanıcı ara..."
            enableRowSelection={false}
            enableColumnVisibility={true}
            initialPageSize={20}
          />
        </CardContent>
      </Card>

      <UserCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      <UserEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        user={selectedUser}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Kullanıcıyı Sil"
        description="Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        itemName={selectedUser?.name}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default UsersPage;
