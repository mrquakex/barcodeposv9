import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart3, Loader2, Download, Calendar } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Label } from '@/components/ui/label';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdvancedAnalytics: React.FC = () => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const { data: historicalData, isLoading: historicalLoading } = useQuery({
    queryKey: ['advanced-analytics', 'historical', startDate, endDate],
    queryFn: async () => {
      const params: any = {};
      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) params.endDate = endDate.toISOString();
      const response = await api.get('/advanced-analytics/historical', { params });
      return response.data;
    },
  });

  const { data: predictiveData, isLoading: predictiveLoading } = useQuery({
    queryKey: ['advanced-analytics', 'predictive'],
    queryFn: async () => {
      const response = await api.get('/advanced-analytics/predictive');
      return response.data;
    },
  });

  const { data: customDashboard } = useQuery({
    queryKey: ['advanced-analytics', 'dashboard'],
    queryFn: async () => {
      const response = await api.get('/advanced-analytics/dashboard/custom');
      return response.data;
    },
  });

  const saveDashboardMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/advanced-analytics/dashboard/custom', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Dashboard kaydedildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Dashboard kaydedilemedi');
    },
  });

  const monthlyData = historicalData?.historical?.monthlyData || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gelişmiş Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Tarihsel veri analizi ve tahminsel analitik
          </p>
        </div>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tarihsel Veri Analizi
            </CardTitle>
            <CardDescription>Tenant ve lisans büyüme trendleri</CardDescription>
          </CardHeader>
          <CardContent>
            {historicalLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="tenants" stroke="#8884d8" name="Tenants" />
                  <Line type="monotone" dataKey="licenses" stroke="#82ca9d" name="Licenses" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12">Veri bulunamadı</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tahminsel Analitik
            </CardTitle>
            <CardDescription>Gelecek projeksiyonlar ve trendler</CardDescription>
          </CardHeader>
          <CardContent>
            {predictiveLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : predictiveData?.predictions ? (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm font-medium mb-2">Önümüzdeki Ay</div>
                  <div className="text-2xl font-bold">{predictiveData.predictions.nextMonth.newTenants}</div>
                  <div className="text-xs text-muted-foreground">
                    Güven: {Math.round(predictiveData.predictions.nextMonth.confidence * 100)}%
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm font-medium mb-2">Önümüzdeki Çeyrek</div>
                  <div className="text-2xl font-bold">{predictiveData.predictions.nextQuarter.newTenants}</div>
                  <div className="text-xs text-muted-foreground">
                    Güven: {Math.round(predictiveData.predictions.nextQuarter.confidence * 100)}%
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm font-medium mb-2">Trend</div>
                  <div className="text-lg font-semibold capitalize">
                    {predictiveData.predictions.trend === 'increasing' && '📈 Artış'}
                    {predictiveData.predictions.trend === 'stable' && '➡️ Stabil'}
                    {predictiveData.predictions.trend === 'decreasing' && '📉 Azalış'}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-12">Veri bulunamadı</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Özel Dashboard</CardTitle>
          <CardDescription>Widget'ları özelleştirin ve kaydedin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Dashboard özelleştirme özelliği yakında eklenecek
            </p>
            <Button
              onClick={() => saveDashboardMutation.mutate({ widgets: [], layout: 'default' })}
              disabled={saveDashboardMutation.isPending}
            >
              {saveDashboardMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Dashboard'u Kaydet
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedAnalytics;

