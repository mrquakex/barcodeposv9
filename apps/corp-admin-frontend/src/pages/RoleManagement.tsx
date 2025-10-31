import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const RoleManagement: React.FC = () => {
  const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
    queryKey: ['rbac', 'permissions'],
    queryFn: async () => {
      const response = await api.get('/rbac/permissions');
      return response.data;
    },
  });

  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['rbac', 'templates'],
    queryFn: async () => {
      const response = await api.get('/rbac/templates');
      return response.data;
    },
  });

  if (permissionsLoading || templatesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentRole = permissionsData?.role || 'CORP_SUPPORT';
  const currentPermissions = permissionsData?.permissions || [];
  const templates = templatesData?.templates || {};
  const allPermissions = permissionsData?.allPermissions || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rol ve İzin Yönetimi</h1>
        <p className="text-muted-foreground mt-2">
          Rol şablonları ve izin yönetimi
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Mevcut Rolünüz
          </CardTitle>
          <CardDescription>Şu anda sahip olduğunuz rol ve izinler</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Badge variant="default" className="text-lg px-3 py-1">
                {currentRole}
              </Badge>
            </div>
            <div>
              <h3 className="font-semibold mb-2">İzinler ({currentPermissions.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {currentPermissions.map((perm: string) => (
                  <div key={perm} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-muted-foreground">{perm}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(templates).map(([role, permissions]: [string, any]) => (
          <Card key={role}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {role}
              </CardTitle>
              <CardDescription>{permissions.length} izin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.isArray(permissions) && permissions.slice(0, 5).map((perm: string) => (
                  <div key={perm} className="text-sm text-muted-foreground">
                    • {perm}
                  </div>
                ))}
                {Array.isArray(permissions) && permissions.length > 5 && (
                  <div className="text-sm text-muted-foreground">
                    + {permissions.length - 5} daha...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tüm İzinler</CardTitle>
          <CardDescription>Sistemdeki tüm mevcut izinler</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {allPermissions.map((perm: string) => (
              <div key={perm} className="text-sm text-muted-foreground">
                {perm}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleManagement;

