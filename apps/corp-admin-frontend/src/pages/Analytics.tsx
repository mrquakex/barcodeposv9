import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, DollarSign, Loader2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { DateRangePicker } from '@/components/ui/date-range-picker';

const Analytics: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['analytics', 'revenue', startDate, endDate],
    queryFn: async () => {
      const params: any = {};
      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) params.endDate = endDate.toISOString();
      const response = await api.get('/analytics/revenue', { params });
      return response.data;
    },
  });

  const { data: tenantData } = useQuery({
    queryKey: ['analytics', 'tenants'],
    queryFn: async () => {
      const response = await api.get('/analytics/tenants');
      return response.data;
    },
  });

  const { data: userData } = useQuery({
    queryKey: ['analytics', 'users'],
    queryFn: async () => {
      const response = await api.get('/analytics/users');
      return response.data;
    },
  });

  // Mock chart data (will be replaced with real data from backend)
  const revenueChartData = revenueData?.chartData || [
    { month: 'Ocak', revenue: 0 },
    { month: 'Şubat', revenue: 0 },
    { month: 'Mart', revenue: 0 },
    { month: 'Nisan', revenue: 0 },
    { month: 'Mayıs', revenue: 0 },
    { month: 'Haziran', revenue: 0 },
  ];

  const tenantGrowthData = tenantData?.chartData || [
    { month: 'Ocak', tenants: 0 },
    { month: 'Şubat', tenants: 0 },
    { month: 'Mart', tenants: 0 },
    { month: 'Nisan', tenants: 0 },
    { month: 'Mayıs', tenants: 0 },
    { month: 'Haziran', tenants: 0 },
  ];

  if (revenueLoading) {
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
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Sistem geneli analitik ve metrikler
          </p>
        </div>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revenueData?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              MRR: {formatCurrency(revenueData?.mrr || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Tenant'lar</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(tenantData?.active || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {tenantData?.growth ? `+${tenantData.growth.toFixed(1)}%` : '0%'} büyüme
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(userData?.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(userData?.active || 0)} aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">Son 30 gün</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gelir Trendi</CardTitle>
            <CardDescription>Son 6 ay gelir analizi</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tenant Büyümesi</CardTitle>
            <CardDescription>Yeni tenant kayıtları</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tenantGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tenants" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
