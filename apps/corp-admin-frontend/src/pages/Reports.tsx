import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, TrendingUp } from 'lucide-react';

const Reports: React.FC = () => {
  const reportTypes = [
    { name: 'Tenant Raporu', description: 'Tüm tenant\'ların detaylı raporu', icon: FileText },
    { name: 'Lisans Raporu', description: 'Lisans durumları ve kullanımları', icon: FileText },
    { name: 'Gelir Raporu', description: 'Aylık ve yıllık gelir analizi', icon: TrendingUp },
    { name: 'Kullanım Raporu', description: 'Sistem kullanım istatistikleri', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Raporlar</h1>
          <p className="text-muted-foreground mt-2">
            Sistem raporları ve analizler
          </p>
        </div>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Özel Rapor Oluştur
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reportTypes.map((report, index) => {
          const Icon = report.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle>{report.name}</CardTitle>
                </div>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Raporu İndir
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Reports;

