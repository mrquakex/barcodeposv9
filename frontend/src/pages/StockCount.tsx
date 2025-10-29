import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, CheckCircle, ClipboardList, XCircle, Clock, Package } from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentButton from '../components/fluent/FluentButton';
import FluentBadge from '../components/fluent/FluentBadge';
import FluentDialog from '../components/fluent/FluentDialog';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface StockCount {
  id: string;
  countNumber: string;
  type: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  user: { name: string };
  _count?: { items: number };
}

const StockCount: React.FC = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<StockCount[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ 
    type: 'FULL',
    categoryId: '',
  });

  useEffect(() => {
    fetchCounts();
    fetchCategories();
  }, []);

  const fetchCounts = async () => {
    try {
      const response = await api.get('/stock-counts');
      setCounts(response.data.counts || response.data || []);
    } catch (error) {
      toast.error('Stok sayımları yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Categories fetch error:', error);
    }
  };

  const handleCreate = async () => {
    try {
      const payload: any = { type: formData.type };
      if (formData.type === 'CATEGORY' && formData.categoryId) {
        payload.categoryId = formData.categoryId;
      }

      const response = await api.post('/stock-counts/start', payload);
      toast.success(response.data.message || 'Stok sayımı başlatıldı');
      fetchCounts();
      setShowDialog(false);
      setFormData({ type: 'FULL', categoryId: '' });
      
      if (response.data.stockCount?.id) {
        navigate(`/stock-count/${response.data.stockCount.id}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Sayım başlatılamadı');
    }
  };

  const handleView = (countId: string) => {
    navigate(`/stock-count/${countId}`);
  };

  const filteredCounts = counts.filter((count) =>
    count.countNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    count.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground-secondary">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <ClipboardList className="w-7 h-7" />
            Stok Sayımı
          </h1>
          <p className="text-sm text-foreground-secondary mt-1">{counts.length} sayım kaydı</p>
        </div>
        <FluentButton
          appearance="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowDialog(true)}
        >
          Yeni Sayım
        </FluentButton>
      </div>

      <FluentCard depth="depth-4" className="p-4">
        <FluentInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Sayım ara..."
          icon={<Search className="w-4 h-4" />}
        />
      </FluentCard>

      <div className="space-y-3">
        {filteredCounts.length === 0 ? (
          <FluentCard depth="depth-4" className="p-8 text-center">
            <Package className="w-16 h-16 mx-auto text-foreground-secondary mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Henüz sayım yok</h3>
            <p className="text-sm text-foreground-secondary mb-4">
              Stok sayımı başlatarak ürünlerinizi sayabilirsiniz
            </p>
            <FluentButton
              appearance="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowDialog(true)}
            >
              Yeni Sayım Başlat
            </FluentButton>
          </FluentCard>
        ) : (
          filteredCounts.map((count) => (
            <FluentCard key={count.id} depth="depth-4" hoverable className="p-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  count.status === 'IN_PROGRESS'
                    ? 'bg-warning/10'
                    : count.status === 'COMPLETED'
                    ? 'bg-success/10'
                    : 'bg-error/10'
                }`}>
                  {count.status === 'IN_PROGRESS' ? (
                    <Clock className="w-6 h-6 text-warning" />
                  ) : count.status === 'COMPLETED' ? (
                    <CheckCircle className="w-6 h-6 text-success" />
                  ) : (
                    <XCircle className="w-6 h-6 text-error" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-foreground">{count.countNumber}</h4>
                    <FluentBadge
                      appearance={
                        count.status === 'IN_PROGRESS'
                          ? 'warning'
                          : count.status === 'COMPLETED'
                          ? 'success'
                          : 'error'
                      }
                      size="small"
                    >
                      {count.status === 'IN_PROGRESS'
                        ? 'Devam Ediyor'
                        : count.status === 'COMPLETED'
                        ? 'Tamamlandı'
                        : 'İptal'}
                    </FluentBadge>
                    <FluentBadge appearance="default" size="small">
                      {count.type === 'FULL'
                        ? 'Tam Sayım'
                        : count.type === 'CATEGORY'
                        ? 'Kategori'
                        : 'Düşük Stok'}
                    </FluentBadge>
                  </div>
                  <div className="flex gap-4 text-xs text-foreground-secondary">
                    <span>{count._count?.items || 0} ürün</span>
                    <span>{count.user.name}</span>
                    <span>
                      {new Date(count.startedAt).toLocaleDateString('tr-TR', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                <FluentButton
                  appearance="subtle"
                  size="small"
                  icon={<Eye className="w-4 h-4" />}
                  onClick={() => handleView(count.id)}
                >
                  Detay
                </FluentButton>
              </div>
            </FluentCard>
          ))
        )}
      </div>

      <FluentDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        title="Yeni Stok Sayımı"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Sayım Türü
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value, categoryId: '' })}
              className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
            >
              <option value="FULL">Tam Sayım (Tüm Ürünler)</option>
              <option value="CATEGORY">Kategori Bazlı Sayım</option>
              <option value="LOW_STOCK">Düşük Stok Sayımı</option>
            </select>
          </div>

          {formData.type === 'CATEGORY' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Kategori Seçin
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
              >
                <option value="">Kategori seçin...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-info/10 border border-info/20 rounded-lg p-3">
            <p className="text-xs text-foreground-secondary">
              {formData.type === 'FULL' && 'Tüm aktif ürünler sayıma dahil edilecek'}
              {formData.type === 'CATEGORY' && 'Seçilen kategorideki ürünler sayıma dahil edilecek'}
              {formData.type === 'LOW_STOCK' && 'Minimum stok seviyesinin altındaki ürünler sayıma dahil edilecek'}
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <FluentButton appearance="subtle" onClick={() => setShowDialog(false)}>
              İptal
            </FluentButton>
            <FluentButton 
              appearance="primary" 
              onClick={handleCreate}
              disabled={formData.type === 'CATEGORY' && !formData.categoryId}
            >
              Sayımı Başlat
            </FluentButton>
          </div>
        </div>
      </FluentDialog>
    </div>
  );
};

export default StockCount;
