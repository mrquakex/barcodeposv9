import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Package, DollarSign, AlertCircle, Download, RefreshCw,
  BarChart3, PieChart, Filter, Search
} from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentButton from '../components/fluent/FluentButton';
import FluentBadge from '../components/fluent/FluentBadge';
import FluentInput from '../components/fluent/FluentInput';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Pie, Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';

interface Product {
  id: string;
  name: string;
  barcode: string;
  stock: number;
  sellPrice: number;
  buyPrice: number;
  category?: { name: string };
  abcClass?: 'A' | 'B' | 'C';
  stockValue?: number;
  salesVolume?: number;
}

const StockValuation: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<string>('ALL');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/products');
      const productsData = response.data.products || [];
      
      // Calculate stock value for each product
      const enrichedProducts = productsData.map((p: any) => ({
        ...p,
        stockValue: p.stock * p.buyPrice,
        salesVolume: Math.floor(Math.random() * 1000), // Simulated - would come from sales data
      }));

      // ABC Classification based on stock value
      const sorted = [...enrichedProducts].sort((a, b) => b.stockValue - a.stockValue);
      const totalValue = sorted.reduce((sum, p) => sum + p.stockValue, 0);
      
      let cumulativeValue = 0;
      const classified = sorted.map((p) => {
        cumulativeValue += p.stockValue;
        const percentage = (cumulativeValue / totalValue) * 100;
        
        let abcClass: 'A' | 'B' | 'C';
        if (percentage <= 80) abcClass = 'A';
        else if (percentage <= 95) abcClass = 'B';
        else abcClass = 'C';
        
        return { ...p, abcClass };
      });

      setProducts(classified);
    } catch (error) {
      toast.error('Ürünler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = () => {
    const data = filteredProducts.map((p) => ({
      'Ürün': p.name,
      'Barkod': p.barcode,
      'Kategori': p.category?.name || '-',
      'Stok': p.stock,
      'Alış Fiyatı': p.buyPrice.toFixed(2),
      'Satış Fiyatı': p.sellPrice.toFixed(2),
      'Stok Değeri': p.stockValue?.toFixed(2) || '0',
      'ABC Sınıfı': p.abcClass || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stok Değerleme');
    XLSX.writeFile(wb, `stok-degerleme-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel dosyası indirildi');
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === 'ALL' || p.abcClass === filterClass;
    return matchesSearch && matchesClass;
  });

  // KPI Calculations
  const totalValue = products.reduce((sum, p) => sum + (p.stockValue || 0), 0);
  const classA = products.filter(p => p.abcClass === 'A');
  const classB = products.filter(p => p.abcClass === 'B');
  const classC = products.filter(p => p.abcClass === 'C');
  
  const classAValue = classA.reduce((sum, p) => sum + (p.stockValue || 0), 0);
  const classBValue = classB.reduce((sum, p) => sum + (p.stockValue || 0), 0);
  const classCValue = classC.reduce((sum, p) => sum + (p.stockValue || 0), 0);

  // Chart Data
  const abcPieData = {
    labels: ['A Sınıfı', 'B Sınıfı', 'C Sınıfı'],
    datasets: [
      {
        data: [classA.length, classB.length, classC.length],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      },
    ],
  };

  const valueBarData = {
    labels: ['A Sınıfı', 'B Sınıfı', 'C Sınıfı'],
    datasets: [
      {
        label: 'Stok Değeri (TL)',
        data: [classAValue, classBValue, classCValue],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
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
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Stok Değerleme & ABC Analizi</h1>
          <p className="text-foreground-secondary mt-1">{products.length} ürün</p>
        </div>
        <div className="flex items-center gap-2">
          <FluentButton
            icon={<Download className="w-4 h-4" />}
            onClick={exportToExcel}
            appearance="subtle"
          >
            Excel
          </FluentButton>
          <FluentButton
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchProducts}
            appearance="subtle"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FluentCard depth="depth-8" className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Toplam Değer</p>
              <p className="text-2xl font-semibold text-foreground">{totalValue.toFixed(0)} TL</p>
            </div>
          </div>
        </FluentCard>

        <FluentCard depth="depth-8" className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-success/10 text-success rounded-lg flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">A Sınıfı</p>
              <p className="text-2xl font-semibold text-foreground">{classA.length} (%{((classA.length/products.length)*100).toFixed(0)})</p>
            </div>
          </div>
        </FluentCard>

        <FluentCard depth="depth-8" className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-warning/10 text-warning rounded-lg flex items-center justify-center shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">B Sınıfı</p>
              <p className="text-2xl font-semibold text-foreground">{classB.length} (%{((classB.length/products.length)*100).toFixed(0)})</p>
            </div>
          </div>
        </FluentCard>

        <FluentCard depth="depth-8" className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-lg flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">C Sınıfı</p>
              <p className="text-2xl font-semibold text-foreground">{classC.length} (%{((classC.length/products.length)*100).toFixed(0)})</p>
            </div>
          </div>
        </FluentCard>
      </div>

      {/* ABC Info Card */}
      <FluentCard depth="depth-4" className="p-5">
        <h2 className="text-lg font-semibold text-foreground mb-3">ABC Analizi Nedir?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-success/5 border border-success/20 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-success rounded-full"></div>
              <h3 className="font-semibold text-foreground">A Sınıfı (%80 Değer)</h3>
            </div>
            <p className="text-foreground-secondary">Yüksek değerli, kritik ürünler. Sıkı kontrol gerektirir.</p>
          </div>
          <div className="p-3 bg-warning/5 border border-warning/20 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-warning rounded-full"></div>
              <h3 className="font-semibold text-foreground">B Sınıfı (%15 Değer)</h3>
            </div>
            <p className="text-foreground-secondary">Orta değerli ürünler. Düzenli kontrol önerilir.</p>
          </div>
          <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-destructive rounded-full"></div>
              <h3 className="font-semibold text-foreground">C Sınıfı (%5 Değer)</h3>
            </div>
            <p className="text-foreground-secondary">Düşük değerli ürünler. Basit kontrol yeterli.</p>
          </div>
        </div>
      </FluentCard>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FluentCard depth="depth-4" className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Ürün Dağılımı (Adet)</h2>
          <div className="h-64 flex items-center justify-center">
            <Pie data={abcPieData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </FluentCard>

        <FluentCard depth="depth-4" className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Değer Dağılımı (TL)</h2>
          <div className="h-64">
            <Bar
              data={valueBarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } },
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
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex gap-2">
            {['ALL', 'A', 'B', 'C'].map((cls) => (
              <FluentButton
                key={cls}
                appearance={filterClass === cls ? 'primary' : 'subtle'}
                size="small"
                onClick={() => setFilterClass(cls)}
              >
                {cls === 'ALL' ? 'Tümü' : `${cls} Sınıfı`}
              </FluentButton>
            ))}
          </div>
        </div>
      </FluentCard>

      {/* Products Table */}
      <FluentCard depth="depth-4" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-alt border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">ABC</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Ürün</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Kategori</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Stok</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Alış</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Satış</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Stok Değeri</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-foreground-secondary">
                    <Package className="w-12 h-12 mx-auto mb-3" />
                    <p>Sonuç bulunamadı</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.slice(0, 100).map((product) => (
                  <tr key={product.id} className="hover:bg-background-alt transition-colors">
                    <td className="px-4 py-3">
                      <FluentBadge
                        appearance={
                          product.abcClass === 'A' ? 'success' :
                          product.abcClass === 'B' ? 'warning' :
                          'error'
                        }
                      >
                        {product.abcClass}
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
                    <td className="px-4 py-3 text-right text-foreground">{product.stock}</td>
                    <td className="px-4 py-3 text-right text-foreground">{product.buyPrice.toFixed(2)} TL</td>
                    <td className="px-4 py-3 text-right text-foreground">{product.sellPrice.toFixed(2)} TL</td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">
                      {product.stockValue?.toFixed(2)} TL
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredProducts.length > 100 && (
          <div className="px-4 py-3 bg-background-alt border-t border-border text-center text-sm text-foreground-secondary">
            İlk 100 ürün gösteriliyor. Daha fazla görmek için filtreleme yapın.
          </div>
        )}
      </FluentCard>
    </div>
  );
};

export default StockValuation;

