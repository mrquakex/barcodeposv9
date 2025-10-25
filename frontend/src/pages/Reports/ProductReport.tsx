import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Product } from '../../types';
import api from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { Package } from 'lucide-react';

const ProductReport: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.products);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const lowStock = products.filter(p => p.stock <= p.minStock).length;

  if (loading) return <div className="flex items-center justify-center h-full"><p>Yükleniyor...</p></div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Ürün Raporları</h1>
        <p className="text-muted-foreground mt-1">Ürün envanter analizi</p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><Package className="w-12 h-12 text-blue-600" /><div><div className="text-2xl font-bold">{products.length}</div><p className="text-sm text-muted-foreground">Toplam Ürün</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><Package className="w-12 h-12 text-green-600" /><div><div className="text-2xl font-bold text-green-600">{formatCurrency(totalValue)}</div><p className="text-sm text-muted-foreground">Stok Değeri</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><Package className="w-12 h-12 text-red-600" /><div><div className="text-2xl font-bold text-red-600">{lowStock}</div><p className="text-sm text-muted-foreground">Düşük Stok</p></div></div></CardContent></Card>
      </div>
    </div>
  );
};

export default ProductReport;

