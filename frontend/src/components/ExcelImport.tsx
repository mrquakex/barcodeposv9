import React, { useState, useRef } from 'react';
import { Upload, Download, CheckCircle, XCircle, AlertCircle, X, Plus, Minimize2, Maximize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';

interface ExcelImportProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

interface ImportResult {
  message: string;
  results: {
    success: number;
    updated: number;
    created: number;
    failed: number;
    errors: string[];
  };
}

export const ExcelImport: React.FC<ExcelImportProps> = ({ onSuccess, onClose }) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isMinimized, setIsMinimized] = useState(false); // 🆕 Minimize durumu
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Örnek Excel şablonu oluştur ve indir (BenimPOS formatı)
  const downloadTemplate = () => {
    const template = [
      {
        'Ürün Barkodu': '8690637123456',
        'Ürün Adı': 'Coca Cola 330ml',
        'Adet': 100,
        'Birim': 'ADET',
        'Fiyat 1': 12.50,
        'KDV': 18,
        'Alış Fiyatı': 8.50,
        'Üst Ürün Grubu': '',
        'Ürün Grubu': 'İçecekler',
        'Fiyat 2': 0,
        'Stok Kodu': 'CC-330',
        'Ürün Detayı': 'Kutu Kola',
        'Satış Hızlı Ürün Grubu': 1,
        'Satış Hızlı Ürün Sırası': 0,
        'Kritik Stok Miktarı': 20,
      },
      {
        'Ürün Barkodu': '8690637789012',
        'Ürün Adı': 'Fanta 330ml',
        'Adet': 50,
        'Birim': 'ADET',
        'Fiyat 1': 11.00,
        'KDV': 18,
        'Alış Fiyatı': 7.50,
        'Üst Ürün Grubu': '',
        'Ürün Grubu': 'İçecekler',
        'Fiyat 2': 0,
        'Stok Kodu': 'FAN-330',
        'Ürün Detayı': 'Portakal Aromalı',
        'Satış Hızlı Ürün Grubu': 1,
        'Satış Hızlı Ürün Sırası': 1,
        'Kritik Stok Miktarı': 15,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ürünler');
    
    // Sütun genişliklerini ayarla (BenimPOS formatı - 15 sütun)
    ws['!cols'] = [
      { wch: 18 }, // A: Ürün Barkodu
      { wch: 35 }, // B: Ürün Adı
      { wch: 10 }, // C: Adet
      { wch: 10 }, // D: Birim
      { wch: 12 }, // E: Fiyat 1
      { wch: 8 },  // F: KDV
      { wch: 12 }, // G: Alış Fiyatı
      { wch: 18 }, // H: Üst Ürün Grubu
      { wch: 20 }, // I: Ürün Grubu
      { wch: 10 }, // J: Fiyat 2
      { wch: 15 }, // K: Stok Kodu
      { wch: 30 }, // L: Ürün Detayı
      { wch: 22 }, // M: Satış Hızlı Ürün Grubu
      { wch: 20 }, // N: Satış Hızlı Ürün Sırası
      { wch: 20 }, // O: Kritik Stok Miktarı
    ];

    XLSX.writeFile(wb, 'BenimPOS-Urun-Sablonu.xlsx');
    toast.success('Şablon indirildi');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ];

    if (!validTypes.includes(file.type)) {
      toast.error('Sadece Excel (.xlsx, .xls) ve CSV dosyaları yüklenebilir');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dosya boyutu 10MB\'dan küçük olmalıdır');
      return;
    }

    setFile(file);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    
    // 🍎 Apple-style smooth progress animation
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        currentProgress = prev;
        
        // Phase 1: Fast progress 0-60% (first 3 seconds)
        if (prev < 60) {
          return Math.min(prev + Math.random() * 8 + 5, 60);
        }
        // Phase 2: Medium progress 60-85% (next 5 seconds)
        else if (prev < 85) {
          return Math.min(prev + Math.random() * 3 + 1, 85);
        }
        // Phase 3: Slow progress 85-95% (waiting for backend)
        else if (prev < 95) {
          return Math.min(prev + Math.random() * 0.5 + 0.2, 95);
        }
        // Phase 4: Very slow 95-98% (long operations)
        else if (prev < 98) {
          return Math.min(prev + Math.random() * 0.2, 98);
        }
        // Phase 5: Hold at 98% until response
        else {
          return prev;
        }
      });
    }, 300);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post<ImportResult>('/products/bulk-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Show 100% briefly with smooth transition
      await new Promise(resolve => setTimeout(resolve, 500));

      setResult(response.data);
      
      // 🍎 Apple-style BIG notification for background completion
      if (isMinimized && response.data.results.success > 0) {
        const { created, updated } = response.data.results;
        let message = '';
        if (created > 0 && updated > 0) {
          message = `İçe Aktarma Tamamlandı\n${created} yeni ürün eklendi • ${updated} ürün güncellendi`;
        } else if (created > 0) {
          message = `İçe Aktarma Tamamlandı\n${created} yeni ürün eklendi`;
        } else if (updated > 0) {
          message = `İçe Aktarma Tamamlandı\n${updated} ürün güncellendi`;
        } else {
          message = `İçe Aktarma Tamamlandı\n${response.data.results.success} ürün işlendi`;
        }
        
        toast.success(message, { 
          duration: 6000,
          style: {
            fontSize: '15px',
            padding: '20px 24px',
            maxWidth: '420px',
            fontWeight: '500',
            lineHeight: '1.6',
          }
        });
        
        // Auto-close modal after notification
        setTimeout(() => {
          onClose?.();
        }, 2000);
      } else if (response.data.results.success > 0) {
        const { created, updated } = response.data.results;
        let message = '';
        if (created > 0 && updated > 0) {
          message = `${created} yeni eklendi • ${updated} güncellendi`;
        } else if (created > 0) {
          message = `${created} yeni ürün eklendi`;
        } else if (updated > 0) {
          message = `${updated} ürün güncellendi`;
        } else {
          message = `${response.data.results.success} ürün işlendi`;
        }
        
        toast.success(message, { duration: 4000 });
      }
      
      onSuccess?.();

      if (response.data.results.failed > 0) {
        toast.error(
          `${response.data.results.failed} ürün aktarılamadı`,
          { duration: 5000 }
        );
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      toast.error(error.response?.data?.error || 'İçe aktarma başarısız oldu');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 💠 Minimized Floating Card - Microsoft Fluent
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
        <div className="bg-card rounded-md fluent-depth-16 border border-border w-80 overflow-hidden">
          {/* Minimized Header */}
          <div className="px-4 py-3 bg-primary flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
              <span className="text-white fluent-subtitle">İçe Aktarma</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(false)}
                className="p-1.5 rounded hover:bg-white/20 transition-colors"
              >
                <Maximize2 className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
          
          {/* Mini Progress */}
          <div className="px-4 py-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1">
                <div className="h-2 bg-background-tertiary rounded overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
              <span className="fluent-body font-bold text-primary min-w-[45px] text-right">
                {Math.round(uploadProgress)}%
              </span>
            </div>
            
            <p className="fluent-caption text-foreground-secondary text-center">
              {uploadProgress < 60 && 'Dosya Hazırlanıyor'}
              {uploadProgress >= 60 && uploadProgress < 85 && 'İşleniyor'}
              {uploadProgress >= 85 && uploadProgress < 95 && 'Veritabanına Yazılıyor'}
              {uploadProgress >= 95 && uploadProgress < 100 && 'Tamamlanıyor'}
              {uploadProgress === 100 && 'Tamamlandı'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 💠 Full Modal - Microsoft Fluent Design
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="relative w-full max-w-2xl mx-4 bg-card rounded-md fluent-depth-64 overflow-hidden animate-scale-in border border-border">
        {/* Header - Microsoft Fluent Style */}
        <div className="px-6 py-5 border-b border-border bg-background-alt">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="fluent-title-1 text-foreground">
                Excel ile Ürün Aktar
              </h2>
              <p className="mt-1 fluent-caption text-foreground-secondary">
                Excel veya CSV dosyası ile toplu ürün ekleyin
              </p>
            </div>
            <div className="flex items-center gap-1">
              {isUploading && (
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-2 rounded hover:bg-background-tertiary transition-colors"
                  title="Arka plana al"
                >
                  <Minimize2 className="w-5 h-5 text-foreground-secondary" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded hover:bg-background-tertiary transition-colors"
              >
                <X className="w-5 h-5 text-foreground-secondary" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 bg-background">
          {/* Template Download Button - Fluent Style */}
          <button
            onClick={downloadTemplate}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-background-alt rounded border border-border hover:border-primary hover:fluent-depth-4 transition-all group"
          >
            <Download className="w-5 h-5 text-primary group-hover:scale-105 transition-transform" />
            <span className="fluent-subtitle text-foreground">
              Excel Şablonunu İndir
            </span>
          </button>

          {/* Upload Area - Fluent Style */}
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded p-12 text-center cursor-pointer
                transition-all duration-200
                ${isDragging
                  ? 'border-primary bg-background-alt scale-[1.01]'
                  : 'border-border hover:border-primary/50 hover:bg-background-alt'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="flex flex-col items-center gap-4">
                <div className={`
                  w-20 h-20 rounded flex items-center justify-center
                  transition-all duration-200
                  ${isDragging ? 'bg-primary/10 scale-105' : 'bg-background-tertiary'}
                `}>
                  <Upload className={`w-10 h-10 ${isDragging ? 'text-primary' : 'text-foreground-tertiary'}`} />
                </div>
                
                <div>
                  <p className="fluent-title-3 text-foreground">
                    {isDragging ? 'Dosyayı buraya bırak' : 'Dosya seç veya sürükle'}
                  </p>
                  <p className="mt-1 fluent-caption text-foreground-secondary">
                    Excel (.xlsx, .xls) veya CSV - Maksimum 10MB
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected File - Fluent Style */}
              <div className="flex items-center gap-4 p-4 bg-background-alt rounded border border-border">
                <div className="flex-shrink-0 w-12 h-12 bg-success/10 rounded flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="fluent-subtitle text-foreground truncate">{file.name}</p>
                  <p className="fluent-caption text-foreground-secondary">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  onClick={reset}
                  disabled={isUploading}
                  className="p-2 hover:bg-background-tertiary rounded transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-foreground-tertiary" />
                </button>
              </div>

              {/* Upload Button - Fluent Style */}
              {!isUploading ? (
                <button
                  onClick={handleUpload}
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white fluent-subtitle rounded transition-all fluent-depth-8"
                >
                  Yükle ve İşle
                </button>
              ) : (
                <div className="w-full py-8 bg-background-alt rounded border border-border">
                  {/* Microsoft Fluent Progress Ring */}
                  <div className="flex flex-col items-center gap-6">
                    {/* Circular Progress Ring */}
                    <div className="relative w-32 h-32">
                      {/* Background Circle */}
                      <svg className="w-32 h-32 -rotate-90 relative z-10">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          className="text-background-tertiary"
                        />
                        {/* Progress Circle */}
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          className="text-primary transition-all duration-500 ease-out"
                          style={{
                            strokeDasharray: `${2 * Math.PI * 56}`,
                            strokeDashoffset: `${2 * Math.PI * 56 * (1 - uploadProgress / 100)}`,
                          }}
                        />
                      </svg>
                      {/* Percentage Text */}
                      <div className="absolute inset-0 flex items-center justify-center z-20">
                        <span className="fluent-title-1 text-primary transition-all duration-300">
                          {Math.round(uploadProgress)}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Status Text - Fluent Style */}
                    <div className="text-center px-6">
                      <p className="fluent-title-3 text-foreground mb-2">
                        {uploadProgress < 100 ? 'Ürünler Aktarılıyor' : 'Tamamlandı'}
                      </p>
                      <p className="fluent-body text-foreground-secondary">
                        {uploadProgress < 60 && 'Dosya Hazırlanıyor'}
                        {uploadProgress >= 60 && uploadProgress < 85 && 'İşleniyor'}
                        {uploadProgress >= 85 && uploadProgress < 95 && 'Veritabanına Yazılıyor'}
                        {uploadProgress >= 95 && uploadProgress < 100 && 'Son İşlemler'}
                        {uploadProgress === 100 && 'Başarıyla Tamamlandı'}
                      </p>
                      {uploadProgress >= 85 && uploadProgress < 100 && (
                        <p className="fluent-caption text-foreground-tertiary mt-2">
                          Lütfen bekleyin...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results - Fluent Style */}
          {result && (
            <div className="space-y-4 animate-slide-up">
              {/* Success/Fail Summary */}
              <div className="grid grid-cols-3 gap-3">
                {/* Created */}
                {result.results.created > 0 && (
                  <div className="p-4 bg-primary/10 rounded border border-primary/30">
                    <div className="flex flex-col items-center text-center gap-2">
                      <Plus className="w-6 h-6 text-primary" />
                      <p className="fluent-title-1 text-primary">
                        {result.results.created}
                      </p>
                      <p className="fluent-caption text-primary">Yeni Eklendi</p>
                    </div>
                  </div>
                )}
                
                {/* Updated */}
                {result.results.updated > 0 && (
                  <div className="p-4 bg-success/10 rounded border border-success/30">
                    <div className="flex flex-col items-center text-center gap-2">
                      <CheckCircle className="w-6 h-6 text-success" />
                      <p className="fluent-title-1 text-success">
                        {result.results.updated}
                      </p>
                      <p className="fluent-caption text-success">Güncellendi</p>
                    </div>
                  </div>
                )}

                {/* Failed */}
                {result.results.failed > 0 && (
                  <div className="p-4 bg-red-50 rounded border border-red-200">
                    <div className="flex flex-col items-center text-center gap-2">
                      <XCircle className="w-6 h-6 text-red-600" />
                      <p className="fluent-title-1 text-red-600">
                        {result.results.failed}
                      </p>
                      <p className="fluent-caption text-red-600">Başarısız</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Errors */}
              {result.results.errors.length > 0 && (
                <div className="max-h-48 overflow-y-auto bg-red-50 rounded border border-red-200 p-4 fluent-scrollbar">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="fluent-subtitle text-red-700 mb-2">Hatalar:</p>
                      <ul className="space-y-1 fluent-caption text-red-600">
                        {result.results.errors.map((error, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-red-400">•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Close Button - Fluent Style */}
              <button
                onClick={onClose}
                className="w-full py-3 bg-background-alt hover:bg-background-tertiary text-foreground fluent-subtitle rounded transition-all border border-border"
              >
                Kapat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};

