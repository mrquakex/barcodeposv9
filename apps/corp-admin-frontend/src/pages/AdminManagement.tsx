import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, Plus, Edit, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { AdminCreateModal } from '@/components/modals/AdminCreateModal';
import { AdminEditModal } from '@/components/modals/AdminEditModal';
import { DeleteConfirmDialog } from '@/components/modals/DeleteConfirmDialog';

interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  mfaEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

const AdminManagement: React.FC = () => {
  const [page, setPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const queryClient = useQueryClient();
  const { admin: currentAdmin } = useAuthStore();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admins', page],
    queryFn: async () => {
      const response = await api.get('/admin-management', { params: { page, limit: 20 } });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin-management/${id}`);
    },
    onSuccess: () => {
      toast.success('Admin başarıyla silindi');
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setDeleteDialogOpen(false);
      setSelectedAdmin(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Admin silinirken bir hata oluştu');
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admins'] });
    toast.success('Admin listesi yenilendi');
  };

  const handleCreateClick = () => {
    setCreateModalOpen(true);
  };

  const handleEditClick = (admin: Admin) => {
    setSelectedAdmin(admin);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (admin: Admin) => {
    setSelectedAdmin(admin);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedAdmin) {
      deleteMutation.mutate(selectedAdmin.id);
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'CORP_ADMIN':
        return <Badge variant="default">Admin</Badge>;
      case 'CORP_OPS':
        return <Badge variant="secondary">Operasyon</Badge>;
      case 'CORP_SUPPORT':
        return <Badge variant="outline">Destek</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Yönetimi</h1>
          <p className="text-muted-foreground mt-2">
            Sistem yöneticileri ve yetkileri
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
          <Button onClick={handleCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Admin
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Listesi</CardTitle>
          <CardDescription>
            {data?.pagination?.total || 0} admin bulundu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.admins?.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Henüz admin oluşturulmamış</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-sm">İsim</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Rol</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Durum</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">MFA</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Son Giriş</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.admins?.map((admin: Admin) => (
                      <tr key={admin.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{admin.name}</td>
                        <td className="py-3 px-4 text-sm">{admin.email}</td>
                        <td className="py-3 px-4">{getRoleBadge(admin.role)}</td>
                        <td className="py-3 px-4">
                          {admin.isActive ? (
                            <Badge variant="success">Aktif</Badge>
                          ) : (
                            <Badge variant="destructive">Pasif</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {admin.mfaEnabled ? (
                            <Badge variant="success">Aktif</Badge>
                          ) : (
                            <Badge variant="outline">Kapalı</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {admin.lastLoginAt ? formatDate(admin.lastLoginAt) : 'Hiç'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(admin)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(admin)}
                              disabled={admin.id === currentAdmin?.id}
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
            </>
          )}
        </CardContent>
      </Card>

      <AdminCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      <AdminEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        admin={selectedAdmin}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Admin'i Sil"
        description="Bu admin'i silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        itemName={selectedAdmin?.name}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default AdminManagement;

