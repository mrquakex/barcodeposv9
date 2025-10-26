import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { TrendingUp, TrendingDown, Check, X, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

interface PriceChange {
  id: string;
  productId: string;
  source: string;
  oldPrice: number;
  newPrice: number;
  difference: number;
  percentage: number;
  status: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    barcode: string;
    category?: {
      name: string;
    };
  };
}

const PriceChanges: React.FC = () => {
  const [priceChanges, setPriceChanges] = useState<PriceChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [stats, setStats] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1); // ✅ Sayfalama
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // 🆕 Real-time progress state
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    productName: string;
  } | null>(null);
  
  // 🆕 Taranan ürünler listesi (son 50 ürün)
  const [scannedProducts, setScannedProducts] = useState<Array<{
    name: string;
    barcode: string | null;
    price: number;
    index: number;
    page: number;
  }>>([]);
  
  // 🆕 Auto-scroll ref
  const scannedListRef = React.useRef<HTMLDivElement>(null);
  
  // 🆕 Auto-scroll when new product is added
  useEffect(() => {
    if (scannedListRef.current && scannedProducts.length > 0) {
      scannedListRef.current.scrollTop = 0; // Scroll to top (newest items)
    }
  }, [scannedProducts]);

  // Fetch price changes
  const fetchPriceChanges = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await api.get(`/price-monitor/changes?status=PENDING&limit=${itemsPerPage}&offset=${(page - 1) * itemsPerPage}`);
      setPriceChanges(response.data.priceChanges);
      setStats(response.data.stats);
      
      // Calculate total pages
      const totalPending = response.data.stats?.PENDING || 0;
      setTotalPages(Math.ceil(totalPending / itemsPerPage));
    } catch (error: any) {
      console.error('Fetch price changes error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceChanges(currentPage);

    // Socket.IO connection (WITHOUT /api prefix!)
    const socketURL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    console.log('🔌 Connecting to Socket.IO:', socketURL);
    
    const socket = io(socketURL, {
      transports: ['websocket', 'polling'], // Try websocket first
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
    });

    // 📡 Real-time progress
    socket.on('scraping-progress', (data) => {
      console.log('📡 PROGRESS RECEIVED:', data); // ✅ DEBUG
      setProgress({
        current: data.current,
        total: data.total,
        productName: data.productName,
      });
      
      // Auto-enable scraping state if progress is received
      if (!scraping) {
        setScraping(true);
      }
    });

    // 📡 Real-time product added (HIZLI HIZLI!)
    socket.on('scraping-product-added', (product) => {
      setScannedProducts(prev => {
        const newList = [...prev, product];
        // Son 50 ürünü tut (performans için)
        if (newList.length > 50) {
          return newList.slice(-50);
        }
        return newList;
      });
    });

    socket.on('scraping-completed', (data) => {
      console.log('Scraping completed:', data);
      setScraping(false);
      setProgress(null); // Clear progress
      
      // 🧹 Taranan ürünleri temizle (3 saniye sonra)
      setTimeout(() => {
        setScannedProducts([]);
      }, 3000);
      
      if (data.success) {
        const totalChanges = (data.priceChangesCount || 0) + (data.newProductsCount || 0);
        toast.success(
          `✅ ${data.priceChangesCount || 0} fiyat değişikliği, 🆕 ${data.newProductsCount || 0} yeni ürün tespit edildi!`,
          { duration: 5000 }
        );
        fetchPriceChanges();
      } else {
        toast.error('Scraping başarısız: ' + data.error);
      }
    });

    socket.on('price-applied', () => {
      fetchPriceChanges();
    });

    return () => {
      socket.disconnect();
    };
  }, [currentPage]); // ✅ currentPage değiştiğinde yeni sayfa yükle

  // Apply price change
  const handleApply = async (id: string) => {
    try {
      await api.post(`/price-monitor/changes/${id}/apply`);
      toast.success('Fiyat güncellendi!');
      fetchPriceChanges();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Fiyat güncellenemedi');
    }
  };

  // Ignore price change
  const handleIgnore = async (id: string) => {
    try {
      await api.post(`/price-monitor/changes/${id}/ignore`);
      toast.success('Yoksayıldı');
      fetchPriceChanges();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'İşlem başarısız');
    }
  };

  // Manual scraping
  const handleManualScrape = async () => {
    try {
      setScraping(true);
      setScannedProducts([]); // 🧹 Eski listeyi temizle
      setProgress(null); // 🧹 Progress'i sıfırla
      await api.post('/price-monitor/scrape');
      toast.success('🚀 Fiyat taraması başlatıldı - Ürünler akmaya başlayacak!');
    } catch (error: any) {
      setScraping(false);
      toast.error(error.response?.data?.error || 'Tarama başlatılamadı');
    }
  };

  if (loading) {
    return (
      <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-slate-600 opacity-[0.03] animate-pulse" />
        
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-slate-600" />
        
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-2 text-sm md:text-base font-bold">
            <motion.div
              className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-500 to-slate-600 shadow-lg"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </motion.div>
            Fiyat Değişiklikleri
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <div className="text-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 mx-auto mb-4"
            >
              <RefreshCw className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </motion.div>
            
            <p className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Yükleniyor...
            </p>
            
            {/* Modern Progress Bar */}
            <div className="max-w-xs mx-auto">
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-slate-600"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{ width: "50%" }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 group">
      {/* Modern Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300" />
      
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3 pt-6">
        <CardTitle className="text-sm md:text-base font-bold flex items-center gap-2">
          <motion.div
            className="p-2.5 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg"
            whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </motion.div>
          Fiyat Değişiklikleri
        </CardTitle>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleManualScrape}
          disabled={scraping}
          className="relative z-20 gap-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 border-orange-300 dark:border-orange-700 font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${scraping ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">{scraping ? 'Taranıyor...' : 'Tara'}</span>
        </Button>
      </CardHeader>
      
      <CardContent className="relative z-10">
        {/* 🆕 Real-time Progress Bar - BÜYÜK VE BELİRGİN */}
        {(scraping || progress) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 via-slate-500/5 to-blue-500/10 dark:from-blue-500/20 dark:via-slate-500/10 dark:to-blue-500/20 border-3 border-blue-500 dark:border-blue-400 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-3 h-3 rounded-full bg-blue-500"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [1, 0.7, 1],
                  }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
                <p className="text-lg font-extrabold text-blue-700 dark:text-blue-300">
                  📡 TARAMA DEVAM EDİYOR
                </p>
              </div>
              <motion.div
                className="text-2xl font-black text-blue-600 dark:text-blue-400"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {progress ? `%${Math.round((progress.current / progress.total) * 100)}` : '%0'}
              </motion.div>
            </div>
            
            {/* Progress Count */}
            {progress && (
              <p className="text-base font-bold text-slate-700 dark:text-slate-300 mb-3">
                📊 Taranan: <span className="text-blue-600 dark:text-blue-400">{progress.current}</span> / {progress.total} ürün
              </p>
            )}
            
            {/* Progress bar - BÜYÜK! */}
            <div className="h-6 bg-slate-300/50 dark:bg-slate-700/50 rounded-full overflow-hidden mb-4 shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-slate-600 rounded-full flex items-center justify-end px-3"
                initial={{ width: 0 }}
                animate={{ 
                  width: progress ? `${Math.max(5, (progress.current / progress.total) * 100)}%` : '5%',
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <motion.div
                  className="w-2 h-2 rounded-full bg-white shadow-lg"
                  animate={{
                    scale: [1, 1.5, 1],
                  }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              </motion.div>
            </div>
            
            {/* Current product - BÜYÜK! */}
            {progress && progress.productName && (
              <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-blue-300 dark:border-blue-700">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Şu anda:
                </p>
                <p className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                  📦 {progress.productName}
                </p>
              </div>
            )}
            
            {/* 🆕 TARANAN ÜRÜNLER LİSTESİ - HIZLI HIZLI AKAN! */}
            {scannedProducts.length > 0 && (
              <motion.div
                ref={scannedListRef}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-slate-900/80 dark:bg-slate-950/80 rounded-xl p-4 border-2 border-green-500/30 max-h-64 overflow-y-auto"
                style={{
                  scrollBehavior: 'smooth',
                }}
              >
                <div className="flex items-center gap-2 mb-3 sticky top-0 bg-slate-900/95 dark:bg-slate-950/95 pb-2 z-10">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-green-500"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [1, 0.5, 1],
                    }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                  <p className="text-sm font-bold text-green-400">
                    ⚡ Taranan Ürünler (Son {scannedProducts.length})
                  </p>
                </div>
                
                <div className="space-y-1">
                  {scannedProducts.slice().reverse().map((product, idx) => (
                    <motion.div
                      key={`${product.index}-${idx}`}
                      initial={{ opacity: 0, x: -20, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-800/50 dark:bg-slate-900/50 border border-slate-700/30 hover:border-green-500/50 transition-all"
                    >
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="text-xs font-mono text-green-400 flex-shrink-0">
                          #{product.index}
                        </span>
                        <span className="text-xs font-semibold text-white truncate">
                          {product.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {product.barcode && (
                          <span className="text-xs font-mono text-slate-400 hidden md:inline">
                            {product.barcode.substring(0, 10)}...
                          </span>
                        )}
                        <span className="text-xs font-bold text-yellow-400">
                          {product.price.toFixed(2)} ₺
                        </span>
                        <span className="text-xs font-mono text-blue-400 hidden sm:inline">
                          P{product.page}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
        
        {priceChanges.length === 0 && !scraping ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">Bekleyen değişiklik yok</p>
            <p className="text-xs mt-1">Fiyat taraması yapın</p>
          </div>
        ) : priceChanges.length > 0 ? (
          <div className="space-y-3">
            {priceChanges.map((change, index) => (
              <motion.div
                key={change.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate text-slate-900 dark:text-white">
                      {change.product.name}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {change.product.barcode} • {change.product.category?.name}
                    </p>
                    
                    <div className="flex items-center gap-3 mt-2">
                      <div className="text-xs">
                        <span className="text-muted-foreground">Bizim:</span>{' '}
                        <span className="font-bold">{change.oldPrice.toFixed(2)} ₺</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Piyasa:</span>{' '}
                        <span className="font-bold text-orange-600">{change.newPrice.toFixed(2)} ₺</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      {change.difference > 0 ? (
                        <TrendingUp className="w-4 h-4 text-red-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-green-500" />
                      )}
                      <span className={`text-xs font-bold ${change.difference > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {change.difference > 0 ? '+' : ''}{change.difference.toFixed(2)} ₺ ({change.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      onClick={() => handleApply(change.id)}
                      className="w-8 h-8 p-0 bg-green-500 hover:bg-green-600"
                      title="Uygula"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleIgnore(change.id)}
                      className="w-8 h-8 p-0"
                      title="Yoksay"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* ✅ SAYFALAMA BUTONLARI */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="text-xs"
                >
                  ← Önceki
                </Button>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Sayfa {currentPage} / {totalPages}
                  </span>
                  {stats.PENDING && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                      (Toplam: {stats.PENDING} değişiklik)
                    </span>
                  )}
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="text-xs"
                >
                  Sonraki →
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default PriceChanges;

