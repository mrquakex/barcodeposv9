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
    try {
      soundEffects.beep();
      hapticFeedback(ImpactStyle.Light);
      
      console.log('📸 Starting barcode scan for product add...');
      
      const permissionResult = await BarcodeScanner.checkPermissions();
      if (permissionResult.camera !== 'granted') {
        const result = await BarcodeScanner.requestPermissions();
        if (result.camera !== 'granted') {
          toast.error('Kamera izni gerekli');
          return;
        }
      }

      const scanResult = await BarcodeScanner.scan();
      console.log('📦 Scan result:', scanResult);

      if (scanResult.barcodes && scanResult.barcodes.length > 0) {
        const barcode = scanResult.barcodes[0].displayValue || scanResult.barcodes[0].rawValue;
        console.log('✅ Barcode:', barcode);
        
        if (barcode) {
          setFormData(prev => ({ ...prev, barcode }));
          toast.success(`Barkod: ${barcode}`);
          soundEffects.cashRegister();
          hapticFeedback(ImpactStyle.Medium);
        }
      }
    } catch (error: any) {
      console.error('❌ Scan error:', error);
      if (error.message && !error.message.toLowerCase().includes('cancel')) {
        toast.error('Barkod tarama hatası');
      }
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

      await api.post('/products', productData);
      
      toast.success('✅ Ürün eklendi!');
      soundEffects.cashRegister();
      hapticFeedback(ImpactStyle.Heavy);
      
      setTimeout(() => navigate('/products'), 500);
    } catch (error: any) {
      console.error('Failed to add product:', error);
      const message = error.response?.data?.message || 'Ürün eklenemedi';
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
        <h1 className="page-title-clean">Yeni Ürün</h1>
        <div className="w-10"></div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="add-form-clean">
        {/* Barcode */}
        <div className="form-group-clean">
          <label className="form-label-clean">
            Barkod <span className="required">*</span>
          </label>
          <div className="input-with-button">
            <input
              type="text"
              name="barcode"
              value={formData.barcode}
              onChange={handleChange}
              placeholder="Barkod numarası"
              className="form-input-clean"
              required
            />
            <button 
              type="button"
              onClick={scanBarcode}
              className="scan-btn-inline"
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
          <Package className="w-5 h-5" />
          <div>
            <p className="info-title-clean">Hızlı Ekleme</p>
            <p className="info-text-clean">Kamera ile barkod okutarak hızlıca ürün ekleyin</p>
          </div>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={isLoading}
          className="submit-btn-clean"
        >
          <Save className="w-5 h-5" />
          <span>{isLoading ? 'Kaydediliyor...' : 'Ürünü Kaydet'}</span>
        </button>
      </form>
    </div>
  );
};

export default MobileProductAdd;
