import React, { useState, useEffect } from 'react';
import { 
  Search, TrendingUp, TrendingDown, ArrowRightLeft, Calendar, 
  Plus, Download, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Package
} from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentButton from '../components/fluent/FluentButton';
import FluentBadge from '../components/fluent/FluentBadge';
import FluentDialog from '../components/fluent/FluentDialog';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import * as XLSX from 'xlsx';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  product: { id: string; name: string; barcode: string };
  user?: { name: string };
  createdAt: string;
  notes?: string;
}

interface Product {
  id: string;
  name: string;
  barcode: string;
  stock: number;
}

const StockMovementsUpgraded: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('all'); // all, 7days, 30days, custom
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [movementQuantity, setMovementQuantity] = useState<number>(0);
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN');
  const [movementNotes, setMovementNotes] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [movementsRes, productsRes] = await Promise.all([
        api.get('/stock-movements'),
        api.get('/products'),
      ]);
      setMovements(movementsRes.data.movements || movementsRes.data || []);
      setProducts(productsRes.data.products || []);
    } catch (error) {
      toast.error('Veri alınamadı');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || movementQuantity <= 0) {
      toast.error('Lütfen ürün seçin ve miktar girin');
      return;
    }

    try {
      await api.post(`/products/${selectedProduct}/add-stock`, {
        quantity: movementType === 'IN' ? movementQuantity : -movementQuantity,
        reason: movementNotes || `Manuel ${movementType === 'IN' ? 'giriş' : 'çıkış'}`,
      });

      toast.success('Hareket başarıyla eklendi');
      setShowAddDialog(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Hareket eklenemedi');
    }
  };

  const resetForm = () => {
    setSelectedProduct('');
    setMovementQuantity(0);
    setMovementType('IN');
    setMovementNotes('');
  };

  const exportToExcel = () => {
    const data = filteredMovements.map((m) => ({
      Tarih: new Date(m.createdAt).toLocaleString('tr-TR'),
      Ürün: m.product.name,
      Barkod: m.product.barcode,
      Tip: m.type,
      Miktar: m.quantity,
      'Önceki Stok': m.previousStock,
      'Yeni Stok': m.newStock,
      Kullanıcı: m.user?.name || '-',
      Notlar: m.notes || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stok Hareketleri');
    XLSX.writeFile(wb, `stok-hareketleri-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel dosyası indirildi');
  };

  // Date filtering
  const getDateFilteredMovements = () => {
    if (dateFilter === 'all') return movements;

    const now = new Date();
    const filtered = movements.filter((m) => {
      const createdAt = new Date(m.createdAt);

      if (dateFilter === '7days') {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        return createdAt >= sevenDaysAgo;
      }

      if (dateFilter === '30days') {
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return createdAt >= thirtyDaysAgo;
      }

      if (dateFilter === 'custom' && customDateStart && customDateEnd) {
        const start = new Date(customDateStart);
        const end = new Date(customDateEnd);
        return createdAt >= start && createdAt <= end;
      }

      return true;
    });

    return filtered;
  };

  const filteredMovements = getDateFilteredMovements().filter((m) => {
    const matchesSearch =
      m.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.product.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // KPI calculations
  const totalIn = movements.filter((m) => m.type === 'IN').reduce((sum, m) => sum + m.quantity, 0);
  const totalOut = movements.filter((m) => m.type === 'OUT').reduce((sum, m) => sum + m.quantity, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMovements = movements.filter((m) => new Date(m.createdAt) >= today);
  const weekMovements = movements.filter((m) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    return new Date(m.createdAt) >= sevenDaysAgo;
  });

  // Chart data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const chartData = {
    labels: last7Days.map((d) => new Date(d).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Giriş',
        data: last7Days.map((d) => {
          return movements
            .filter((m) => m.type === 'IN' && m.createdAt.startsWith(d))
            .reduce((sum, m) => sum + m.quantity, 0);
        }),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
      },
      {
        label: 'Çıkış',
        data: last7Days.map((d) => {
          return movements
            .filter((m) => m.type === 'OUT' && m.createdAt.startsWith(d))
            .reduce((sum, m) => sum + m.quantity, 0);
        }),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.3,
      },
    ],
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'IN':
        return <TrendingUp className="w-5 h-5 text-success" />;
      case 'OUT':
        return <TrendingDown className="w-5 h-5 text-destructive" />;
      case 'TRANSFER':
        return <ArrowRightLeft className="w-5 h-5 text-primary" />;
      default:
        return <Package className="w-5 h-5 text-foreground-secondary" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground-secondary">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Stok Hareketleri</h1>
          <p className="text-foreground-secondary mt-1">{filteredMovements.length} hareket</p>
        </div>
        <div className="flex items-center gap-2">
          <FluentButton
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowAddDialog(true)}
            appearance="primary"
          >
            Hareket Ekle
          </FluentButton>
          <FluentButton
            icon={<Download className="w-4 h-4" />}
            onClick={exportToExcel}
            appearance="subtle"
          >
            Excel
          </FluentButton>
          <FluentButton
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchData}
            appearance="subtle"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FluentCard depth="depth-8" className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-success/10 text-success rounded-lg flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Toplam Giriş</p>
              <p className="text-2xl font-semibold text-foreground">{totalIn}</p>
            </div>
          </div>
        </FluentCard>

        <FluentCard depth="depth-8" className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-lg flex items-center justify-center shrink-0">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Toplam Çıkış</p>
              <p className="text-2xl font-semibold text-foreground">{totalOut}</p>
            </div>
          </div>
        </FluentCard>

        <FluentCard depth="depth-8" className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-info/10 text-info rounded-lg flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Bugün</p>
              <p className="text-2xl font-semibold text-foreground">{todayMovements.length}</p>
            </div>
          </div>
        </FluentCard>

        <FluentCard depth="depth-8" className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-warning/10 text-warning rounded-lg flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Bu Hafta</p>
              <p className="text-2xl font-semibold text-foreground">{weekMovements.length}</p>
            </div>
          </div>
        </FluentCard>
      </div>

      {/* Chart */}
      <FluentCard depth="depth-4" className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Son 7 Gün Hareketleri</h2>
        <div className="h-64">
          <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </FluentCard>

      {/* Filters */}
      <FluentCard depth="depth-4" className="p-5 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <FluentInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ürün adı veya barkod ile ara..."
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex gap-2">
            {['ALL', 'IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'].map((type) => (
              <FluentButton
                key={type}
                appearance={filterType === type ? 'primary' : 'subtle'}
                size="small"
                onClick={() => setFilterType(type)}
              >
                {type === 'ALL' ? 'Tümü' : type}
              </FluentButton>
            ))}
          </div>
        </div>

        {/* Date Filter */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex gap-2">
            <FluentButton
              appearance={dateFilter === 'all' ? 'primary' : 'subtle'}
              size="small"
              onClick={() => setDateFilter('all')}
            >
              Tümü
            </FluentButton>
            <FluentButton
              appearance={dateFilter === '7days' ? 'primary' : 'subtle'}
              size="small"
              onClick={() => setDateFilter('7days')}
            >
              Son 7 Gün
            </FluentButton>
            <FluentButton
              appearance={dateFilter === '30days' ? 'primary' : 'subtle'}
              size="small"
              onClick={() => setDateFilter('30days')}
            >
              Son 30 Gün
            </FluentButton>
            <FluentButton
              appearance={dateFilter === 'custom' ? 'primary' : 'subtle'}
              size="small"
              onClick={() => setDateFilter('custom')}
            >
              Özel Tarih
            </FluentButton>
          </div>

          {dateFilter === 'custom' && (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={customDateStart}
                onChange={(e) => setCustomDateStart(e.target.value)}
                className="px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-foreground-secondary">-</span>
              <input
                type="date"
                value={customDateEnd}
                onChange={(e) => setCustomDateEnd(e.target.value)}
                className="px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
        </div>
      </FluentCard>

      {/* Movements List */}
      <div className="space-y-3">
        {paginatedMovements.map((movement) => (
          <FluentCard key={movement.id} depth="depth-4" className="p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-12 h-12 bg-background-alt rounded-full flex items-center justify-center shrink-0">
                {getTypeIcon(movement.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-foreground">{movement.product.name}</h4>
                  <FluentBadge
                    appearance={
                      movement.type === 'IN' ? 'success' :
                      movement.type === 'OUT' ? 'error' :
                      'warning'
                    }
                    size="small"
                  >
                    {movement.type}
                  </FluentBadge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground-secondary">
                  <span>Barkod: {movement.product.barcode}</span>
                  <span>Miktar: {movement.type === 'OUT' ? '-' : '+'}{movement.quantity}</span>
                  <span>Stok: {movement.previousStock} → {movement.newStock}</span>
                  {movement.user && <span>Kullanıcı: {movement.user.name}</span>}
                  <span>{new Date(movement.createdAt).toLocaleString('tr-TR')}</span>
                </div>
                {movement.notes && (
                  <p className="text-sm text-foreground-tertiary mt-1">Not: {movement.notes}</p>
                )}
              </div>
            </div>
          </FluentCard>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <FluentButton
            appearance="subtle"
            size="small"
            icon={<ChevronLeft className="w-4 h-4" />}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          />
          <span className="text-sm text-foreground-secondary">
            Sayfa {currentPage} / {totalPages}
          </span>
          <FluentButton
            appearance="subtle"
            size="small"
            icon={<ChevronRight className="w-4 h-4" />}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          />
        </div>
      )}

      {filteredMovements.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
          <p className="text-foreground-secondary">
            {searchTerm || filterType !== 'ALL' ? 'Sonuç bulunamadı' : 'Henüz hareket yok'}
          </p>
        </div>
      )}

      {/* Add Movement Dialog */}
      <FluentDialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          resetForm();
        }}
        title="Manuel Hareket Ekle"
        size="medium"
      >
        <form onSubmit={handleAddMovement} className="space-y-4 p-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Hareket Tipi</label>
            <div className="flex gap-2">
              <FluentButton
                type="button"
                appearance={movementType === 'IN' ? 'primary' : 'subtle'}
                className="flex-1"
                onClick={() => setMovementType('IN')}
              >
                Giriş (+)
              </FluentButton>
              <FluentButton
                type="button"
                appearance={movementType === 'OUT' ? 'primary' : 'subtle'}
                className="flex-1"
                onClick={() => setMovementType('OUT')}
              >
                Çıkış (-)
              </FluentButton>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Ürün</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Ürün seçin</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.barcode}) - Stok: {p.stock}
                </option>
              ))}
            </select>
          </div>

          <FluentInput
            label="Miktar"
            type="number"
            value={movementQuantity}
            onChange={(e) => setMovementQuantity(parseInt(e.target.value))}
            min="1"
            required
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Notlar (Opsiyonel)</label>
            <textarea
              value={movementNotes}
              onChange={(e) => setMovementNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Hareket ile ilgili notlarınızı buraya yazabilirsiniz..."
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <FluentButton
              type="button"
              onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}
              appearance="subtle"
            >
              İptal
            </FluentButton>
            <FluentButton type="submit" appearance="primary">
              Kaydet
            </FluentButton>
          </div>
        </form>
      </FluentDialog>
    </div>
  );
};

export default StockMovementsUpgraded;

