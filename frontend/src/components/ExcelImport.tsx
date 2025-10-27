import React, { useState, useRef } from 'react';
import { Upload, Download, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
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
    failed: number;
    errors: string[];
  };
}

export const ExcelImport: React.FC<ExcelImportProps> = ({ onSuccess, onClose }) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Örnek Excel şablonu oluştur ve indir
  const downloadTemplate = () => {
    const template = [
      {
        'Barkod': '1234567890123',
        'Ürün Adı': 'Örnek Ürün',
        'Kategori': 'Gıda',
        'Alış Fiyatı': 10,
        'Satış Fiyatı': 15,
        'Stok': 100,
        'KDV': 18,
      },
      {
        'Barkod': '',
        'Ürün Adı': 'Başka Ürün',
        'Kategori': 'İçecek',
        'Alış Fiyatı': 5,
        'Satış Fiyatı': 8,
        'Stok': 50,
        'KDV': 8,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ürünler');
    
    // Sütun genişliklerini ayarla
    ws['!cols'] = [
      { wch: 15 }, // Barkod
      { wch: 30 }, // Ürün Adı
      { wch: 15 }, // Kategori
      { wch: 12 }, // Alış Fiyatı
      { wch: 12 }, // Satış Fiyatı
      { wch: 10 }, // Stok
      { wch: 8 },  // KDV
    ];

    XLSX.writeFile(wb, 'urun-sablonu.xlsx');
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
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post<ImportResult>('/products/bulk-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
      
      if (response.data.results.success > 0) {
        toast.success(
          `${response.data.results.success} ürün başarıyla aktarıldı!`,
          { duration: 4000 }
        );
        onSuccess?.();
      }

      if (response.data.results.failed > 0) {
        toast.error(
          `${response.data.results.failed} ürün aktarılamadı`,
          { duration: 4000 }
        );
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Yükleme başarısız');
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header - Apple Style */}
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Excel ile Ürün Aktar
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Excel veya CSV dosyası ile toplu ürün ekleyin
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Template Download Button */}
          <button
            onClick={downloadTemplate}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200 hover:border-blue-300 transition-all group"
          >
            <Download className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-blue-700">
              Excel Şablonunu İndir
            </span>
          </button>

          {/* Upload Area */}
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer
                transition-all duration-200
                ${isDragging
                  ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
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
                  w-20 h-20 rounded-full flex items-center justify-center
                  transition-all duration-200
                  ${isDragging ? 'bg-blue-100 scale-110' : 'bg-gray-100'}
                `}>
                  <Upload className={`w-10 h-10 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {isDragging ? 'Dosyayı buraya bırak' : 'Dosya seç veya sürükle'}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Excel (.xlsx, .xls) veya CSV - Maksimum 10MB
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected File */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  onClick={reset}
                  disabled={isUploading}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30"
              >
                {isUploading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Yükleniyor...</span>
                  </div>
                ) : (
                  'Yükle ve İşle'
                )}
              </button>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4 animate-slide-up">
              {/* Success/Fail Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-700">
                        {result.results.success}
                      </p>
                      <p className="text-sm text-green-600">Başarılı</p>
                    </div>
                  </div>
                </div>

                {result.results.failed > 0 && (
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-200">
                    <div className="flex items-center gap-3">
                      <XCircle className="w-6 h-6 text-red-600" />
                      <div>
                        <p className="text-2xl font-bold text-red-700">
                          {result.results.failed}
                        </p>
                        <p className="text-sm text-red-600">Başarısız</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Errors */}
              {result.results.errors.length > 0 && (
                <div className="max-h-48 overflow-y-auto bg-red-50 rounded-2xl border border-red-200 p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-red-700 mb-2">Hatalar:</p>
                      <ul className="space-y-1 text-sm text-red-600">
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

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-all"
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

