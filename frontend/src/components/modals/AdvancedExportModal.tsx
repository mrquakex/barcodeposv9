import React, { useState, useEffect } from 'react';
import { X, Download, Mail, FileSpreadsheet, FileText, FileJson, File, Calendar, Filter } from 'lucide-react';
import FluentButton from '../fluent/FluentButton';
import FluentInput from '../fluent/FluentInput';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface AdvancedExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ReportType = 'products' | 'movements' | 'abc' | 'aging' | 'turnover' | 'valuation';
type ExportFormat = 'excel' | 'pdf' | 'csv' | 'json';

const AdvancedExportModal: React.FC<AdvancedExportModalProps> = ({ isOpen, onClose }) => {
  const [reportType, setReportType] = useState<ReportType>('products');
  const [format, setFormat] = useState<ExportFormat>('excel');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('all');
  const [supplier, setSupplier] = useState('all');
  const [includeInactive, setIncludeInactive] = useState(true);
  const [includeImages, setIncludeImages] = useState(false);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [excludeZeroStock, setExcludeZeroStock] = useState(false);
  const [includeLogo, setIncludeLogo] = useState(true);
  const [emailTo, setEmailTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (isOpen) {
      // Set default dates (last 30 days)
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      setEndDate(today.toISOString().split('T')[0]);
      setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);

      // Fetch categories and suppliers
      fetchFilters();
    }
  }, [isOpen]);

  const fetchFilters = async () => {
    try {
      const [catRes, supRes] = await Promise.all([
        api.get('/categories'),
        api.get('/suppliers')
      ]);
      setCategories(catRes.data.categories || catRes.data || []);
      setSuppliers(supRes.data.suppliers || supRes.data || []);
    } catch (error) {
      console.error('Filters fetch error:', error);
    }
  };

  const reportTypes = [
    { id: 'products', label: 'Ürün Listesi', icon: FileSpreadsheet },
    { id: 'movements', label: 'Stok Hareketleri', icon: FileText },
    { id: 'abc', label: 'ABC Analizi', icon: FileJson },
    { id: 'aging', label: 'Yaşlanma Raporu', icon: File },
    { id: 'turnover', label: 'Devir Hızı', icon: FileSpreadsheet },
    { id: 'valuation', label: 'Değerleme Raporu', icon: FileText },
  ];

  const formats = [
    { id: 'excel', label: 'Excel', ext: '.xlsx', icon: '📊', color: 'green' },
    { id: 'pdf', label: 'PDF', ext: '.pdf', icon: '📄', color: 'red' },
    { id: 'csv', label: 'CSV', ext: '.csv', icon: '📝', color: 'blue' },
    { id: 'json', label: 'JSON', ext: '.json', icon: '🔧', color: 'purple' },
  ];

  const quickDateRanges = [
    { label: 'Bugün', days: 0 },
    { label: 'Son 7 Gün', days: 7 },
    { label: 'Son 30 Gün', days: 30 },
    { label: 'Bu Ay', days: 'thisMonth' },
    { label: 'Geçen Ay', days: 'lastMonth' },
  ];

  const setQuickDate = (days: number | string) => {
    const today = new Date();
    setEndDate(today.toISOString().split('T')[0]);

    if (days === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
    } else if (days === 'lastMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    } else if (typeof days === 'number') {
      const pastDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
      setStartDate(pastDate.toISOString().split('T')[0]);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const params: any = {
        reportType,
        format,
        startDate,
        endDate,
        category: category !== 'all' ? category : undefined,
        supplier: supplier !== 'all' ? supplier : undefined,
        includeInactive,
        includeImages: format === 'pdf' ? includeImages : false,
        includeSummary,
        includeCharts: format !== 'csv' ? includeCharts : false,
        excludeZeroStock,
        includeLogo: format === 'pdf' ? includeLogo : false,
      };

      const response = await api.get('/stock/advanced-export', {
        params,
        responseType: 'blob'
      });

      // Download file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const formatExt = formats.find(f => f.id === format)?.ext || '.xlsx';
      link.setAttribute('download', `${reportType}-rapor-${new Date().toISOString().split('T')[0]}${formatExt}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(`✅ ${reportType} raporu indirildi!`);
      onClose();
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.error || 'Dışa aktarma başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSend = async () => {
    if (!emailTo) {
      toast.error('Lütfen e-posta adresi girin');
      return;
    }

    setLoading(true);
    try {
      await api.post('/stock/email-report', {
        reportType,
        format,
        startDate,
        endDate,
        category: category !== 'all' ? category : undefined,
        supplier: supplier !== 'all' ? supplier : undefined,
        emailTo,
        includeCharts,
      });

      toast.success(`✅ Rapor ${emailTo} adresine gönderildi!`);
      onClose();
    } catch (error: any) {
      console.error('Email send error:', error);
      toast.error(error.response?.data?.error || 'E-posta gönderimi başarısız');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/10 to-purple-500/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Download className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Gelişmiş Dışa Aktarma</h2>
                <p className="text-sm text-foreground-secondary">Özelleştirilebilir raporlar oluşturun</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-foreground-secondary" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">📊 Rapor Türü</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {reportTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setReportType(type.id as ReportType)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        reportType === type.id
                          ? 'border-primary bg-primary/10 shadow-lg'
                          : 'border-border hover:border-primary/50 hover:bg-card-hover'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mx-auto mb-2 ${reportType === type.id ? 'text-primary' : 'text-foreground-secondary'}`} />
                      <p className={`text-sm font-medium ${reportType === type.id ? 'text-primary' : 'text-foreground'}`}>
                        {type.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Format */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">📁 Format</label>
              <div className="grid grid-cols-4 gap-3">
                {formats.map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setFormat(fmt.id as ExportFormat)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      format === fmt.id
                        ? 'border-primary bg-primary/10 shadow-lg scale-105'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="text-2xl mb-1 block">{fmt.icon}</span>
                    <p className={`text-xs font-medium ${format === fmt.id ? 'text-primary' : 'text-foreground'}`}>
                      {fmt.label}
                    </p>
                    <p className="text-xs text-foreground-secondary">{fmt.ext}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">📅 Tarih Aralığı</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {quickDateRanges.map((range) => (
                  <button
                    key={range.label}
                    onClick={() => setQuickDate(range.days)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-border hover:border-primary hover:bg-primary/10 transition-colors"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FluentInput
                  label="Başlangıç"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <FluentInput
                  label="Bitiş"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Filters */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">🎯 Filtreler</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-foreground-secondary mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="all">Tümü</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-foreground-secondary mb-1">Tedarikçi</label>
                  <select
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="all">Tümü</option>
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">⚙️ Gelişmiş Seçenekler</label>
              <div className="grid grid-cols-2 gap-3">
                {format === 'pdf' && (
                  <label className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-card-hover cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={includeImages}
                      onChange={(e) => setIncludeImages(e.target.checked)}
                      className="form-checkbox h-4 w-4 text-primary rounded"
                    />
                    <span className="text-sm text-foreground">Görseller dahil</span>
                  </label>
                )}
                <label className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-card-hover cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={includeSummary}
                    onChange={(e) => setIncludeSummary(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-primary rounded"
                  />
                  <span className="text-sm text-foreground">Özet istatistikler</span>
                </label>
                {format !== 'csv' && (
                  <label className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-card-hover cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={includeCharts}
                      onChange={(e) => setIncludeCharts(e.target.checked)}
                      className="form-checkbox h-4 w-4 text-primary rounded"
                    />
                    <span className="text-sm text-foreground">Grafikler dahil</span>
                  </label>
                )}
                <label className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-card-hover cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={excludeZeroStock}
                    onChange={(e) => setExcludeZeroStock(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-primary rounded"
                  />
                  <span className="text-sm text-foreground">Sıfır stokları hariç tut</span>
                </label>
                {format === 'pdf' && (
                  <label className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-card-hover cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={includeLogo}
                      onChange={(e) => setIncludeLogo(e.target.checked)}
                      className="form-checkbox h-4 w-4 text-primary rounded"
                    />
                    <span className="text-sm text-foreground">Logo ve başlık ekle</span>
                  </label>
                )}
                <label className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-card-hover cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={includeInactive}
                    onChange={(e) => setIncludeInactive(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-primary rounded"
                  />
                  <span className="text-sm text-foreground">Pasif ürünler dahil</span>
                </label>
              </div>
            </div>

            {/* Email (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">📧 E-posta Gönder (Opsiyonel)</label>
              <FluentInput
                type="email"
                placeholder="ornek@sirket.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 p-6 border-t border-border bg-card-hover">
            <div className="text-sm text-foreground-secondary">
              {startDate && endDate && `${new Date(startDate).toLocaleDateString('tr-TR')} - ${new Date(endDate).toLocaleDateString('tr-TR')}`}
            </div>
            <div className="flex gap-3">
              <FluentButton
                appearance="subtle"
                onClick={onClose}
              >
                İptal
              </FluentButton>
              {emailTo && (
                <FluentButton
                  appearance="subtle"
                  onClick={handleEmailSend}
                  loading={loading}
                  icon={<Mail className="w-4 h-4" />}
                >
                  📧 E-posta Gönder
                </FluentButton>
              )}
              <FluentButton
                appearance="primary"
                onClick={handleExport}
                loading={loading}
                icon={<Download className="w-4 h-4" />}
              >
                📥 İndir
              </FluentButton>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AdvancedExportModal;

