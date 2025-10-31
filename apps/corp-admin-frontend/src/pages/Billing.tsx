import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Receipt, Plus, Download } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

const Billing: React.FC = () => {
  // Mock data
  const invoices: any[] = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Faturalandırma</h1>
          <p className="text-muted-foreground mt-2">
            Fatura yönetimi ve ödeme geçmişi
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Fatura
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bu Ay Gelir</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Son aydan %0 değişim</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen Ödemeler</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Toplam bekleyen fatura</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Tüm zamanlar</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faturalar</CardTitle>
          <CardDescription>Fatura geçmişi ve durumları</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Henüz fatura yok
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">#{invoice.number}</div>
                    <div className="text-sm text-muted-foreground">{formatDate(invoice.date)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(invoice.amount)}</div>
                    <Badge variant={invoice.status === 'paid' ? 'success' : 'warning'}>
                      {invoice.status}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;

