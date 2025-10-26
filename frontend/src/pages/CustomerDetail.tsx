import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Mail, MapPin, TrendingUp, ShoppingCart, DollarSign, Calendar, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Breadcrumbs from '../components/Breadcrumbs';
import { LoadingPage } from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import api from '../lib/api';
import { formatCurrency } from '../lib/utils';
import toast from 'react-hot-toast';

/* ============================================
   CUSTOMER DETAIL PAGE (Apple CRM Style)
   iOS/macOS Contact Card Design
   ============================================ */

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  debt: number;
  createdAt: string;
}

interface CustomerStats {
  totalSpent: number;
  totalOrders: number;
  avgOrderValue: number;
  lastPurchase: string;
}

interface Sale {
  id: string;
  total: number;
  createdAt: string;
  items: number;
}

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCustomerData();
    }
  }, [id]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      // Fetch customer info
      const customerRes = await api.get(`/customers/${id}`);
      setCustomer(customerRes.data);

      // Fetch customer sales
      const salesRes = await api.get(`/sales?customerId=${id}`);
      setSales(salesRes.data.slice(0, 10)); // Last 10 sales

      // Calculate stats
      const totalSpent = salesRes.data.reduce((sum: number, sale: Sale) => sum + sale.total, 0);
      const totalOrders = salesRes.data.length;
      const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      const lastPurchase = salesRes.data[0]?.createdAt || '-';

      setStats({ totalSpent, totalOrders, avgOrderValue, lastPurchase });
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast.error('Müşteri bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) return;
    
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Müşteri silindi');
      navigate('/customers');
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Müşteri silinemedi');
    }
  };

  if (loading) {
    return <LoadingPage message="Müşteri bilgileri yükleniyor..." />;
  }

  if (!customer) {
    return (
      <div className="p-6">
        <EmptyState
          icon={ShoppingCart}
          title="Müşteri Bulunamadı"
          description="Aradığınız müşteri sistemde bulunamadı."
          actionLabel="Müşterilere Dön"
          onAction={() => navigate('/customers')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="plain"
            size="icon"
            onClick={() => navigate('/customers')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-[34px] font-bold text-foreground tracking-tight">
              {customer.name}
            </h1>
            <p className="text-[15px] text-muted-foreground mt-1">
              Müşteri No: {customer.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="tinted" size="default">
            <Edit className="w-4 h-4" />
            Düzenle
          </Button>
          <Button variant="destructive" size="default" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
            Sil
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-[10px] bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <p className="text-[13px] text-muted-foreground font-medium">Toplam Harcama</p>
            </div>
            <p className="text-[28px] font-bold text-foreground tracking-tight">
              {formatCurrency(stats?.totalSpent || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-[10px] bg-primary/10">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              <p className="text-[13px] text-muted-foreground font-medium">Toplam Sipariş</p>
            </div>
            <p className="text-[28px] font-bold text-foreground tracking-tight">
              {stats?.totalOrders || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-[10px] bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <p className="text-[13px] text-muted-foreground font-medium">Ort. Sipariş Değeri</p>
            </div>
            <p className="text-[28px] font-bold text-foreground tracking-tight">
              {formatCurrency(stats?.avgOrderValue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className={customer.debt > 0 ? 'border-destructive/30' : ''}>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2.5 rounded-[10px] ${customer.debt > 0 ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                <DollarSign className={`w-5 h-5 ${customer.debt > 0 ? 'text-destructive' : 'text-primary'}`} />
              </div>
              <p className="text-[13px] text-muted-foreground font-medium">Borç</p>
            </div>
            <p className={`text-[28px] font-bold tracking-tight ${customer.debt > 0 ? 'text-destructive' : 'text-foreground'}`}>
              {formatCurrency(customer.debt)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>İletişim Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.phone && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[8px] bg-muted">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase">Telefon</p>
                  <p className="text-[15px] text-foreground font-medium">{customer.phone}</p>
                </div>
              </div>
            )}

            {customer.email && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[8px] bg-muted">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase">E-posta</p>
                  <p className="text-[15px] text-foreground font-medium">{customer.email}</p>
                </div>
              </div>
            )}

            {customer.address && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[8px] bg-muted">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase">Adres</p>
                  <p className="text-[15px] text-foreground font-medium">{customer.address}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[8px] bg-muted">
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium uppercase">Kayıt Tarihi</p>
                <p className="text-[15px] text-foreground font-medium">
                  {new Date(customer.createdAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase History */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Son Alışverişler</CardTitle>
          </CardHeader>
          <CardContent>
            {sales.length > 0 ? (
              <div className="space-y-2">
                {sales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-3 rounded-[10px] hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-[8px] bg-primary/10">
                        <ShoppingCart className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[15px] font-medium text-foreground">
                          Sipariş #{sale.id.slice(0, 8)}
                        </p>
                        <p className="text-[13px] text-muted-foreground">
                          {new Date(sale.createdAt).toLocaleDateString('tr-TR')} • {sale.items} ürün
                        </p>
                      </div>
                    </div>
                    <p className="text-[17px] font-semibold text-foreground">
                      {formatCurrency(sale.total)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ShoppingCart}
                title="Henüz Alışveriş Yok"
                description="Bu müşterinin henüz alışveriş geçmişi bulunmuyor."
                actionLabel="Yeni Satış Yap"
                onAction={() => navigate('/pos')}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerDetail;

