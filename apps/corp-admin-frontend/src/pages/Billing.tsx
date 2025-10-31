import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Receipt, Plus, Download, Loader2 } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

const Billing: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['billing', 'invoices'],
    queryFn: async () => {
      const response = await api.get('/billing/invoices');
      return response.data;
    },
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['billing', 'payments'],
    queryFn: async () => {
      const response = await api.get('/billing/payments');
      return response.data;
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: any) => {
      const response = await api.post('/billing/invoices', invoiceData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Fatura oluşturuldu');
      queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Fatura oluşturulamadı');
    },
  });

  const invoices = invoicesData?.invoices || [];
  const payments = paymentsData?.payments || [];
  const pendingInvoices = invoices.filter((inv: any) => inv.status === 'PENDING');
  const totalRevenue = payments.reduce((sum: number, p: any) => sum + p.amount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Onaylandı</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Beklemede</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Reddedildi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (invoicesLoading) {
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
          <h1 className="text-3xl font-bold tracking-tight">Faturalandırma</h1>
          <p className="text-muted-foreground mt-2">
            Fatura yönetimi ve ödeme geçmişi
          </p>
        </div>
        <Button onClick={() => {/* TODO: Open create invoice modal */}}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Fatura
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Onaylanan ödemeler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen Ödemeler</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvoices.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Toplam bekleyen fatura</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Fatura</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Tüm faturalar</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faturalar</CardTitle>
          <CardDescription>Fatura listesi ve durumları</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Henüz fatura oluşturulmamış
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm">Tenant</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Tutar</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Durum</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Oluşturulma</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice: any) => (
                    <tr key={invoice.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{invoice.tenant?.name || invoice.tenantId}</td>
                      <td className="py-3 px-4 font-medium">
                        {formatCurrency(invoice.amount)} {invoice.currency}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(invoice.status)}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {formatDate(invoice.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;
