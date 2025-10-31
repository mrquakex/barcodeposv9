import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Ban, Loader2 } from 'lucide-react';
import { useSecurityEvents, useFailedLogins, useSuspiciousActivity } from '@/hooks/useSecurityAudit';
import { formatDate } from '@/lib/utils';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SecurityAudit: React.FC = () => {
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const { data: eventsData, isLoading: eventsLoading } = useSecurityEvents({
    page,
    limit: 50,
    startDate: startDate?.toISOString(),
    endDate: endDate?.toISOString(),
  });

  const { data: failedLoginsData, isLoading: failedLoginsLoading } = useFailedLogins();
  const { data: suspiciousData, isLoading: suspiciousLoading } = useSuspiciousActivity();

  const getActionBadge = (action: string) => {
    const colorMap: Record<string, string> = {
      LOGIN: 'success',
      LOGIN_FAILED: 'destructive',
      LOGOUT: 'outline',
      MFA_SETUP: 'secondary',
      MFA_ENABLED: 'success',
      MFA_DISABLED: 'warning',
      PASSWORD_CHANGE: 'secondary',
      PERMISSION_CHANGE: 'secondary',
    };
    return <Badge variant={colorMap[action] as any || 'outline'}>{action}</Badge>;
  };

  if (eventsLoading || failedLoginsLoading || suspiciousLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Güvenlik Denetimi</h1>
          <p className="text-muted-foreground mt-2">
            Güvenlik olayları ve şüpheli aktiviteler
          </p>
        </div>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Güvenlik Olayları</TabsTrigger>
          <TabsTrigger value="failed-logins">Başarısız Girişler</TabsTrigger>
          <TabsTrigger value="suspicious">Şüpheli Aktivite</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Güvenlik Olayları</CardTitle>
              <CardDescription>Tüm güvenlik ile ilgili aktiviteler</CardDescription>
            </CardHeader>
            <CardContent>
              {eventsData?.events?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Henüz güvenlik olayı kaydedilmemiş
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-sm">Zaman</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Admin</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Aksiyon</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventsData?.events?.map((event: any) => (
                        <tr key={event.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {formatDate(event.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-sm">{event.admin?.email}</td>
                          <td className="py-3 px-4">{getActionBadge(event.action)}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {event.ipAddress || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed-logins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Başarısız Giriş Denemeleri</CardTitle>
              <CardDescription>Son 100 başarısız giriş denemesi</CardDescription>
            </CardHeader>
            <CardContent>
              {failedLoginsData?.failedLogins?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Başarısız giriş denemesi bulunmuyor
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-sm">Zaman</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {failedLoginsData?.failedLogins?.map((login: any) => (
                        <tr key={login.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {formatDate(login.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-sm">{login.admin?.email || 'Bilinmeyen'}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {login.ipAddress || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suspicious" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Şüpheli Aktivite</CardTitle>
              <CardDescription>Son 24 saatte tespit edilen şüpheli IP'ler</CardDescription>
            </CardHeader>
            <CardContent>
              {suspiciousData?.suspiciousActivity?.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Şüpheli aktivite tespit edilmedi</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suspiciousData?.suspiciousActivity?.map((activity: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{activity.ipAddress || 'Bilinmeyen IP'}</div>
                        <div className="text-sm text-muted-foreground">
                          {activity._count.id} başarısız giriş denemesi
                        </div>
                      </div>
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Şüpheli
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityAudit;

