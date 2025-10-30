import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Eye, CheckCircle, ClipboardList, XCircle, Clock, Package,
  Download, RefreshCw, Users, TrendingUp, AlertTriangle, FileText,
  Filter, ChevronDown
} from 'lucide-react';
import FluentCard from '../components/fluent/FluentCard';
import FluentInput from '../components/fluent/FluentInput';
import FluentButton from '../components/fluent/FluentButton';
import FluentBadge from '../components/fluent/FluentBadge';
import FluentDialog from '../components/fluent/FluentDialog';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import * as XLSX from 'xlsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface StockCount {
  id: string;
  countNumber: string;
  type: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  user: { name: string };
  _count?: { items: number };
  totalVariance?: number;
  assignedUsers?: string[];
}

interface CountTemplate {
  id: string;
  name: string;
  type: string;
  categoryId?: string;
  description?: string;
}

const StockCountUpgraded: React.FC = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<StockCount[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<CountTemplate[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [formData, setFormData] = useState({ 
    type: 'FULL',
    categoryId: '',
    assignedUsers: [] as string[],
    templateId: '',
  });
  const [templateData, setTemplateData] = useState({
    name: '',
    type: 'FULL',
    categoryId: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [countsRes, categoriesRes, usersRes] = await Promise.all([
        api.get('/stock-counts'),
        api.get('/categories'),
        api.get('/users'),
      ]);
      setCounts(countsRes.data.counts || countsRes.data || []);
      setCategories(categoriesRes.data.categories || []);
      setUsers(usersRes.data.users || []);
      // Templates would come from API in real implementation
      setTemplates([
        { id: '1', name: 'Tam Sayım Şablonu', type: 'FULL', description: 'Tüm ürünler için sayım' },
        { id: '2', name: 'Hızlı Sayım', type: 'SPOT', description: 'Seçili ürünler için hızlı sayım' },
      ]);
    } catch (error) {
      toast.error('Veri yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const payload: any = { 
        type: formData.type,
        assignedUsers: formData.assignedUsers,
      };
      if (formData.type === 'CATEGORY' && formData.categoryId) {
        payload.categoryId = formData.categoryId;
      }

      const response = await api.post('/stock-counts/start', payload);
      toast.success('Stok sayımı başlatıldı');
      fetchData();
      setShowDialog(false);
      resetForm();
      
      if (response.data.stockCount?.id) {
        navigate(`/stock-count/${response.data.stockCount.id}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Sayım başlatılamadı');
    }
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setFormData({
      type: template.type,
      categoryId: template.categoryId || '',
      assignedUsers: [],
      templateId,
    });
    setShowDialog(true);
  };

  const handleSaveTemplate = async () => {
    try {
      // In real app, this would POST to /stock-counts/templates
      toast.success('Şablon kaydedildi');
      setShowTemplateDialog(false);
      setTemplateData({ name: '', type: 'FULL', categoryId: '', description: '' });
    } catch (error: any) {
      toast.error('Şablon kaydedilemedi');
    }
  };

  const resetForm = () => {
    setFormData({ type: 'FULL', categoryId: '', assignedUsers: [], templateId: '' });
  };

  const handleView = (countId: string) => {
    navigate(`/stock-count/${countId}`);
  };

  const exportToExcel = () => {
    const data = filteredCounts.map((c) => ({
      'Sayım No': c.countNumber,
      Tip: c.type,
      Durum: c.status,
      'Başlangıç': new Date(c.startedAt).toLocaleString('tr-TR'),
      'Tamamlanma': c.completedAt ? new Date(c.completedAt).toLocaleString('tr-TR') : '-',
      Kullanıcı: c.user.name,
      'Ürün Sayısı': c._count?.items || 0,
      'Toplam Fark': c.totalVariance || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stok Sayımları');
    XLSX.writeFile(wb, `stok-sayimlari-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel dosyası indirildi');
  };

  const filteredCounts = counts.filter((count) => {
    const matchesSearch =
      count.countNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      count.user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || count.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // KPI calculations
  const activeCounts = counts.filter(c => c.status === 'IN_PROGRESS').length;
  const completedCounts = counts.filter(c => c.status === 'COMPLETED').length;
  const totalVariance = counts
    .filter(c => c.status === 'COMPLETED')
    .reduce((sum, c) => sum + (c.totalVariance || 0), 0);
  const todayCounts = counts.filter((c) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(c.startedAt) >= today;
  }).length;

  // Chart data
  const statusData = {
    labels: ['Aktif', 'Tamamlandı', 'İptal'],
    datasets: [
      {
        data: [
          counts.filter(c => c.status === 'IN_PROGRESS').length,
          counts.filter(c => c.status === 'COMPLETED').length,
          counts.filter(c => c.status === 'CANCELLED').length,
        ],
        backgroundColor: ['#3b82f6', '#10b981', '#ef4444'],
      },
    ],
  };

  const typeData = {
    labels: ['Tam Sayım', 'Kategori', 'Nokta Sayım'],
    datasets: [
      {
        label: 'Sayım Tipi',
        data: [
          counts.filter(c => c.type === 'FULL').length,
          counts.filter(c => c.type === 'CATEGORY').length,
          counts.filter(c => c.type === 'SPOT').length,
        ],
        backgroundColor: '#667eea',
      },
    ],
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <FluentBadge appearance="info">Devam Ediyor</FluentBadge>;
      case 'COMPLETED':
        return <FluentBadge appearance="success">Tamamlandı</FluentBadge>;
      case 'CANCELLED':
        return <FluentBadge appearance="error">İptal</FluentBadge>;
      default:
        return <FluentBadge appearance="default">{status}</FluentBadge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground-secondary">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Stok Sayımı</h1>
          <p className="text-foreground-secondary mt-1">{filteredCounts.length} sayım</p>
        </div>
        <div className="flex items-center gap-2">
          <FluentButton
            icon={<FileText className="w-4 h-4" />}
            onClick={() => setShowTemplateDialog(true)}
            appearance="subtle"
          >
            Şablon
          </FluentButton>
          <FluentButton
            icon={<Download className="w-4 h-4" />}
            onClick={exportToExcel}
            appearance="subtle"
          >
            Excel
          </FluentButton>
          <FluentButton
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchData}
            appearance="subtle"
          />
          <FluentButton
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowDialog(true)}
            appearance="primary"
          >
            Yeni Sayım
          </FluentButton>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FluentCard depth="depth-8" className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-info/10 text-info rounded-lg flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Aktif Sayımlar</p>
              <p className="text-2xl font-semibold text-foreground">{activeCounts}</p>
            </div>
          </div>
        </FluentCard>

        <FluentCard depth="depth-8" className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-success/10 text-success rounded-lg flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Tamamlanan</p>
              <p className="text-2xl font-semibold text-foreground">{completedCounts}</p>
            </div>
          </div>
        </FluentCard>

        <FluentCard depth="depth-8" className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-warning/10 text-warning rounded-lg flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Toplam Fark</p>
              <p className="text-2xl font-semibold text-foreground">{Math.abs(totalVariance)}</p>
            </div>
          </div>
        </FluentCard>

        <FluentCard depth="depth-8" className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Bugün</p>
              <p className="text-2xl font-semibold text-foreground">{todayCounts}</p>
            </div>
          </div>
        </FluentCard>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FluentCard depth="depth-4" className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Sayım Durumu</h2>
          <div className="h-64 flex items-center justify-center">
            <Pie data={statusData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </FluentCard>

        <FluentCard depth="depth-4" className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Sayım Tipi Dağılımı</h2>
          <div className="h-64">
            <Bar
              data={typeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        </FluentCard>
      </div>

      {/* Templates Section */}
      {templates.length > 0 && (
        <FluentCard depth="depth-4" className="p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4">Hızlı Başlat (Şablonlar)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-4 border border-border rounded-lg hover:border-primary cursor-pointer transition-colors"
                onClick={() => handleCreateFromTemplate(template.id)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  <h3 className="font-medium text-foreground">{template.name}</h3>
                </div>
                <p className="text-sm text-foreground-secondary">{template.description}</p>
              </div>
            ))}
          </div>
        </FluentCard>
      )}

      {/* Filters */}
      <FluentCard depth="depth-4" className="p-5">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <FluentInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Sayım no veya kullanıcı ara..."
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex gap-2">
            {['ALL', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
              <FluentButton
                key={status}
                appearance={filterStatus === status ? 'primary' : 'subtle'}
                size="small"
                onClick={() => setFilterStatus(status)}
              >
                {status === 'ALL' ? 'Tümü' :
                 status === 'IN_PROGRESS' ? 'Aktif' :
                 status === 'COMPLETED' ? 'Tamamlandı' :
                 'İptal'}
              </FluentButton>
            ))}
          </div>
        </div>
      </FluentCard>

      {/* Counts List */}
      <div className="space-y-3">
        {filteredCounts.map((count) => (
          <FluentCard key={count.id} depth="depth-4" className="p-5 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-12 h-12 bg-background-alt rounded-full flex items-center justify-center shrink-0">
                <ClipboardList className="w-6 h-6 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-foreground">{count.countNumber}</h4>
                  {getStatusBadge(count.status)}
                  <FluentBadge appearance="default" size="small">
                    {count.type === 'FULL' ? 'Tam Sayım' :
                     count.type === 'CATEGORY' ? 'Kategori' :
                     'Nokta Sayım'}
                  </FluentBadge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground-secondary">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {count.user.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {count._count?.items || 0} ürün
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(count.startedAt).toLocaleDateString('tr-TR')}
                  </span>
                  {count.completedAt && (
                    <span className="flex items-center gap-1 text-success">
                      <CheckCircle className="w-3 h-3" />
                      {new Date(count.completedAt).toLocaleDateString('tr-TR')}
                    </span>
                  )}
                  {count.totalVariance !== undefined && count.totalVariance !== 0 && (
                    <span className={`flex items-center gap-1 ${count.totalVariance > 0 ? 'text-success' : 'text-destructive'}`}>
                      <TrendingUp className="w-3 h-3" />
                      Fark: {count.totalVariance > 0 ? '+' : ''}{count.totalVariance}
                    </span>
                  )}
                </div>
              </div>

              <FluentButton
                icon={<Eye className="w-4 h-4" />}
                onClick={() => handleView(count.id)}
                appearance="subtle"
                size="small"
              >
                Detay
              </FluentButton>
            </div>
          </FluentCard>
        ))}
      </div>

      {filteredCounts.length === 0 && (
        <div className="text-center py-12">
          <ClipboardList className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
          <p className="text-foreground-secondary">
            {searchTerm || filterStatus !== 'ALL' ? 'Sonuç bulunamadı' : 'Henüz sayım yok'}
          </p>
        </div>
      )}

      {/* Create Dialog */}
      <FluentDialog
        open={showDialog}
        onClose={() => {
          setShowDialog(false);
          resetForm();
        }}
        title="Yeni Stok Sayımı"
        size="medium"
      >
        <div className="space-y-4 p-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Sayım Tipi</label>
            <div className="grid grid-cols-3 gap-2">
              {['FULL', 'CATEGORY', 'SPOT'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type })}
                  className={`px-4 py-2 rounded-md border transition-colors ${
                    formData.type === type
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  {type === 'FULL' ? 'Tam Sayım' :
                   type === 'CATEGORY' ? 'Kategori' :
                   'Nokta Sayım'}
                </button>
              ))}
            </div>
          </div>

          {formData.type === 'CATEGORY' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Kategori</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Kategori seçin</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Sayıcılar (Çoklu Seçim)
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-md p-3">
              {users.map((user) => (
                <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.assignedUsers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          assignedUsers: [...formData.assignedUsers, user.id],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          assignedUsers: formData.assignedUsers.filter((id) => id !== user.id),
                        });
                      }
                    }}
                    className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">{user.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <FluentButton
              onClick={() => {
                setShowDialog(false);
                resetForm();
              }}
              appearance="subtle"
            >
              İptal
            </FluentButton>
            <FluentButton onClick={handleCreate} appearance="primary">
              Başlat
            </FluentButton>
          </div>
        </div>
      </FluentDialog>

      {/* Template Dialog */}
      <FluentDialog
        open={showTemplateDialog}
        onClose={() => setShowTemplateDialog(false)}
        title="Yeni Şablon Oluştur"
        size="medium"
      >
        <div className="space-y-4 p-4">
          <FluentInput
            label="Şablon Adı"
            value={templateData.name}
            onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Tip</label>
            <select
              value={templateData.type}
              onChange={(e) => setTemplateData({ ...templateData, type: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="FULL">Tam Sayım</option>
              <option value="CATEGORY">Kategori</option>
              <option value="SPOT">Nokta Sayım</option>
            </select>
          </div>

          {templateData.type === 'CATEGORY' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Kategori</label>
              <select
                value={templateData.categoryId}
                onChange={(e) => setTemplateData({ ...templateData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Kategori seçin</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Açıklama</label>
            <textarea
              value={templateData.description}
              onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Şablon açıklaması..."
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <FluentButton onClick={() => setShowTemplateDialog(false)} appearance="subtle">
              İptal
            </FluentButton>
            <FluentButton onClick={handleSaveTemplate} appearance="primary">
              Kaydet
            </FluentButton>
          </div>
        </div>
      </FluentDialog>
    </div>
  );
};

export default StockCountUpgraded;

