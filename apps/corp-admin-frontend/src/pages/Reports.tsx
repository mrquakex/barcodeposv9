import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileBarChart, Download, Loader2, Calendar } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/ui/date-range-picker';

type ReportType = 'tenants' | 'licenses' | 'users' | 'financial' | 'system' | 'revenue' | 'usage';

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('tenants');
  const [format, setFormat] = useState<'json' | 'csv'>('csv');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const generateMutation = useMutation({
    mutationFn: async ({ type, format, startDate, endDate }: {
      type: ReportType;
      format: 'json' | 'csv';
      startDate?: Date;
      endDate?: Date;
    }) => {
      const params: any = { format };
      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) params.endDate = endDate.toISOString();

      const response = await api.get(`/reports/${type}`, { params, responseType: format === 'csv' ? 'blob' : 'json' });
      return { data: response.data, format };
    },
    onSuccess: ({ data, format }) => {
      if (format === 'csv') {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${reportType}_report.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('Rapor indirildi');
      } else {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${reportType}_report.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('Rapor indirildi');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Rapor oluşturulamadı');
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate({ type: reportType, format, startDate, endDate });
  };

  const reportTypes: { value: ReportType; label: string; description: string }[] = [
    { value: 'tenants', label: 'Tenant Raporu', description: 'Tüm tenant bilgileri ve istatistikleri' },
    { value: 'licenses', label: 'Lisans Raporu', description: 'Lisans durumları ve detayları' },
    { value: 'users', label: 'Kullanıcı Raporu', description: 'Kullanıcı bilgileri ve aktiviteleri' },
    { value: 'financial', label: 'Finansal Rapor', description: 'Gelir, fatura ve ödeme bilgileri' },
    { value: 'system', label: 'Sistem Raporu', description: 'Sistem durumu ve genel istatistikler' },
    { value: 'revenue', label: 'Gelir Raporu', description: 'Gelir analizi ve trendleri' },
    { value: 'usage', label: 'Kullanım Raporu', description: 'Sistem kullanım istatistikleri' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Raporlar</h1>
        <p className="text-muted-foreground mt-2">
          Detaylı sistem raporları oluşturun ve indirin
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rapor Oluştur</CardTitle>
          <CardDescription>Rapor tipini seçin ve parametreleri belirleyin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reportType">Rapor Tipi</Label>
              <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
                <SelectTrigger id="reportType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {reportTypes.find(t => t.value === reportType)?.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Select value={format} onValueChange={(value) => setFormat(value as 'json' | 'csv')}>
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tarih Aralığı (Opsiyonel)</Label>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              placeholder="Tüm tarihler"
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={generateMutation.isPending}
            className="w-full md:w-auto"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Rapor Oluştur ve İndir
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((type) => (
          <Card key={type.value} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileBarChart className="h-5 w-5" />
                {type.label}
              </CardTitle>
              <CardDescription>{type.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setReportType(type.value);
                  handleGenerate();
                }}
                disabled={generateMutation.isPending}
              >
                <Download className="mr-2 h-4 w-4" />
                Hızlı İndir
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Reports;
