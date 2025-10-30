import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Package,
  TrendingDown,
  Filter,
  ExternalLink,
  Plus,
  RefreshCw,
} from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentButton from '../components/fluent/FluentButton';
import FluentBadge from '../components/fluent/FluentBadge';
import FluentInput from '../components/fluent/FluentInput';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface Product {
  id: string;
  name: string;
  barcode: string;
  stock: number;
  minStock: number;
  unit: string;
  sellPrice: number;
  category?: {
    id: string;
    name: string;
  };
}

type AlertLevel = 'all' | 'critical' | 'low';

const StockAlerts: React.FC = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<AlertLevel>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStockAlerts();
  }, []);

  const fetchStockAlerts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/products/low-stock');
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Fetch stock alerts error:', error);
      toast.error('Stok uyarıları alınamadı');
    } finally {
      setIsLoading(false);
    }
  };

  // Alert level calculation
  const getAlertLevel = (product: Product): 'critical' | 'low' => {
    if (product.stock === 0) return 'critical';
    if (product.stock <= product.minStock) return 'low';
    return 'low';
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterLevel === 'all') return matchesSearch;
    if (filterLevel === 'critical') return matchesSearch && product.stock === 0;
    if (filterLevel === 'low') return matchesSearch && product.stock > 0 && product.stock <= product.minStock;
    return matchesSearch;
  });

  // KPI calculations
  const criticalCount = products.filter((p) => p.stock === 0).length;
  const lowCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;
  const totalValue = products.reduce((sum, p) => sum + p.stock * p.sellPrice, 0);

  // Chart data
  const pieData = {
    labels: ['Kritik Stok', 'Düşük Stok'],
    datasets: [
      {
        data: [criticalCount, lowCount],
        backgroundColor: ['#ef4444', '#f59e0b'],
        borderColor: ['#dc2626', '#d97706'],
        borderWidth: 1,
      },
    ],
  };

  // Category-based alerts
  const categoryAlerts = products.reduce((acc: any, product) => {
    const categoryName = product.category?.name || 'Kategorisiz';
    if (!acc[categoryName]) {
      acc[categoryName] = { critical: 0, low: 0 };
    }
    if (product.stock === 0) {
      acc[categoryName].critical += 1;
    } else if (product.stock <= product.minStock) {
      acc[categoryName].low += 1;
    }
    return acc;
  }, {});

  const barData = {
    labels: Object.keys(categoryAlerts),
    datasets: [
      {
        label: 'Kritik',
        data: Object.values(categoryAlerts).map((c: any) => c.critical),
        backgroundColor: '#ef4444',
      },
      {
        label: 'Düşük',
        data: Object.values(categoryAlerts).map((c: any) => c.low),
        backgroundColor: '#f59e0b',
      },
    ],
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
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-7 h-7 text-warning" />
          <h1 className="text-2xl font-semibold text-foreground">Stok Uyarıları</h1>
        </div>
        <FluentButton
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={fetchStockAlerts}
          appearance="subtle"
        >
          Yenile
        </FluentButton>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FluentCard depth="depth-8" className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-lg flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Kritik Stok</p>
              <p className="text-2xl font-semibold text-foreground">{criticalCount}</p>
            </div>
          </div>
        </FluentCard>

        <FluentCard depth="depth-8" className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-warning/10 text-warning rounded-lg flex items-center justify-center shrink-0">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Düşük Stok</p>
              <p className="text-2xl font-semibold text-foreground">{lowCount}</p>
            </div>
          </div>
        </FluentCard>

        <FluentCard depth="depth-8" className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-info/10 text-info rounded-lg flex items-center justify-center shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Toplam Uyarı</p>
              <p className="text-2xl font-semibold text-foreground">{criticalCount + lowCount}</p>
            </div>
          </div>
        </FluentCard>

        <FluentCard depth="depth-8" className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-success/10 text-success rounded-lg flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Stok Değeri</p>
              <p className="text-2xl font-semibold text-foreground">{totalValue.toFixed(0)} TL</p>
            </div>
          </div>
        </FluentCard>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FluentCard depth="depth-4" className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Stok Durumu Dağılımı</h2>
          <div className="h-64 flex items-center justify-center">
            <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </FluentCard>

        <FluentCard depth="depth-4" className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Kategoriye Göre Uyarılar</h2>
          <div className="h-64">
            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { stacked: true },
                  y: { stacked: true, beginAtZero: true },
                },
              }}
            />
          </div>
        </FluentCard>
      </div>

      {/* Filters */}
      <FluentCard depth="depth-4" className="p-5">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <FluentInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ürün ara..."
              icon={<Filter className="w-4 h-4" />}
            />
          </div>
          <div className="flex gap-2">
            <FluentButton
              appearance={filterLevel === 'all' ? 'primary' : 'subtle'}
              onClick={() => setFilterLevel('all')}
              size="small"
            >
              Tümü ({products.length})
            </FluentButton>
            <FluentButton
              appearance={filterLevel === 'critical' ? 'primary' : 'subtle'}
              onClick={() => setFilterLevel('critical')}
              size="small"
            >
              Kritik ({criticalCount})
            </FluentButton>
            <FluentButton
              appearance={filterLevel === 'low' ? 'primary' : 'subtle'}
              onClick={() => setFilterLevel('low')}
              size="small"
            >
              Düşük ({lowCount})
            </FluentButton>
          </div>
        </div>
      </FluentCard>

      {/* Alerts List */}
      <FluentCard depth="depth-4" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-alt border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Durum</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Ürün</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Kategori</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Mevcut Stok</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Minimum Stok</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-foreground">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-foreground-secondary">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-success" />
                    <p>Stok uyarısı bulunmuyor</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const level = getAlertLevel(product);
                  return (
                    <tr key={product.id} className="hover:bg-background-alt transition-colors">
                      <td className="px-4 py-3">
                        <FluentBadge appearance={level === 'critical' ? 'error' : 'warning'}>
                          {level === 'critical' ? 'Kritik' : 'Düşük'}
                        </FluentBadge>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                          <p className="text-xs text-foreground-secondary">{product.barcode}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground-secondary">
                        {product.category?.name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-medium ${
                            product.stock === 0 ? 'text-destructive' : 'text-warning'
                          }`}
                        >
                          {product.stock} {product.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground-secondary">
                        {product.minStock} {product.unit}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <FluentButton
                            appearance="subtle"
                            size="small"
                            icon={<ExternalLink className="w-4 h-4" />}
                            onClick={() => navigate(`/products/${product.id}`)}
                          >
                            Detay
                          </FluentButton>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </FluentCard>
    </div>
  );
};

export default StockAlerts;

