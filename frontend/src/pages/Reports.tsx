import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Package, Users, Banknote, FileText, 
  Download, Calendar, Filter, TrendingDown, ShoppingCart, DollarSign
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Line, Bar, Pie } from 'react-chartjs-2';
import FluentCard from '../components/fluent/FluentCard';
import FluentButton from '../components/fluent/FluentButton';
import FluentBadge from '../components/fluent/FluentBadge';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

type ReportType = 'sales' | 'products' | 'customers' | 'financial' | 'inventory';

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const [activeReport, setActiveReport] = useState<ReportType>('sales');
  const [isLoading, setIsLoading] = useState(false);
  
  // Date filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Report data
  const [salesReport, setSalesReport] = useState<any>(null);
  const [productsReport, setProductsReport] = useState<any>(null);
  const [customersReport, setCustomersReport] = useState<any>(null);
  const [financialReport, setFinancialReport] = useState<any>(null);
  const [inventoryReport, setInventoryReport] = useState<any>(null);

  useEffect(() => {
    loadReport(activeReport);
  }, [activeReport, startDate, endDate]);

  const loadReport = async (type: ReportType) => {
    setIsLoading(true);
    try {
      if (type === 'sales') {
        const { data } = await api.get('/reports/sales', {
          params: { startDate, endDate, groupBy: 'day' },
        });
        setSalesReport(data);
      } else if (type === 'products') {
        const { data } = await api.get('/reports/products', {
          params: { startDate, endDate, limit: 20 },
        });
        setProductsReport(data);
      } else if (type === 'customers') {
        const { data } = await api.get('/reports/customers', {
          params: { startDate, endDate },
        });
        setCustomersReport(data);
      } else if (type === 'financial') {
        const { data } = await api.get('/reports/financial', {
          params: { startDate, endDate },
        });
        setFinancialReport(data);
      } else if (type === 'inventory') {
        const { data } = await api.get('/reports/inventory');
        setInventoryReport(data);
      }
    } catch (error) {
      console.error('Report load error:', error);
      toast.error('Rapor yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      let data = null;
      let reportType = '';

      if (activeReport === 'sales' && salesReport) {
        data = salesReport;
        reportType = 'sales';
      } else if (activeReport === 'products' && productsReport) {
        data = productsReport;
        reportType = 'products';
      }

      if (!data) {
        toast.error('Dışa aktarılacak veri yok');
        return;
      }

      const response = await api.post('/reports/export', {
        reportType,
        format: 'excel',
        data,
      }, {
        responseType: 'blob',
      });

      // Download file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}-report-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Rapor indirildi!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Rapor dışa aktarılamadı');
    }
  };

  const reportTabs = [
    { id: 'sales' as ReportType, title: 'Satış Raporu', icon: BarChart3, color: 'text-blue-600' },
    { id: 'products' as ReportType, title: 'Ürün Performansı', icon: Package, color: 'text-green-600' },
    { id: 'customers' as ReportType, title: 'Müşteri Analizi', icon: Users, color: 'text-purple-600' },
    { id: 'financial' as ReportType, title: 'Finansal Rapor', icon: Banknote, color: 'text-orange-600' },
    { id: 'inventory' as ReportType, title: 'Envanter Raporu', icon: TrendingUp, color: 'text-indigo-600' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 fluent-mica">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            📊 Raporlar
          </h1>
          <p className="text-base text-foreground-secondary">
            İşletmenizin performansını detaylı raporlarla analiz edin
          </p>
        </div>
        <div className="flex gap-2">
          <FluentButton
            appearance="subtle"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExport}
          >
            Excel İndir
          </FluentButton>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                ${activeReport === tab.id
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-background-alt text-foreground hover:bg-background-alt/60'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium text-sm">{tab.title}</span>
            </button>
          );
        })}
      </div>

      {/* Date Filter */}
      {activeReport !== 'inventory' && (
        <FluentCard depth="depth-4" className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-foreground-secondary" />
              <span className="text-sm font-medium text-foreground">Tarih Aralığı:</span>
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 text-sm bg-input border border-border rounded text-foreground"
            />
            <span className="text-foreground-secondary">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 text-sm bg-input border border-border rounded text-foreground"
            />
            <FluentButton
              appearance="primary"
              size="small"
              onClick={() => loadReport(activeReport)}
            >
              Uygula
            </FluentButton>
          </div>
        </FluentCard>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-foreground-secondary">Rapor yükleniyor...</p>
          </div>
        </div>
      )}

      {/* Sales Report */}
      {!isLoading && activeReport === 'sales' && salesReport && (
        <SalesReportView data={salesReport} />
      )}

      {/* Products Report */}
      {!isLoading && activeReport === 'products' && productsReport && (
        <ProductsReportView data={productsReport} />
      )}

      {/* Customers Report */}
      {!isLoading && activeReport === 'customers' && customersReport && (
        <CustomersReportView data={customersReport} />
      )}

      {/* Financial Report */}
      {!isLoading && activeReport === 'financial' && financialReport && (
        <FinancialReportView data={financialReport} />
      )}

      {/* Inventory Report */}
      {!isLoading && activeReport === 'inventory' && inventoryReport && (
        <InventoryReportView data={inventoryReport} />
      )}
    </div>
  );
};

// SALES REPORT VIEW
const SalesReportView: React.FC<{ data: any }> = ({ data }) => {
  const chartData = {
    labels: data.timeSeriesData.map((d: any) => d.date),
    datasets: [
      {
        label: 'Gelir (₺)',
        data: data.timeSeriesData.map((d: any) => d.revenue),
        borderColor: 'hsl(var(--primary))',
        backgroundColor: 'hsl(var(--primary) / 0.1)',
        fill: true,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FluentCard depth="depth-4" className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-foreground-secondary">Toplam Satış</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{data.summary.totalSales}</p>
        </FluentCard>

        <FluentCard depth="depth-4" className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <p className="text-xs text-foreground-secondary">Toplam Gelir</p>
          </div>
          <p className="text-2xl font-bold text-green-600">₺{data.summary.totalRevenue}</p>
        </FluentCard>

        <FluentCard depth="depth-4" className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <p className="text-xs text-foreground-secondary">Ort. Sepet Değeri</p>
          </div>
          <p className="text-2xl font-bold text-foreground">₺{data.summary.averageOrderValue}</p>
        </FluentCard>

        <FluentCard depth="depth-4" className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-orange-600" />
            <p className="text-xs text-foreground-secondary">Toplam Ürün</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{data.summary.totalItems}</p>
        </FluentCard>
      </div>

      {/* Chart */}
      <FluentCard depth="depth-4" className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Satış Trendi</h3>
        <div className="h-64">
          <Line 
            data={chartData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
              },
            }}
          />
        </div>
      </FluentCard>

      {/* Payment Methods */}
      <FluentCard depth="depth-4" className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Ödeme Yöntemleri</h3>
        <div className="space-y-3">
          {Object.entries(data.paymentMethodBreakdown).map(([method, stats]: [string, any]) => (
            <div key={method} className="flex items-center justify-between p-3 bg-background-alt rounded">
              <div>
                <p className="font-medium text-foreground">{method}</p>
                <p className="text-sm text-foreground-secondary">{stats.count} işlem</p>
              </div>
              <p className="text-lg font-bold text-foreground">₺{Number(stats.total).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </FluentCard>

      {/* User Breakdown */}
      <FluentCard depth="depth-4" className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Personel Performansı</h3>
        <div className="space-y-3">
          {Object.entries(data.userBreakdown).map(([user, stats]: [string, any]) => (
            <div key={user} className="flex items-center justify-between p-3 bg-background-alt rounded">
              <div>
                <p className="font-medium text-foreground">{user}</p>
                <p className="text-sm text-foreground-secondary">{stats.count} satış</p>
              </div>
              <p className="text-lg font-bold text-foreground">₺{Number(stats.total).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </FluentCard>
    </div>
  );
};

// PRODUCTS REPORT VIEW
const ProductsReportView: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FluentCard depth="depth-4" className="p-4">
          <p className="text-xs text-foreground-secondary mb-1">Toplam Ürün</p>
          <p className="text-2xl font-bold text-foreground">{data.summary.totalProducts}</p>
        </FluentCard>
        <FluentCard depth="depth-4" className="p-4">
          <p className="text-xs text-foreground-secondary mb-1">Satılan Miktar</p>
          <p className="text-2xl font-bold text-foreground">{data.summary.totalQuantitySold}</p>
        </FluentCard>
        <FluentCard depth="depth-4" className="p-4">
          <p className="text-xs text-foreground-secondary mb-1">Toplam Gelir</p>
          <p className="text-2xl font-bold text-green-600">₺{data.summary.totalRevenue}</p>
        </FluentCard>
        <FluentCard depth="depth-4" className="p-4">
          <p className="text-xs text-foreground-secondary mb-1">Toplam Kar</p>
          <p className="text-2xl font-bold text-blue-600">₺{data.summary.totalProfit}</p>
        </FluentCard>
      </div>

      {/* Top Products Table */}
      <FluentCard depth="depth-4" className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">En Çok Satan Ürünler</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-sm font-medium text-foreground-secondary">Ürün</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-foreground-secondary">Kategori</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">Satılan</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">Gelir</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">Kar</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">Kar Marjı</th>
              </tr>
            </thead>
            <tbody>
              {data.topProducts.map((product: any, idx: number) => (
                <tr key={idx} className="border-b border-border/50 hover:bg-background-alt">
                  <td className="py-3 px-3">
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="text-xs text-foreground-secondary">{product.barcode}</p>
                  </td>
                  <td className="py-3 px-3 text-foreground-secondary">{product.category}</td>
                  <td className="py-3 px-3 text-right text-foreground">{product.quantitySold}</td>
                  <td className="py-3 px-3 text-right font-medium text-foreground">
                    ₺{Number(product.totalRevenue).toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-green-600">
                    ₺{Number(product.totalProfit).toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <FluentBadge appearance={Number(product.profitMargin) > 30 ? 'success' : 'warning'}>
                      {product.profitMargin}%
                    </FluentBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FluentCard>

      {/* Category Breakdown */}
      <FluentCard depth="depth-4" className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Kategori Dağılımı</h3>
        <div className="space-y-3">
          {Object.entries(data.categoryBreakdown).map(([category, stats]: [string, any]) => (
            <div key={category} className="flex items-center justify-between p-3 bg-background-alt rounded">
              <div className="flex-1">
                <p className="font-medium text-foreground">{category}</p>
                <p className="text-sm text-foreground-secondary">
                  {stats.productsCount} ürün • {stats.quantitySold} satış
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground">₺{Number(stats.revenue).toFixed(2)}</p>
                <p className="text-sm text-green-600">+₺{Number(stats.profit).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </FluentCard>
    </div>
  );
};

// CUSTOMERS REPORT VIEW
const CustomersReportView: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FluentCard depth="depth-4" className="p-4">
          <p className="text-xs text-foreground-secondary mb-1">Toplam Müşteri</p>
          <p className="text-2xl font-bold text-foreground">{data.summary.totalCustomers}</p>
        </FluentCard>
        <FluentCard depth="depth-4" className="p-4">
          <p className="text-xs text-foreground-secondary mb-1">Aktif Müşteri</p>
          <p className="text-2xl font-bold text-green-600">{data.summary.activeCustomers}</p>
        </FluentCard>
        <FluentCard depth="depth-4" className="p-4">
          <p className="text-xs text-foreground-secondary mb-1">Yeni Müşteri</p>
          <p className="text-2xl font-bold text-blue-600">{data.summary.newCustomers}</p>
        </FluentCard>
        <FluentCard depth="depth-4" className="p-4">
          <p className="text-xs text-foreground-secondary mb-1">Ort. LTV</p>
          <p className="text-2xl font-bold text-purple-600">₺{data.summary.averageLifetimeValue}</p>
        </FluentCard>
      </div>

      {/* Segment Distribution */}
      <FluentCard depth="depth-4" className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Müşteri Segmentleri</h3>
        <div className="space-y-3">
          {Object.entries(data.segmentDistribution).map(([segment, stats]: [string, any]) => (
            <div key={segment} className="flex items-center justify-between p-3 bg-background-alt rounded">
              <div>
                <p className="font-medium text-foreground">{segment}</p>
                <p className="text-sm text-foreground-secondary">{stats.count} müşteri</p>
              </div>
              <p className="text-lg font-bold text-foreground">₺{Number(stats.totalRevenue).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </FluentCard>

      {/* Top Customers */}
      <FluentCard depth="depth-4" className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">En Değerli Müşteriler</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-sm font-medium text-foreground-secondary">Müşteri</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">Satış</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">Harcama</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">Ort. Sepet</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-foreground-secondary">Segment</th>
              </tr>
            </thead>
            <tbody>
              {data.topCustomers.map((customer: any, idx: number) => (
                <tr key={idx} className="border-b border-border/50 hover:bg-background-alt">
                  <td className="py-3 px-3">
                    <p className="font-medium text-foreground">{customer.name}</p>
                    <p className="text-xs text-foreground-secondary">{customer.email}</p>
                  </td>
                  <td className="py-3 px-3 text-right text-foreground">{customer.frequency}</td>
                  <td className="py-3 px-3 text-right font-medium text-foreground">
                    ₺{Number(customer.totalSpent).toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right text-foreground">₺{customer.averageOrderValue}</td>
                  <td className="py-3 px-3 text-center">
                    <FluentBadge 
                      appearance={
                        customer.segment === 'Champions' ? 'success' :
                        customer.segment === 'Loyal' ? 'info' :
                        customer.segment === 'Potential' ? 'warning' : 'error'
                      }
                    >
                      {customer.segment}
                    </FluentBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FluentCard>
    </div>
  );
};

// FINANCIAL REPORT VIEW
const FinancialReportView: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FluentCard depth="depth-4" className="p-6">
          <h4 className="text-sm font-medium text-foreground-secondary mb-4">Gelir & Gider</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-foreground">Toplam Gelir</span>
              <span className="font-bold text-green-600">₺{data.summary.totalRevenue}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">Satılan Mal Maliyeti</span>
              <span className="font-bold text-orange-600">-₺{data.summary.cogs}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="font-medium text-foreground">Brüt Kar</span>
              <span className="font-bold text-blue-600">₺{data.summary.grossProfit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">Toplam Gider</span>
              <span className="font-bold text-red-600">-₺{data.summary.totalExpenses}</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-border">
              <span className="font-bold text-foreground">Net Kar</span>
              <span className="text-xl font-bold text-green-600">₺{data.summary.netProfit}</span>
            </div>
          </div>
        </FluentCard>

        <FluentCard depth="depth-4" className="p-6">
          <h4 className="text-sm font-medium text-foreground-secondary mb-4">Kar Marjları</h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-foreground">Brüt Kar Marjı</span>
                <span className="font-bold text-foreground">{data.summary.grossProfitMargin}</span>
              </div>
              <div className="w-full h-2 bg-background-alt rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: data.summary.grossProfitMargin }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-foreground">Net Kar Marjı</span>
                <span className="font-bold text-foreground">{data.summary.netProfitMargin}</span>
              </div>
              <div className="w-full h-2 bg-background-alt rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-600 rounded-full"
                  style={{ width: data.summary.netProfitMargin }}
                />
              </div>
            </div>
          </div>
        </FluentCard>
      </div>

      {/* Expense Breakdown */}
      <FluentCard depth="depth-4" className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Gider Dağılımı</h3>
        <div className="space-y-3">
          {Object.entries(data.expenseBreakdown).map(([category, amount]: [string, any]) => (
            <div key={category} className="flex items-center justify-between p-3 bg-background-alt rounded">
              <span className="font-medium text-foreground">{category}</span>
              <span className="font-bold text-red-600">₺{Number(amount).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </FluentCard>
    </div>
  );
};

// INVENTORY REPORT VIEW
const InventoryReportView: React.FC<{ data: any }> = ({ data }) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'low' | 'normal'>('all');

  const filteredProducts = filter === 'all' 
    ? data.products 
    : data.products.filter((p: any) => p.status === filter);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FluentCard depth="depth-4" className="p-4">
          <p className="text-xs text-foreground-secondary mb-1">Toplam Ürün</p>
          <p className="text-2xl font-bold text-foreground">{data.summary.totalProducts}</p>
        </FluentCard>
        <FluentCard depth="depth-4" className="p-4 bg-red-50 dark:bg-red-900/10">
          <p className="text-xs text-red-600 mb-1">Tükenen Stok</p>
          <p className="text-2xl font-bold text-red-600">{data.summary.criticalStock}</p>
        </FluentCard>
        <FluentCard depth="depth-4" className="p-4 bg-orange-50 dark:bg-orange-900/10">
          <p className="text-xs text-orange-600 mb-1">Düşük Stok</p>
          <p className="text-2xl font-bold text-orange-600">{data.summary.lowStock}</p>
        </FluentCard>
        <FluentCard depth="depth-4" className="p-4">
          <p className="text-xs text-foreground-secondary mb-1">Stok Değeri</p>
          <p className="text-2xl font-bold text-green-600">₺{data.summary.totalStockValue}</p>
        </FluentCard>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'critical', 'low', 'normal'].map((f) => (
          <FluentButton
            key={f}
            appearance={filter === f ? 'primary' : 'subtle'}
            size="small"
            onClick={() => setFilter(f as any)}
          >
            {f === 'all' ? 'Tümü' : f === 'critical' ? 'Tükenen' : f === 'low' ? 'Düşük' : 'Normal'}
          </FluentButton>
        ))}
      </div>

      {/* Products Table */}
      <FluentCard depth="depth-4" className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Ürün Stok Durumu</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-sm font-medium text-foreground-secondary">Ürün</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-foreground-secondary">Kategori</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">Stok</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">Min Stok</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-foreground-secondary">Stok Değeri</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-foreground-secondary">Durum</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product: any, idx: number) => (
                <tr key={idx} className="border-b border-border/50 hover:bg-background-alt">
                  <td className="py-3 px-3">
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="text-xs text-foreground-secondary">{product.barcode}</p>
                  </td>
                  <td className="py-3 px-3 text-foreground-secondary">{product.category}</td>
                  <td className="py-3 px-3 text-right font-medium text-foreground">{product.stock}</td>
                  <td className="py-3 px-3 text-right text-foreground-secondary">{product.minStock}</td>
                  <td className="py-3 px-3 text-right text-foreground">₺{product.stockValue}</td>
                  <td className="py-3 px-3 text-center">
                    <FluentBadge 
                      appearance={
                        product.status === 'critical' ? 'error' :
                        product.status === 'low' ? 'warning' : 'success'
                      }
                    >
                      {product.status === 'critical' ? 'Tükendi' : 
                       product.status === 'low' ? 'Düşük' : 'Normal'}
                    </FluentBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FluentCard>
    </div>
  );
};

export default Reports;
