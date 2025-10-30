import React, { useState, useEffect } from 'react';
import { X, Package, TrendingUp, TrendingDown, DollarSign, BarChart3, Calendar } from 'lucide-react';
import FluentButton from '../fluent/FluentButton';
import FluentCard from '../fluent/FluentCard';
import { motion } from 'framer-motion';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ isOpen, onClose, productId }) => {
  const [product, setProduct] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && productId) {
      fetchProductDetails();
    }
  }, [isOpen, productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const { default: api } = await import('../../lib/api');
      
      const [productRes, movementsRes] = await Promise.all([
        api.get(`/products/${productId}`),
        api.get(`/stock-movements?productId=${productId}`)
      ]);

      const productData = productRes.data.product || productRes.data;
      setProduct(productData);
      
      const movementsData = movementsRes.data.movements || movementsRes.data || [];
      setMovements(Array.isArray(movementsData) ? movementsData : []);

      // Calculate stats
      const last30Days = movementsData.filter((m: any) => {
        const date = new Date(m.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return date >= thirtyDaysAgo;
      });

      const totalIn = last30Days
        .filter((m: any) => m.type === 'IN')
        .reduce((sum: number, m: any) => sum + (m.quantity || 0), 0);
      
      const totalOut = last30Days
        .filter((m: any) => m.type === 'OUT')
        .reduce((sum: number, m: any) => sum + (m.quantity || 0), 0);

      setStats({
        totalMovements: movementsData.length,
        last30DaysIn: totalIn,
        last30DaysOut: totalOut,
        stockValue: productData.stock * productData.buyPrice,
        potentialRevenue: productData.stock * productData.sellPrice
      });
    } catch (error) {
      console.error('Product detail fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-card-hover">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Ürün Detayları</h2>
              {product && (
                <p className="text-sm text-foreground-secondary">{product.name}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Package className="w-12 h-12 text-primary" />
            </motion.div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Product Info */}
            <FluentCard className="p-5">
              <h3 className="text-lg font-semibold text-foreground mb-4">Temel Bilgiler</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-foreground-secondary mb-1">Barkod</p>
                  <p className="font-mono font-semibold text-foreground">{product?.barcode}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary mb-1">Kategori</p>
                  <p className="font-semibold text-foreground">{product?.category?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary mb-1">Birim</p>
                  <p className="font-semibold text-foreground">{product?.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary mb-1">KDV Oranı</p>
                  <p className="font-semibold text-foreground">%{product?.taxRate}</p>
                </div>
              </div>
            </FluentCard>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FluentCard className="p-4 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground-secondary">Mevcut Stok</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {product?.stock} {product?.unit}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
              </FluentCard>

              <FluentCard className="p-4 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground-secondary">Stok Değeri</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      ₺{stats?.stockValue?.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </FluentCard>

              <FluentCard className="p-4 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground-secondary">Giriş (30 Gün)</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                      +{stats?.last30DaysIn || 0}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </FluentCard>

              <FluentCard className="p-4 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground-secondary">Çıkış (30 Gün)</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">
                      -{stats?.last30DaysOut || 0}
                    </p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-orange-600" />
                </div>
              </FluentCard>
            </div>

            {/* Price Info */}
            <FluentCard className="p-5">
              <h3 className="text-lg font-semibold text-foreground mb-4">Fiyat Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300 mb-1">Alış Fiyatı</p>
                  <p className="text-xl font-bold text-blue-900 dark:text-blue-200">
                    ₺{product?.buyPrice?.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-300 mb-1">Satış Fiyatı</p>
                  <p className="text-xl font-bold text-green-900 dark:text-green-200">
                    ₺{product?.sellPrice?.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm text-purple-800 dark:text-purple-300 mb-1">Kar Marjı</p>
                  <p className="text-xl font-bold text-purple-900 dark:text-purple-200">
                    {product?.buyPrice > 0 
                      ? ((product.sellPrice - product.buyPrice) / product.buyPrice * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
            </FluentCard>

            {/* Stock History */}
            <FluentCard className="p-5">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Stok Geçmişi (Son {movements.length} Hareket)
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {movements.slice(0, 10).map((movement) => (
                  <div
                    key={movement.id}
                    className="flex items-center justify-between p-3 bg-card-hover rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {movement.type === 'IN' ? (
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                      ) : (
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded">
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {movement.type === 'IN' ? 'Giriş' : 'Çıkış'}: {movement.quantity} {product?.unit}
                        </p>
                        <p className="text-xs text-foreground-secondary">
                          {movement.notes || 'Not yok'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {movement.newStock} {product?.unit}
                      </p>
                      <p className="text-xs text-foreground-secondary">
                        {new Date(movement.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                ))}
                {movements.length === 0 && (
                  <div className="text-center py-8 text-foreground-secondary">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Henüz stok hareketi yok</p>
                  </div>
                )}
              </div>
            </FluentCard>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-card-hover">
          <FluentButton appearance="primary" onClick={onClose}>
            Kapat
          </FluentButton>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;

