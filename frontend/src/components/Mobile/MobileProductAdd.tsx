import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ArrowLeft, Save, Upload, Package } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { api } from '../../lib/api';
import { soundEffects } from '../../lib/sound-effects';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
}

const MobileProductAdd: React.FC = () => {
  const navigate = useNavigate();
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [stock, setStock] = useState('');
  const [tax, setTax] = useState('18');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const scanBarcode = async () => {
    try {
      soundEffects.beep();

      const { camera } = await BarcodeScanner.checkPermissions();
      
      if (camera !== 'granted') {
        const result = await BarcodeScanner.requestPermissions();
        if (result.camera !== 'granted') {
          toast.error('Kamera izni gerekli!');
          return;
        }
      }

      const scanResult = await BarcodeScanner.scan();
      
      if (scanResult.barcodes && scanResult.barcodes.length > 0) {
        const scannedBarcode = scanResult.barcodes[0].displayValue || scanResult.barcodes[0].rawValue;
        
        if (scannedBarcode) {
          setBarcode(scannedBarcode);
          soundEffects.cashRegister();
          toast.success(`Barkod: ${scannedBarcode}`);
        }
      }
    } catch (error: any) {
      console.error('Scan error:', error);
      if (error.message && !error.message.toLowerCase().includes('cancel')) {
        toast.error('Barkod tarama başarısız');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!barcode || !name || !sellPrice) {
      toast.error('Lütfen zorunlu alanları doldurun!');
      return;
    }

    try {
      setIsLoading(true);
      soundEffects.click();

      await api.post('/products', {
        barcode,
        name,
        sellPrice: parseFloat(sellPrice),
        buyPrice: buyPrice ? parseFloat(buyPrice) : 0,
        stock: stock ? parseInt(stock) : 0,
        tax: parseInt(tax),
        categoryId: categoryId || undefined,
        isActive: true,
      });

      soundEffects.cashRegister();
      toast.success('✅ Ürün başarıyla eklendi!');
      navigate('/products');
    } catch (error: any) {
      soundEffects.error();
      toast.error(error.response?.data?.error || 'Ürün eklenemedi!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mobile-app-wrapper">
      {/* Header */}
      <div className="mobile-header" style={{ 
        background: 'linear-gradient(135deg, #3F8EFC 0%, #74C0FC 100%)',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <button
          onClick={() => navigate('/products')}
          className="p-2 rounded-lg bg-white/20"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-xl font-bold text-white">Ürün Ekle</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Barkod */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Barkod *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Barkod giriniz"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-foreground"
              required
            />
            {Capacitor.isNativePlatform() && (
              <button
                type="button"
                onClick={scanBarcode}
                className="px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-400 text-white"
              >
                <Camera className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Ürün Adı */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Ürün Adı *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ürün adı giriniz"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-foreground"
            required
          />
        </div>

        {/* Satış Fiyatı */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Satış Fiyatı (₺) *
          </label>
          <input
            type="number"
            step="0.01"
            value={sellPrice}
            onChange={(e) => setSellPrice(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-foreground"
            required
          />
        </div>

        {/* Alış Fiyatı */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Alış Fiyatı (₺)
          </label>
          <input
            type="number"
            step="0.01"
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-foreground"
          />
        </div>

        {/* Grid: KDV + Stok */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              KDV (%)
            </label>
            <select
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-foreground"
            >
              <option value="0">0%</option>
              <option value="1">1%</option>
              <option value="8">8%</option>
              <option value="18">18%</option>
              <option value="20">20%</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Stok
            </label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-foreground"
            />
          </div>
        </div>

        {/* Kategori */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Kategori
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-foreground"
          >
            <option value="">Kategori seçiniz</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 rounded-lg bg-gradient-to-r from-blue-500 to-blue-400 text-white font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #3F8EFC 0%, #74C0FC 100%)',
          }}
        >
          {isLoading ? (
            'Kaydediliyor...'
          ) : (
            <>
              <Save className="w-5 h-5" />
              Kaydet
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default MobileProductAdd;

