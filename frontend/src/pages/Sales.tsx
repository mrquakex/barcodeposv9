import React, { useState, useEffect } from 'react';
import { Search, FileText, Printer, Eye, Calendar } from 'lucide-react';
import FluentButton from '../components/fluent/FluentButton';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentBadge from '../components/fluent/FluentBadge';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface Sale {
  id: string;
  saleNumber: string;
  total: number;
  paymentMethod: string;
  status: string;
  customer?: { name: string };
  user: { name: string };
  createdAt: string;
  _count?: { items: number };
}

const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await api.get('/sales');
      setSales(response.data);
    } catch (error) {
      toast.error('Failed to fetch sales');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = async (saleId: string) => {
    try {
      const response = await api.get(`/sales/${saleId}/receipt`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${saleId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to print receipt');
    }
  };

  const filteredSales = sales.filter(
    (s) =>
      s.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground-secondary">Loading sales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="fluent-title text-foreground">Sales History</h1>
          <p className="fluent-body text-foreground-secondary mt-1">
            {filteredSales.length} sales
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <FluentCard elevation="depth4" className="p-4">
        <div className="flex flex-col md:flex-row gap-2">
          <FluentInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by sale number or customer..."
            icon={<Search className="w-4 h-4" />}
            className="flex-1"
          />
          <FluentButton appearance="subtle" icon={<Calendar className="w-4 h-4" />}>
            Filter by Date
          </FluentButton>
        </div>
      </FluentCard>

      {/* Sales List */}
      <div className="space-y-3">
        {filteredSales.map((sale) => (
          <FluentCard key={sale.id} elevation="depth4" hover className="p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Icon */}
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-primary" />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="fluent-body font-medium text-foreground">
                    {sale.saleNumber}
                  </h4>
                  <FluentBadge
                    appearance={
                      sale.status === 'COMPLETED'
                        ? 'success'
                        : sale.status === 'VOIDED'
                        ? 'error'
                        : 'warning'
                    }
                    size="small"
                  >
                    {sale.status}
                  </FluentBadge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground-secondary">
                  <span>
                    {new Date(sale.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {sale.customer && <span>Customer: {sale.customer.name}</span>}
                  <span>Cashier: {sale.user.name}</span>
                  <span>Items: {sale._count?.items || 0}</span>
                  <span>Method: {sale.paymentMethod}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="flex flex-col md:items-end gap-2">
                <div className="text-right">
                  <p className="fluent-caption text-foreground-secondary">Total</p>
                  <p className="fluent-heading text-foreground">
                    ₺{sale.total.toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <FluentButton
                    appearance="subtle"
                    size="small"
                    icon={<Eye className="w-3 h-3" />}
                  >
                    View
                  </FluentButton>
                  <FluentButton
                    appearance="subtle"
                    size="small"
                    icon={<Printer className="w-3 h-3" />}
                    onClick={() => handlePrint(sale.id)}
                  >
                    Print
                  </FluentButton>
                </div>
              </div>
            </div>
          </FluentCard>
        ))}
      </div>

      {filteredSales.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
          <p className="fluent-body text-foreground-secondary">
            {searchTerm ? 'No sales found' : 'No sales yet'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Sales;

