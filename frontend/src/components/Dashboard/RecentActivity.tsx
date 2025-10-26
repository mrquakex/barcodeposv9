import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import api from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/utils';
import { Clock, Eye, Trash2, X, Printer, Package, User, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

interface Sale {
  id: string;
  saleNumber: string;
  totalAmount: number;
  discountAmount?: number;
  netAmount: number;
  paymentMethod: string;
  customerId?: string;
  customer?: { name: string; email: string };
  createdAt: string;
  user?: { name: string; email: string };
  items?: Array<{
    id: string;
    quantity: number;
    price: number;
    product: { name: string; barcode: string };
  }>;
  notes?: string;
}

const RecentActivity: React.FC = () => {
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchRecentSales();
  }, []);

  const fetchRecentSales = async () => {
    try {
      const response = await api.get('/dashboard/recent-sales?limit=5');
      setRecentSales(response.data.sales);
    } catch (error) {
      console.error(error);
    }
  };

  const viewSale = async (saleId: string) => {
    try {
      const response = await api.get(`/sales/${saleId}`);
      setSelectedSale(response.data.sale);
      setShowModal(true);
    } catch (error) {
      toast.error('Satış detayları yüklenemedi');
    }
  };

  const deleteSale = async (saleId: string) => {
    if (!confirm('Bu satışı silmek istediğinize emin misiniz?')) return;

    try {
      await api.delete(`/sales/${saleId}`);
      toast.success('Satış silindi');
      fetchRecentSales();
      setShowModal(false);
      setSelectedSale(null);
    } catch (error) {
      toast.error('Satış silinemedi');
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      CASH: 'Nakit',
      CARD: 'Kart',
      TRANSFER: 'Havale',
      CREDIT: 'Veresiye',
    };
    return methods[method] || method;
  };

  return (
    <>
      <Card className="glass border-2 border-slate-200 dark:border-slate-800 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-950/20 dark:to-blue-950/20 border-b-2">
          <CardTitle className="flex items-center gap-2 text-lg font-black">
            <Clock className="w-5 h-5 text-blue-600" />
            Son İşlemler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-6">
          {recentSales.map((sale, index) => (
            <motion.div
              key={sale.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => viewSale(sale.id)}
              className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-2 border-blue-200 dark:border-blue-900 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
            >
              <div>
                <p className="font-black text-sm text-slate-900 dark:text-white">{sale.saleNumber}</p>
                <p className="text-xs text-muted-foreground font-semibold">
                  {sale.user?.name} • {formatDate(sale.createdAt)}
                </p>
              </div>
              <span className="font-black text-blue-700 dark:text-blue-400">{formatCurrency(sale.netAmount)}</span>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Sale Detail Modal */}
      <AnimatePresence>
        {showModal && selectedSale && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="bg-gradient-to-r from-blue-700 to-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Eye className="w-6 h-6" />
                  Satış Detayı
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowModal(false)} className="text-white hover:bg-white/20">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-6">
                {/* Sale Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-2 border-blue-200 dark:border-blue-900">
                    <p className="text-sm text-muted-foreground font-semibold mb-1">Satış No</p>
                    <p className="text-lg font-black text-blue-700 dark:text-blue-400">{selectedSale.saleNumber}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-2 border-blue-200 dark:border-blue-900">
                    <p className="text-sm text-muted-foreground font-semibold mb-1">Tarih</p>
                    <p className="text-base font-black text-slate-900 dark:text-white">{formatDate(selectedSale.createdAt)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-2 border-blue-200 dark:border-blue-900">
                    <p className="text-sm text-muted-foreground font-semibold mb-1 flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Müşteri
                    </p>
                    <p className="text-base font-black text-slate-900 dark:text-white">
                      {selectedSale.customer?.name || 'Misafir'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20 border-2 border-blue-200 dark:border-blue-900">
                    <p className="text-sm text-muted-foreground font-semibold mb-1 flex items-center gap-1">
                      <CreditCard className="w-4 h-4" />
                      Ödeme
                    </p>
                    <p className="text-base font-black text-slate-900 dark:text-white">
                      {getPaymentMethodLabel(selectedSale.paymentMethod)}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Ürünler ({selectedSale.items?.length || 0})
                  </h3>
                  <div className="space-y-2">
                    {selectedSale.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-950/20 dark:to-blue-950/20 border-2 border-slate-200 dark:border-slate-800"
                      >
                        <div className="flex-1">
                          <p className="font-black text-sm text-slate-900 dark:text-white">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground font-semibold">
                            {item.quantity} adet × {formatCurrency(item.price)}
                          </p>
                        </div>
                        <span className="font-black text-blue-700 dark:text-blue-400">
                          {formatCurrency(item.quantity * item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-100 to-slate-100 dark:from-blue-950/40 dark:to-slate-950/40 border-2 border-blue-300 dark:border-blue-800 space-y-3">
                  <div className="flex justify-between text-base">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Ara Toplam</span>
                    <span className="font-black text-slate-900 dark:text-white">{formatCurrency(selectedSale.totalAmount)}</span>
                  </div>
                  {selectedSale.discountAmount! > 0 && (
                    <div className="flex justify-between text-base">
                      <span className="font-bold text-red-600">İndirim</span>
                      <span className="font-black text-red-600">-{formatCurrency(selectedSale.discountAmount!)}</span>
                    </div>
                  )}
                  <div className="h-px bg-slate-300 dark:bg-slate-700"></div>
                  <div className="flex justify-between text-xl">
                    <span className="font-black text-blue-700 dark:text-blue-400">TOPLAM</span>
                    <span className="font-black text-blue-700 dark:text-blue-400">{formatCurrency(selectedSale.netAmount)}</span>
                  </div>
                </div>

                {selectedSale.notes && (
                  <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-200 dark:border-orange-900">
                    <p className="text-sm font-bold text-orange-800 dark:text-orange-400 mb-1">Not</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{selectedSale.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => deleteSale(selectedSale.id)}
                    className="flex-1 h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black"
                  >
                    <Trash2 className="w-5 h-5 mr-2" />
                    Satışı Sil
                  </Button>
                  <Button
                    onClick={() => window.print()}
                    className="flex-1 h-12 bg-gradient-to-r from-blue-700 to-slate-700 hover:from-blue-600 hover:to-slate-600 text-white font-black"
                  >
                    <Printer className="w-5 h-5 mr-2" />
                    Yazdır
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RecentActivity;


