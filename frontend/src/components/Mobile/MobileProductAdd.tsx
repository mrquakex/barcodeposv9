import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Save, Package } from 'lucide-react';
import { api } from '../../lib/api';
import { soundEffects } from '../../lib/sound-effects';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
}

const MobileProductAdd: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingProductId, setExistingProductId] = useState<string | null>(null);
  const [mode, setMode] = useState<'add' | 'update'>('add');
  
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    buyPrice: '',
    sellPrice: '',
    stock: '',
    categoryId: '',
    minStock: '5',
  });

  const hapticFeedback = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style });
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast.error('Kategoriler yüklenemedi');
    }
  };

  const scanBarcode = async () => {
    // Prevent multiple scans
    if (isLoading) {
      console.log('⚠️ [PRODUCT-ADD] Already scanning, skipping...');
      return;
    }
    
    try {
      console.log('🎯 [PRODUCT-ADD] Scan started!');
      setIsLoading(true);
      soundEffects.beep();
      hapticFeedback(ImpactStyle.Light);
      
      const permissionResult = await BarcodeScanner.checkPermissions();
      if (permissionResult.camera !== 'granted') {
        const result = await BarcodeScanner.requestPermissions();
        if (result.camera !== 'granted') {
          toast.error('Kamera izni gerekli');
          setIsLoading(false);
          return;
        }
      }

      const scanResult = await BarcodeScanner.scan();
      console.log('📦 [PRODUCT-ADD] Scan result:', scanResult);

      if (scanResult.barcodes && scanResult.barcodes.length > 0) {
        const barcode = scanResult.barcodes[0].displayValue || scanResult.barcodes[0].rawValue;
        console.log('✅ [PRODUCT-ADD] Barcode extracted:', barcode);
        console.log('🔍 [PRODUCT-ADD] Barcode type:', typeof barcode);
        console.log('🔍 [PRODUCT-ADD] Barcode length:', barcode?.length);
        
        if (barcode && barcode.trim()) {
          const cleanBarcode = barcode.trim();
          console.log('🔎 [PRODUCT-ADD] Checking product with barcode:', cleanBarcode);
          
          // Check if product exists
          toast.loading('Ürün kontrol ediliyor...');
          
          try {
            console.log('📡 [PRODUCT-ADD] API call starting...');
            const response = await api.get(`/products/barcode/${cleanBarcode}`);
            console.log('📥 [PRODUCT-ADD] API response:', response.data);
            
            // ✅ Backend direkt product objesini gönderiyor, .product wrapper yok!
            const product = response.data;
            
            if (product && product.id) {
              // Product exists - UPDATE MODE
              console.log('🔄 [PRODUCT-ADD] Product found! Switching to UPDATE mode');
              console.log('📝 [PRODUCT-ADD] Product data:', product);
              
              setMode('update');
              setExistingProductId(product.id);
              setFormData({
                barcode: product.barcode,
                name: product.name,
                buyPrice: product.buyPrice?.toString() || '',
                sellPrice: product.sellPrice?.toString() || '',
                stock: product.stock?.toString() || '',
                categoryId: product.categoryId || '',
                minStock: product.minStock?.toString() || '5',
              });
              
              toast.dismiss();
              toast.success('✅ Ürün bulundu! Güncelleyebilirsiniz');
              soundEffects.cashRegister();
              hapticFeedback(ImpactStyle.Medium);
            } else {
              console.log('⚠️ [PRODUCT-ADD] Response OK but no product data');
              toast.dismiss();
              toast.error('Ürün verisi alınamadı');
            }
          } catch (error: any) {
            console.log('❌ [PRODUCT-ADD] API error:', error);
            toast.dismiss();
            
            if (error.response?.status === 404) {
              // Product not found - ADD MODE
              console.log('➕ [PRODUCT-ADD] Product not found (404) - switching to ADD mode');
              setMode('add');
              setExistingProductId(null);
              setFormData(prev => ({ 
                ...prev, 
                barcode: cleanBarcode,
                name: '',
                buyPrice: '',
                sellPrice: '',
                stock: '',
              }));
              toast.success(`📸 Barkod: ${cleanBarcode}\nYeni ürün ekleyebilirsiniz`);
              soundEffects.beep();
              hapticFeedback(ImpactStyle.Light);
            } else {
              console.error('🔥 [PRODUCT-ADD] Unexpected error:', error);
              toast.error('Ürün kontrol edilemedi: ' + (error.message || 'Bilinmeyen hata'));
            }
          }
        } else {
          console.log('⚠️ [PRODUCT-ADD] Barcode is empty or invalid');
          toast.error('Barkod okunamadı');
        }
      } else {
        console.log('⚠️ [PRODUCT-ADD] No barcodes in scan result');
        toast.error('Barkod bulunamadı');
      }
    } catch (error: any) {
      console.error('❌ [PRODUCT-ADD] Scan error:', error);
      toast.dismiss();
      if (error.message && !error.message.toLowerCase().includes('cancel')) {
        toast.error('Tarama hatası: ' + error.message);
      }
    } finally {
      console.log('✅ [PRODUCT-ADD] Scan finished, releasing lock');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.barcode || !formData.name || !formData.sellPrice) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    try {
      setIsLoading(true);
      soundEffects.tap();
      hapticFeedback(ImpactStyle.Medium);

      const productData = {
        barcode: formData.barcode,
        name: formData.name,
        buyPrice: parseFloat(formData.buyPrice) || 0,
        sellPrice: parseFloat(formData.sellPrice),
        stock: parseInt(formData.stock) || 0,
        categoryId: formData.categoryId || null,
        minStock: parseInt(formData.minStock) || 5,
      };

      if (mode === 'update' && existingProductId) {
        // UPDATE existing product
        await api.put(`/products/${existingProductId}`, productData);
        toast.success('✅ Ürün güncellendi!');
      } else {
        // ADD new product
        await api.post('/products', productData);
        toast.success('✅ Ürün eklendi!');
      }
      
      soundEffects.cashRegister();
      hapticFeedback(ImpactStyle.Heavy);
      
      setTimeout(() => navigate('/products'), 500);
    } catch (error: any) {
      console.error('Failed to save product:', error);
      const message = error.response?.data?.message || (mode === 'update' ? 'Ürün güncellenemedi' : 'Ürün eklenemedi');
      toast.error(message);
      soundEffects.error();
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="mobile-product-add-clean">
      {/* Clean Header */}
      <div className="add-header-clean">
        <button onClick={() => navigate(-1)} className="back-btn-clean">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="page-title-clean">Ürün Ekle/Güncelle</h1>
        <div className="w-10"></div>
      </div>

      {/* Mode Indicator */}
      {formData.barcode && (
        <div className={`mode-indicator ${mode === 'update' ? 'update' : 'add'}`}>
          {mode === 'update' ? '🔄 Güncelleme Modu' : '➕ Ekleme Modu'}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="add-form-clean">
        {/* Barcode - Camera Only */}
        <div className="form-group-clean">
          <label className="form-label-clean">
            Barkod <span className="required">*</span>
          </label>
          <div className="barcode-display-clean">
            <div className="barcode-value">
              {formData.barcode || 'Barkod numarası'}
            </div>
            <button 
              type="button"
              onClick={scanBarcode}
              className="scan-btn-inline"
              disabled={isLoading}
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Product Name */}
        <div className="form-group-clean">
          <label className="form-label-clean">
            Ürün Adı <span className="required">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ürün adı"
            className="form-input-clean"
            required
          />
        </div>

        {/* Prices */}
        <div className="form-row-clean">
          <div className="form-group-clean">
            <label className="form-label-clean">Alış Fiyatı</label>
            <input
              type="number"
              name="buyPrice"
              value={formData.buyPrice}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              className="form-input-clean"
            />
          </div>
          <div className="form-group-clean">
            <label className="form-label-clean">
              Satış Fiyatı <span className="required">*</span>
            </label>
            <input
              type="number"
              name="sellPrice"
              value={formData.sellPrice}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              className="form-input-clean"
              required
            />
          </div>
        </div>

        {/* Stock */}
        <div className="form-row-clean">
          <div className="form-group-clean">
            <label className="form-label-clean">Stok Adedi</label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              placeholder="0"
              className="form-input-clean"
            />
          </div>
          <div className="form-group-clean">
            <label className="form-label-clean">Min. Stok</label>
            <input
              type="number"
              name="minStock"
              value={formData.minStock}
              onChange={handleChange}
              placeholder="5"
              className="form-input-clean"
            />
          </div>
        </div>

        {/* Category */}
        <div className="form-group-clean">
          <label className="form-label-clean">Kategori</label>
          <select
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            className="form-select-clean"
          >
            <option value="">Kategori seçin</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Info Box */}
        <div className="info-box-clean">
          <Camera className="w-5 h-5" />
          <div>
            <p className="info-title-clean">
              {mode === 'update' ? 'Güncelleme Modu' : 'Ekleme Modu'}
            </p>
            <p className="info-text-clean">
              {mode === 'update' 
                ? 'Ürün bilgilerini değiştirip güncelleyebilirsiniz' 
                : 'Kamera ile barkod okutarak yeni ürün ekleyin'}
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={isLoading || !formData.barcode}
          className="submit-btn-clean"
        >
          <Save className="w-5 h-5" />
          <span>
            {isLoading 
              ? 'Kaydediliyor...' 
              : mode === 'update' 
                ? 'Ürünü Güncelle' 
                : 'Ürünü Kaydet'}
          </span>
        </button>
      </form>
    </div>
  );
};

export default MobileProductAdd;
