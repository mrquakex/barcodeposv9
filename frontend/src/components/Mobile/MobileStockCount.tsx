import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Camera, Package, Save, Trash2, Plus, Minus, X
} from 'lucide-react';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { soundEffects } from '../../lib/sound-effects';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface StockItem {
  id: string;
  barcode: string;
  name: string;
  currentStock: number;
  countedStock: number;
  difference: number;
}

const MobileStockCount: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<StockItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hapticFeedback = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  };

  const scanBarcode = async () => {
    if (isScanning) return;

    try {
      setIsScanning(true);
      hapticFeedback(ImpactStyle.Light);
      soundEffects.beep();

      const permissionResult = await BarcodeScanner.checkPermissions();
      if (permissionResult.camera !== 'granted') {
        const result = await BarcodeScanner.requestPermissions();
        if (result.camera !== 'granted') {
          toast.error('Kamera izni gerekli');
          setIsScanning(false);
          return;
        }
      }

      toast('📸 Kamera açılıyor...', { duration: 1000 });
      const scanResult = await BarcodeScanner.scan();

      if (scanResult.barcodes && scanResult.barcodes.length > 0) {
        const barcode = scanResult.barcodes[0].displayValue || scanResult.barcodes[0].rawValue;
        if (barcode) {
          await addProduct(barcode);
          hapticFeedback(ImpactStyle.Medium);
          soundEffects.cashRegister();
        }
      }
    } catch (error: any) {
      console.error('Scan error:', error);
      if (!error.message?.toLowerCase().includes('cancel')) {
        toast.error('Tarama hatası');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const addProduct = async (barcode: string) => {
    try {
      const response = await api.get(`/products/barcode/${barcode}`);
      const product = response.data;

      if (!product) {
        toast.error('Ürün bulunamadı');
        return;
      }

      const existingItem = items.find(item => item.barcode === barcode);

      if (existingItem) {
        // Increase counted stock
        setItems(prev => prev.map(item =>
          item.barcode === barcode
            ? {
                ...item,
                countedStock: item.countedStock + 1,
                difference: (item.countedStock + 1) - item.currentStock
              }
            : item
        ));
        toast.success(`${product.name} +1`);
      } else {
        // Add new item
        setItems(prev => [...prev, {
          id: product.id,
          barcode: product.barcode,
          name: product.name,
          currentStock: product.stock || 0,
          countedStock: 1,
          difference: 1 - (product.stock || 0)
        }]);
        toast.success(`✅ ${product.name} eklendi`);
      }

      hapticFeedback();
    } catch (error: any) {
      console.error('Product fetch error:', error);
      toast.error('Ürün eklenemedi');
    }
  };

  const updateCount = (barcode: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.barcode === barcode) {
        const newCount = Math.max(0, item.countedStock + delta);
        return {
          ...item,
          countedStock: newCount,
          difference: newCount - item.currentStock
        };
      }
      return item;
    }));
    soundEffects.tap();
    hapticFeedback();
  };

  const removeItem = (barcode: string) => {
    setItems(prev => prev.filter(item => item.barcode !== barcode));
    toast.success('Ürün silindi');
    soundEffects.tap();
    hapticFeedback();
  };

  const clearAll = () => {
    if (items.length === 0) return;

    if (confirm('Tüm sayımı temizlemek istediğinize emin misiniz?')) {
      setItems([]);
      toast.success('Sayım temizlendi');
      soundEffects.tap();
    }
  };

  const saveCount = async () => {
    if (items.length === 0) {
      toast.error('Sayım listesi boş!');
      return;
    }

    try {
      setIsSaving(true);
      soundEffects.tap();
      hapticFeedback(ImpactStyle.Medium);

      toast.loading('Sayım kaydediliyor...', { duration: 1000 });

      const countData = {
        items: items.map(item => ({
          productId: item.id,
          currentStock: item.currentStock,
          countedStock: item.countedStock,
          difference: item.difference
        })),
        totalItems: items.length,
        timestamp: new Date().toISOString()
      };

      await api.post('/stock-count', countData);

      toast.success('✅ Sayım kaydedildi!');
      soundEffects.cashRegister();
      hapticFeedback(ImpactStyle.Heavy);

      setItems([]);
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error('Sayım kaydedilemedi!');
      soundEffects.error();
    } finally {
      setIsSaving(false);
    }
  };

  const totalDifference = items.reduce((sum, item) => sum + Math.abs(item.difference), 0);

  return (
    <div className="mobile-stock-count-pro">
      {/* Header */}
      <div className="stock-header-pro">
        <button onClick={() => navigate('/dashboard')} className="back-btn-pro">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="header-title-pro">
          <Package className="w-5 h-5" />
          <h1>Stok Sayımı</h1>
        </div>
        <button
          onClick={clearAll}
          className="clear-btn-pro"
          disabled={items.length === 0}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Summary Bar */}
      {items.length > 0 && (
        <div className="stock-summary-bar">
          <div className="summary-item-pro">
            <span className="summary-label-pro">Ürün</span>
            <span className="summary-value-pro">{items.length}</span>
          </div>
          <div className="summary-item-pro">
            <span className="summary-label-pro">Fark</span>
            <span className="summary-value-pro">{totalDifference}</span>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="stock-items-section">
        {items.length === 0 ? (
          <div className="empty-stock-pro">
            <Package className="w-20 h-20 text-gray-300" />
            <h3>Sayım Başlamadı</h3>
            <p>Barkod okutarak stok sayımına başlayın</p>
            <button onClick={scanBarcode} className="empty-scan-btn-pro">
              <Camera className="w-5 h-5" />
              Barkod Tara
            </button>
          </div>
        ) : (
          <div className="stock-items-list">
            {items.map((item) => (
              <div key={item.barcode} className="stock-item-card-pro">
                <div className="item-header-pro">
                  <div className="item-info-pro">
                    <p className="item-name-pro">{item.name}</p>
                    <p className="item-barcode-pro">{item.barcode}</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.barcode)}
                    className="delete-item-btn-pro"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="item-stocks-pro">
                  <div className="stock-info-pro">
                    <span className="stock-label-pro">Mevcut</span>
                    <span className="stock-value-pro">{item.currentStock}</span>
                  </div>
                  <div className="stock-info-pro">
                    <span className="stock-label-pro">Sayılan</span>
                    <span className="stock-value-pro">{item.countedStock}</span>
                  </div>
                  <div className="stock-info-pro">
                    <span className="stock-label-pro">Fark</span>
                    <span className={`stock-value-pro ${item.difference > 0 ? 'positive' : item.difference < 0 ? 'negative' : ''}`}>
                      {item.difference > 0 ? '+' : ''}{item.difference}
                    </span>
                  </div>
                </div>

                <div className="item-actions-pro">
                  <button
                    onClick={() => updateCount(item.barcode, -1)}
                    className="count-btn-pro minus"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="count-display-pro">{item.countedStock}</span>
                  <button
                    onClick={() => updateCount(item.barcode, 1)}
                    className="count-btn-pro plus"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="stock-actions-pro">
        <button
          onClick={scanBarcode}
          disabled={isScanning || isSaving}
          className="scan-btn-stock-pro"
        >
          <Camera className="w-6 h-6" />
          <span>{isScanning ? 'Taranıyor...' : 'Barkod Tara'}</span>
        </button>

        {items.length > 0 && (
          <button
            onClick={saveCount}
            disabled={isSaving}
            className="save-btn-stock-pro"
          >
            <Save className="w-6 h-6" />
            <span>{isSaving ? 'Kaydediliyor...' : 'Sayımı Kaydet'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileStockCount;
