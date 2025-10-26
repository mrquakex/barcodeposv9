import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Barcode, DollarSign, TrendingUp, Edit, Trash2, Star, StarOff, ShoppingCart, Box, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Breadcrumbs from '../components/Breadcrumbs';
import { LoadingPage } from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import api from '../lib/api';
import { formatCurrency } from '../lib/utils';
import toast from 'react-hot-toast';

/* ============================================
   PRODUCT DETAIL PAGE (Apple Product Style)
   iOS/macOS Product Card Design
   ============================================ */

interface Product {
  id: string;
  name: string;
  barcode: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  category: { name: string };
  supplier?: { name: string };
  isFavorite: boolean;
  createdAt: string;
}

interface ProductStats {
  totalSold: number;
  totalRevenue: number;
  avgDailySales: number;
  lastSaleDate: string;
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProductData();
    }
  }, [id]);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      // Fetch product info
      const productRes = await api.get(`/products/${id}`);
      setProduct(productRes.data.product);

      // Fetch sales statistics (mock for now)
      // TODO: Implement real sales stats endpoint
      setStats({
        totalSold: 127,
        totalRevenue: 5430,
        avgDailySales: 4.2,
        lastSaleDate: '2025-10-25',
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Ürün bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!product) return;
    
    try {
      await api.patch(`/products/${id}/favorite`);
      setProduct({ ...product, isFavorite: !product.isFavorite });
      toast.success(product.isFavorite ? 'Favorilerden çıkarıldı' : 'Favorilere eklendi');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('İşlem başarısız');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    
    try {
      await api.delete(`/products/${id}`);
      toast.success('Ürün silindi');
      navigate('/products');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Ürün silinemedi');
    }
  };

  if (loading) {
    return <LoadingPage message="Ürün bilgileri yükleniyor..." />;
  }

  if (!product) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Package}
          title="Ürün Bulunamadı"
          description="Aradığınız ürün sistemde bulunamadı."
          actionLabel="Ürünlere Dön"
          onAction={() => navigate('/products')}
        />
      </div>
    );
  }

  const profitMargin = product.sellPrice > 0 
    ? ((product.sellPrice - product.buyPrice) / product.sellPrice * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="plain"
            size="icon"
            onClick={() => navigate('/products')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-[34px] font-bold text-foreground tracking-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-[15px] text-muted-foreground">
                {product.category.name}
              </p>
              {product.supplier && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <p className="text-[15px] text-muted-foreground">
                    {product.supplier.name}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="plain" 
            size="icon"
            onClick={toggleFavorite}
          >
            {product.isFavorite ? (
              <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
            ) : (
              <StarOff className="w-5 h-5" />
            )}
          </Button>
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
                <Barcode className="w-5 h-5 text-primary" />
              </div>
              <p className="text-[13px] text-muted-foreground font-medium">Barkod</p>
            </div>
            <p className="text-[17px] font-semibold text-foreground tracking-tight">
              {product.barcode}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-[10px] bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <p className="text-[13px] text-muted-foreground font-medium">Satış Fiyatı</p>
            </div>
            <p className="text-[28px] font-bold text-foreground tracking-tight">
              {formatCurrency(product.sellPrice)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-[10px] bg-primary/10">
                <Box className="w-5 h-5 text-primary" />
              </div>
              <p className="text-[13px] text-muted-foreground font-medium">Stok</p>
            </div>
            <p className={`text-[28px] font-bold tracking-tight ${
              product.stock <= product.minStock ? 'text-destructive' : 'text-foreground'
            }`}>
              {product.stock}
            </p>
            {product.stock <= product.minStock && (
              <div className="flex items-center gap-1 mt-2">
                <AlertCircle className="w-3 h-3 text-destructive" />
                <p className="text-[11px] text-destructive font-medium">Düşük stok!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-[10px] bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <p className="text-[13px] text-muted-foreground font-medium">Kar Marjı</p>
            </div>
            <p className="text-[28px] font-bold text-foreground tracking-tight">
              %{profitMargin}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pricing Info */}
        <Card>
          <CardHeader>
            <CardTitle>Fiyat Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-[10px] bg-muted">
              <div>
                <p className="text-[11px] text-muted-foreground font-medium uppercase">Alış Fiyatı</p>
                <p className="text-[17px] font-semibold text-foreground mt-1">
                  {formatCurrency(product.buyPrice)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-muted-foreground/30" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-[10px] bg-muted">
              <div>
                <p className="text-[11px] text-muted-foreground font-medium uppercase">Satış Fiyatı</p>
                <p className="text-[17px] font-semibold text-foreground mt-1">
                  {formatCurrency(product.sellPrice)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-muted-foreground/30" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-[10px] bg-primary/10">
              <div>
                <p className="text-[11px] text-primary font-medium uppercase">Kar</p>
                <p className="text-[17px] font-semibold text-primary mt-1">
                  {formatCurrency(product.sellPrice - product.buyPrice)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        {/* Sales Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Satış İstatistikleri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-[10px] bg-muted">
              <div>
                <p className="text-[11px] text-muted-foreground font-medium uppercase">Toplam Satış</p>
                <p className="text-[17px] font-semibold text-foreground mt-1">
                  {stats?.totalSold || 0} adet
                </p>
              </div>
              <ShoppingCart className="w-8 h-8 text-muted-foreground/30" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-[10px] bg-muted">
              <div>
                <p className="text-[11px] text-muted-foreground font-medium uppercase">Toplam Ciro</p>
                <p className="text-[17px] font-semibold text-foreground mt-1">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-muted-foreground/30" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-[10px] bg-primary/10">
              <div>
                <p className="text-[11px] text-primary font-medium uppercase">Günlük Ort. Satış</p>
                <p className="text-[17px] font-semibold text-primary mt-1">
                  {stats?.avgDailySales || 0} adet/gün
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductDetail;

