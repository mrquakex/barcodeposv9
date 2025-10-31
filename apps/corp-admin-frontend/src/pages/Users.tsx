import React, { useState } from 'react';
import { useUsers } from '@/hooks/useUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Plus, Edit, RefreshCw, Loader2, Mail } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const UsersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  
  const { data, isLoading, error, refetch } = useUsers({
    page,
    limit: 20,
    search: search || undefined,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    toast.success('Kullanıcı listesi yenilendi');
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="default">Admin</Badge>;
      case 'MANAGER':
        return <Badge variant="secondary">Yönetici</Badge>;
      case 'CASHIER':
        return <Badge variant="outline">Kasiyer</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
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
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kullanıcı ara..."
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
                  <th className="text-left py-3 px-4 font-medium text-sm">Kullanıcı</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Rol</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Tenant</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Durum</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">Oluşturulma</th>
                  <th className="text-left py-3 px-4 font-medium text-sm">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {data?.users?.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {user.tenant?.name || '-'}
                    </td>
                    <td className="py-3 px-4">
                      {user.isActive ? (
                        <Badge variant="success">Aktif</Badge>
                      ) : (
                        <Badge variant="destructive">Pasif</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
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
    </div>
  );
};

export default UsersPage;

