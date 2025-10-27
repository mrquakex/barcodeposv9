import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, FileText, Download } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentButton from '../components/fluent/FluentButton';
import FluentBadge from '../components/fluent/FluentBadge';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: string;
  status: string;
  total: number;
  customer: { name: string };
  sale: { saleNumber: string };
  createdAt: string;
  sentAt?: string;
}

const Invoices: React.FC = () => {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/invoices');
      setInvoices(response.data.invoices || []);
    } catch (error) {
      toast.error(t('invoices.fetchError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="fluent-title text-foreground">{t('invoices.title')}</h1>
          <p className="fluent-body text-foreground-secondary mt-1">{invoices.length} invoices</p>
        </div>
        <FluentButton appearance="primary" icon={<Plus className="w-4 h-4" />}>
          Create Invoice
        </FluentButton>
      </div>

      <FluentCard depth="depth-4" className="p-4">
        <FluentInput placeholder={t('invoices.searchPlaceholder') || 'Fatura ara...'} icon={<Search className="w-4 h-4" />} />
      </FluentCard>

      <div className="space-y-3">
        {invoices.map((invoice) => (
          <FluentCard key={invoice.id} depth="depth-4" hoverable className="p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="fluent-body font-medium text-foreground">
                    {invoice.invoiceNumber}
                  </h4>
                  <FluentBadge appearance="info" size="small">
                    {invoice.type}
                  </FluentBadge>
                  <FluentBadge
                    appearance={
                      invoice.status === 'APPROVED'
                        ? 'success'
                        : invoice.status === 'REJECTED'
                        ? 'error'
                        : 'warning'
                    }
                    size="small"
                  >
                    {invoice.status}
                  </FluentBadge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground-secondary">
                  <span>Customer: {invoice.customer.name}</span>
                  <span>Sale: {invoice.sale.saleNumber}</span>
                  <span>
                    {new Date(invoice.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  {invoice.sentAt && <span>{t('invoices.sent') || 'Gönderildi'}</span>}
                </div>
              </div>
              <div className="flex flex-col md:items-end gap-2">
                <p className="fluent-heading text-foreground">₺{invoice.total.toFixed(2)}</p>
                <div className="flex gap-2">
                  <FluentButton appearance="subtle" size="small" icon={<Eye className="w-4 h-4" />}>
                    View
                  </FluentButton>
                  <FluentButton
                    appearance="subtle"
                    size="small"
                    icon={<Download className="w-4 h-4" />}
                  >
                    Download
                  </FluentButton>
                </div>
              </div>
            </div>
          </FluentCard>
        ))}
      </div>

      {invoices.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
          <p className="fluent-body text-foreground-secondary">No invoices yet</p>
        </div>
      )}
    </div>
  );
};

export default Invoices;

