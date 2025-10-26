import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { 
  Receipt, Search, Eye, Trash2, CreditCard, Banknote, 
  ArrowUpDown, Calendar, User, Package, X, Check,
  TrendingUp, DollarSign, ShoppingCart, FileText, Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import StatCard from '../components/ui/StatCard';

interface Sale {
  id: string;
  totalAmount: number;
  discountAmount?: number;
  paymentMethod: string;
  customerId?: string;
  customer?: { name: string; email: string };
  createdAt: string;
  items?: Array<{
    id: string;
    quantity: number;
    price: number;
    product: { name: string; barcode: string };
  }>;
  notes?: string;
}

const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [stats, setStats] = useState({
    todayTotal: 0,
    todayCount: 0,
    weekTotal: 0,
    monthTotal: 0
  });

  useEffect(() => {
    fetchSales();
    fetchStats();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await api.get('/sales', { 
        params: { sortBy: 'createdAt', sortOrder: 'desc', limit: 100 } 
      });
      setSales(response.data.sales || []);
    } catch (error) {
      toast.error('Satışlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats({
        todayTotal: response.data.todayRevenue || 0,
        todayCount: response.data.todaySalesCount || 0,
        weekTotal: response.data.weekRevenue || 0,
        monthTotal: response.data.monthRevenue || 0
      });
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  };

  const handleViewDetail = (sale: Sale) => {
    setSelectedSale(sale);
    setShowDetailModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu satışı silmek istediğinizden emin misiniz?')) return;

    try {
      await api.delete(`/sales/${id}`);
      toast.success('Satış silindi!');
      fetchSales();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Satış silinemedi');
    }
  };

  const handlePrint = () => {
    if (!selectedSale) return;
    toast.success('🖨️ Fiş yazdırılıyor...');
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH': return <Banknote className="w-4 h-4" />;
      case 'CARD': return <CreditCard className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'CASH': return 'Nakit';
      case 'CARD': return 'Kart';
      case 'TRANSFER': return 'Transfer';
      default: return method;
    }
  };

  const filteredSales = sales.filter(sale => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      sale.id.toLowerCase().includes(query) ||
      sale.customer?.name.toLowerCase().includes(query) ||
      sale.customer?.email.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground font-semibold">Satışlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-slate-700 bg-clip-text text-transparent">
            Satışlar
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Tüm satışları görüntüleyin ve yönetin • {sales.length} satış
          </p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Bugünkü Satış"
          value={stats.todayCount}
          description={formatCurrency(stats.todayTotal)}
          icon={ShoppingCart}
          color="from-blue-600 to-blue-700"
        />
        <StatCard
          title="Bugünkü Ciro"
          value={formatCurrency(stats.todayTotal)}
          description={`${stats.todayCount} işlem`}
          icon={TrendingUp}
          color="from-slate-600 to-slate-700"
        />
        <StatCard
          title="Haftalık Ciro"
          value={formatCurrency(stats.weekTotal)}
          description="Son 7 gün"
          icon={DollarSign}
          color="from-blue-500 to-slate-600"
        />
        <StatCard
          title="Aylık Ciro"
          value={formatCurrency(stats.monthTotal)}
          description="Son 30 gün"
          icon={Receipt}
          color="from-slate-500 to-slate-600"
        />
      </div>

      {/* Search & Filters */}
      <Card className="border-2 border-slate-300 dark:border-slate-700">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Satış ID, müşteri adı veya email ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 font-semibold"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table - Desktop */}
      <Card className="border-2 border-slate-300 dark:border-slate-700 hidden md:block">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-b-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            Satış Listesi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900">
                  <TableHead className="font-bold">Tarih & Saat</TableHead>
                  <TableHead className="font-bold">Satış ID</TableHead>
                  <TableHead className="font-bold">Müşteri</TableHead>
                  <TableHead className="font-bold">Ürün Sayısı</TableHead>
                  <TableHead className="font-bold">Tutar</TableHead>
                  <TableHead className="font-bold">Ödeme</TableHead>
                  <TableHead className="font-bold text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                      <p className="text-muted-foreground font-semibold">
                        {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz satış kaydı yok'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id} className="hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors">
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <div>
                            <div className="font-bold">{formatDate(sale.createdAt)}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(sale.createdAt).toLocaleTimeString('tr-TR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm font-semibold">
                        #{sale.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-600" />
                          <span className="font-semibold">
                            {sale.customer?.name || 'Misafir'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-600" />
                          <span className="font-bold">{sale.items?.length || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-lg font-black text-blue-700 dark:text-blue-400">
                          {formatCurrency(sale.totalAmount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
                          {getPaymentMethodIcon(sale.paymentMethod)}
                          <span className="text-sm font-bold">{getPaymentMethodText(sale.paymentMethod)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetail(sale)}
                            className="h-9 px-3 font-bold border-2 border-blue-400 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Fiş
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(sale.id)}
                            className="h-9 w-9 p-0 border-2 border-red-200 hover:bg-red-50 hover:border-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Sales Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {filteredSales.length === 0 ? (
          <Card className="border-2 border-slate-300 dark:border-slate-700">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground font-semibold">
                {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz satış kaydı yok'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSales.map((sale) => (
            <motion.div
              key={sale.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl shadow-md p-4"
            >
              {/* Header: Tarih & ID */}
              <div className="flex justify-between items-start mb-3 pb-3 border-b-2 border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-bold text-base">{formatDate(sale.createdAt)}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleTimeString('tr-TR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
                <div className="font-mono text-sm font-bold text-blue-600">
                  #{sale.id.slice(0, 8).toUpperCase()}
                </div>
              </div>

              {/* Body: Müşteri & Tutar */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Müşteri:</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {sale.customer?.name || 'Misafir'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Ürün:</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {sale.items?.length || 0} adet
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Tutar:</span>
                  <span className="text-2xl font-black text-blue-700 dark:text-blue-400">
                    {formatCurrency(sale.totalAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Ödeme:</span>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    {getPaymentMethodIcon(sale.paymentMethod)}
                    <span className="text-sm font-bold">{getPaymentMethodText(sale.paymentMethod)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t-2 border-slate-100 dark:border-slate-700">
                <Button
                  onClick={() => handleViewDetail(sale)}
                  className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-slate-700 hover:from-blue-700 hover:to-slate-800 text-white font-bold rounded-lg"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Fiş Görüntüle
                </Button>
                <Button
                  onClick={() => handleDelete(sale.id)}
                  variant="outline"
                  className="h-12 w-12 p-0 border-2 border-red-300 hover:bg-red-50 hover:border-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedSale && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-700 to-slate-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Satış Fişi</h2>
                    <p className="text-sm text-blue-100">#{selectedSale.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDetailModal(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {/* Sale Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-400 dark:border-blue-900">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-muted-foreground uppercase">Tarih & Saat</span>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {formatDate(selectedSale.createdAt)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedSale.createdAt).toLocaleTimeString('tr-TR')}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-300 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-bold text-muted-foreground uppercase">Müşteri</span>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {selectedSale.customer?.name || 'Misafir'}
                    </p>
                    {selectedSale.customer?.email && (
                      <p className="text-sm text-muted-foreground">{selectedSale.customer.email}</p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="mb-6">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Ürünler
                  </h3>
                  <div className="space-y-3">
                    {(selectedSale.items || []).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-950/20 dark:to-blue-950/20 rounded-xl border-2 border-slate-300 dark:border-slate-700 hover:shadow-lg transition-all"
                      >
                        {/* Barcode Image */}
                        <div className="relative w-20 h-20 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-600 to-slate-700 p-2 shadow-lg overflow-hidden">
                          <svg
                            viewBox="0 0 200 60"
                            className="w-full h-full"
                            style={{ filter: 'brightness(0) invert(1)' }}
                          >
                            {item.product.barcode.split('').map((digit, i) => (
                              <rect
                                key={i}
                                x={i * 15}
                                y="10"
                                width={parseInt(digit) + 2}
                                height="40"
                                fill="white"
                              />
                            ))}
                          </svg>
                          <div className="absolute bottom-1 left-0 right-0 text-center">
                            <span className="text-[8px] font-black text-white tracking-wider">
                              {item.product.barcode}
                            </span>
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="flex-1">
                          <p className="font-black text-base text-slate-900 dark:text-white mb-1">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground font-mono font-semibold">
                            Barkod: {item.product.barcode}
                          </p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">
                            {item.quantity} adet × {formatCurrency(item.price)}
                          </p>
                        </div>

                        {/* Total */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-muted-foreground font-semibold mb-1">Toplam</p>
                          <p className="text-2xl font-black text-blue-700 dark:text-blue-400">
                            {formatCurrency(item.quantity * item.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 rounded-xl border-2 border-blue-400 dark:border-blue-900">
                  {(selectedSale.discountAmount || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-muted-foreground">Ara Toplam:</span>
                      <span className="font-bold">{formatCurrency(selectedSale.totalAmount + (selectedSale.discountAmount || 0))}</span>
                    </div>
                  )}
                  {(selectedSale.discountAmount || 0) > 0 && (
                    <div className="flex justify-between text-sm text-orange-600">
                      <span className="font-semibold">İndirim:</span>
                      <span className="font-bold">-{formatCurrency(selectedSale.discountAmount || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t-2 border-blue-300 dark:border-blue-800">
                    <span className="text-xl font-black text-slate-900 dark:text-white">TOPLAM:</span>
                    <span className="text-3xl font-black text-blue-700 dark:text-blue-400">
                      {formatCurrency(selectedSale.totalAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-semibold text-muted-foreground">Ödeme Yöntemi:</span>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-slate-300 dark:border-slate-700">
                      {getPaymentMethodIcon(selectedSale.paymentMethod)}
                      <span className="font-bold">{getPaymentMethodText(selectedSale.paymentMethod)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t bg-slate-50 dark:bg-slate-900/50 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12 font-bold"
                  onClick={() => setShowDetailModal(false)}
                >
                  Kapat
                </Button>
                <Button
                  className="flex-1 h-12 font-bold bg-gradient-to-r from-blue-700 to-slate-700 hover:from-blue-600 hover:to-slate-600"
                  onClick={handlePrint}
                >
                  <Printer className="w-5 h-5 mr-2" />
                  Yazdır
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sales;

