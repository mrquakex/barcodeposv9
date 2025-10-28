import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Package, Save, Trash2, Plus, Minus } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { soundEffects } from '../../lib/sound-effects';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import toast from 'react-hot-toast';

interface CountedProduct {
  barcode: string;
  name: string;
  systemStock: number;
  countedStock: number;
  difference: number;
}

const MobileStockCount: React.FC = () => {
  const navigate = useNavigate();
  const [countedProducts, setCountedProducts] = useState<CountedProduct[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const scanProduct = async () => {
    try {
      setIsScanning(true);
      soundEffects.beep();
      console.log('🚀 StockCount: Starting scan...');

      const permissionResult = await BarcodeScanner.checkPermissions();
      console.log('StockCount: Permission status:', permissionResult);
      
      if (permissionResult.camera !== 'granted') {
        console.log('StockCount: Requesting permission...');
        const result = await BarcodeScanner.requestPermissions();
        console.log('StockCount: Permission result:', result);
        
        if (result.camera !== 'granted') {
          toast.error('❌ Kamera izni gerekli!');
          setIsScanning(false);
          return;
        }
      }

      console.log('StockCount: Opening scanner...');
      toast('📸 Kamera açılıyor...', { duration: 1000 });
      
      const scanResult = await BarcodeScanner.scan();
      console.log('StockCount: Scan result:', scanResult);
      
      if (scanResult.barcodes && scanResult.barcodes.length > 0) {
        const barcode = scanResult.barcodes[0].displayValue || scanResult.barcodes[0].rawValue;
        console.log('StockCount: Barcode:', barcode);
        
        if (barcode) {
          await addProduct(barcode);
          soundEffects.cashRegister();
          toast.success(`✅ ${barcode}`);
          
          if (Capacitor.isNativePlatform()) {
            await Haptics.impact({ style: ImpactStyle.Medium });
          }
        }
      } else {
        toast('Barkod bulunamadı', { icon: '🔍' });
      }
    } catch (error: any) {
      console.error('StockCount: Scan error:', error);
      console.error('StockCount: Error details:', {
        message: error.message,
        code: error.code
      });
      
      if (error.message && !error.message.toLowerCase().includes('cancel')) {
        toast.error(`❌ Hata: ${error.message || 'Barkod tarama başarısız'}`);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const addProduct = async (barcode: string) => {
    // Mock product fetch - Backend'den gelecek
    const mockProduct = {
      barcode,
      name: `Ürün ${barcode.slice(-4)}`,
      systemStock: Math.floor(Math.random() * 50),
    };

    const existing = countedProducts.find(p => p.barcode === barcode);
    
    if (existing) {
      updateCount(barcode, existing.countedStock + 1);
      toast.success(`${existing.name} +1`);
    } else {
      const newProduct: CountedProduct = {
        ...mockProduct,
        countedStock: 1,
        difference: 1 - mockProduct.systemStock,
      };
      setCountedProducts(prev => [...prev, newProduct]);
      toast.success(`${newProduct.name} eklendi`);
    }
  };

  const updateCount = (barcode: string, newCount: number) => {
    setCountedProducts(prev => 
      prev.map(p => 
        p.barcode === barcode 
          ? { ...p, countedStock: newCount, difference: newCount - p.systemStock }
          : p
      )
    );
    soundEffects.tap();
  };

  const removeProduct = (barcode: string) => {
    setCountedProducts(prev => prev.filter(p => p.barcode !== barcode));
    soundEffects.tap();
  };

  const saveCount = () => {
    if (countedProducts.length === 0) {
      toast.error('En az bir ürün saymalısınız!');
      return;
    }

    soundEffects.cashRegister();
    toast.success(`${countedProducts.length} ürün sayımı kaydedildi!`);
    // Backend API call yapılacak
    navigate('/dashboard');
  };

  const totalDifference = countedProducts.reduce((sum, p) => sum + Math.abs(p.difference), 0);

  return (
    <div className="mobile-app-wrapper">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
        padding: '16px',
        paddingTop: 'calc(16px + env(safe-area-inset-top))',
      }}>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg bg-white/20"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="flex-1 text-xl font-bold text-white">Stok Sayımı</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/20 rounded-lg p-2 text-center">
            <p className="text-xs text-white/80">Sayılan</p>
            <p className="text-lg font-bold text-white">{countedProducts.length}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-2 text-center">
            <p className="text-xs text-white/80">Toplam Fark</p>
            <p className="text-lg font-bold text-white">{totalDifference}</p>
          </div>
          <button
            onClick={scanProduct}
            disabled={isScanning}
            className="bg-white/30 hover:bg-white/40 rounded-lg p-2 flex flex-col items-center justify-center"
          >
            <Camera className="w-5 h-5 text-white mb-1" />
            <p className="text-xs text-white font-medium">Tara</p>
          </button>
        </div>
      </div>

      {/* Counted Products List */}
      <div className="p-4 space-y-3">
        {countedProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Sayım başlamadı
            </h3>
            <p className="text-foreground-secondary mb-4">
              Kamera ile barkod okutarak sayıma başlayın
            </p>
            <button
              onClick={scanProduct}
              className="px-6 py-3 rounded-lg font-semibold text-white inline-flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
              }}
            >
              <Camera className="w-5 h-5" />
              Sayımı Başlat
            </button>
          </div>
        ) : (
          <>
            {countedProducts.map(product => (
              <div
                key={product.barcode}
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '16px',
                  padding: '16px',
                  border: product.difference !== 0 
                    ? `2px solid ${product.difference > 0 ? '#10B981' : '#EF4444'}`
                    : '1px solid rgba(0, 0, 0, 0.06)',
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{product.name}</h3>
                    <p className="text-sm text-foreground-secondary font-mono">{product.barcode}</p>
                  </div>
                  <button
                    onClick={() => removeProduct(product.barcode)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-xs text-foreground-secondary">Sistem</p>
                    <p className="text-lg font-bold text-foreground">{product.systemStock}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                    <p className="text-xs text-blue-600 dark:text-blue-400">Sayılan</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{product.countedStock}</p>
                  </div>
                  <div className={`rounded-lg p-2 ${
                    product.difference > 0 
                      ? 'bg-green-50 dark:bg-green-900/20' 
                      : product.difference < 0
                      ? 'bg-red-50 dark:bg-red-900/20'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <p className="text-xs" style={{
                      color: product.difference > 0 ? '#10B981' : product.difference < 0 ? '#EF4444' : 'inherit',
                    }}>
                      Fark
                    </p>
                    <p className="text-lg font-bold" style={{
                      color: product.difference > 0 ? '#10B981' : product.difference < 0 ? '#EF4444' : 'inherit',
                    }}>
                      {product.difference > 0 ? '+' : ''}{product.difference}
                    </p>
                  </div>
                </div>

                {/* Count Adjustment */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => updateCount(product.barcode, Math.max(0, product.countedStock - 1))}
                    className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-2xl font-bold text-foreground min-w-[60px] text-center">
                    {product.countedStock}
                  </span>
                  <button
                    onClick={() => updateCount(product.barcode, product.countedStock + 1)}
                    className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Save Button */}
            <button
              onClick={saveCount}
              className="w-full py-4 rounded-lg font-semibold text-white text-lg flex items-center justify-center gap-2 mt-6"
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
              }}
            >
              <Save className="w-5 h-5" />
              Sayımı Kaydet ({countedProducts.length} ürün)
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MobileStockCount;

