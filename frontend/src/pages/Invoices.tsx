import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, FileText, Eye, Printer, Download, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Breadcrumbs from '../components/Breadcrumbs';
import { LoadingPage } from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/ui/StatCard';
import api from '../lib/api';
import { formatCurrency } from '../lib/utils';
import toast from 'react-hot-toast';

/* ============================================
   INVOICE LIST PAGE (Apple Invoice Style)
   Numbers/Pages Style Invoice Management
   ============================================ */

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  totalAmount: number;
  status: 'paid' | 'pending' | 'cancelled';
  createdAt: string;
}

const Invoices: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      // TODO: Implement real invoice endpoint
      // const response = await api.get('/invoices');
      // setInvoices(response.data);
      
      // Mock data for now
      setInvoices([
        {
          id: '1',
          invoiceNumber: 'INV-2025-001',
          customerId: '1',
          customerName: 'Ahmet Yılmaz',
          totalAmount: 1250.50,
          status: 'paid',
          createdAt: '2025-10-25T10:30:00Z',
        },
        {
          id: '2',
          invoiceNumber: 'INV-2025-002',
          customerId: '2',
          customerName: 'Mehmet Kaya',
          totalAmount: 850.00,
          status: 'pending',
          createdAt: '2025-10-26T14:15:00Z',
        },
      ]);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Faturalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((invoice) =>
    invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => i.status === 'pending').length,
    totalAmount: invoices.reduce((sum, i) => sum + i.totalAmount, 0),
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-500/10 text-red-600 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'Ödendi';
      case 'pending':
        return 'Beklemede';
      case 'cancelled':
        return 'İptal';
      default:
        return status;
    }
  };

  if (loading) {
    return <LoadingPage message="Faturalar yükleniyor..." />;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[34px] font-bold text-foreground tracking-tight">
            Faturalar
          </h1>
          <p className="text-[15px] text-muted-foreground mt-1">
            Fatura oluşturun ve yönetin
          </p>
        </div>
        <Button variant="filled" size="default" onClick={() => navigate('/invoices/create')}>
          <Plus className="w-4 h-4" />
          Yeni Fatura
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <StatCard
          title="Toplam Fatura"
          value={stats.total.toString()}
          description="Tüm faturalar"
          icon={FileText}
          color="from-blue-600 to-blue-700"
        />
        <StatCard
          title="Ödenen"
          value={stats.paid.toString()}
          description="Tamamlanmış faturalar"
          icon={CheckCircle2}
          color="from-green-600 to-green-700"
        />
        <StatCard
          title="Bekleyen"
          value={stats.pending.toString()}
          description="Ödeme bekleniyor"
          icon={Clock}
          color="from-yellow-600 to-yellow-700"
        />
        <StatCard
          title="Toplam Tutar"
          value={formatCurrency(stats.totalAmount)}
          description="Tüm faturalar"
          icon={FileText}
          color="from-purple-600 to-purple-700"
        />
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Fatura ara (numara, müşteri)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice List */}
      <Card>
        <CardHeader>
          <CardTitle>Tüm Faturalar</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length > 0 ? (
            <div className="space-y-2">
              {filteredInvoices.map((invoice) => (
                <motion.div
                  key={invoice.id}
                  whileHover={{ scale: 1.005 }}
                  className="flex items-center justify-between p-4 rounded-[10px] hover:bg-muted transition-colors border border-transparent hover:border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-[10px] bg-primary/10">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-foreground">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-[13px] text-muted-foreground mt-0.5">
                        {invoice.customerName} • {new Date(invoice.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[17px] font-semibold text-foreground">
                        {formatCurrency(invoice.totalAmount)}
                      </p>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium mt-1 ${getStatusColor(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        {getStatusText(invoice.status)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button variant="plain" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="plain" size="icon">
                        <Printer className="w-4 h-4" />
                      </Button>
                      <Button variant="plain" size="icon">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="Fatura Bulunamadı"
              description="Henüz hiç fatura oluşturulmamış. Yeni bir fatura oluşturmak için yukarıdaki butona tıklayın."
              actionLabel="Yeni Fatura Oluştur"
              onAction={() => navigate('/invoices/create')}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Invoices;

