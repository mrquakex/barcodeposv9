import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

interface ExcelImportProps {
  onImportComplete: () => void;
}

const ExcelImport: React.FC<ExcelImportProps> = ({ onImportComplete }) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        setPreview(json.slice(0, 5)); // İlk 5 kayıt önizleme
        toast.success(`${json.length} ürün yüklendi!`);
      } catch (error) {
        toast.error('Excel dosyası okunamadı!');
      }
    };
    reader.readAsBinaryString(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
  });

  const handleImport = async () => {
    if (preview.length === 0) {
      toast.error('Önce bir Excel dosyası yükleyin!');
      return;
    }

    setLoading(true);
    try {
      // Her ürünü API'ye gönder
      for (const item of preview) {
        await api.post('/products', {
          barcode: item.barkod || item.Barkod,
          name: item.urun_adi || item['Ürün Adı'],
          price: parseFloat(item.fiyat || item.Fiyat),
          cost: parseFloat(item.maliyet || item.Maliyet || 0),
          stock: parseInt(item.stok || item.Stok || 0),
          unit: item.birim || item.Birim || 'Adet',
          taxRate: parseFloat(item.kdv || item.KDV || 18),
        });
      }
      
      toast.success('Tüm ürünler başarıyla eklendi!');
      setPreview([]);
      onImportComplete();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'İçe aktarma başarısız!');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        'Barkod': '8690000000001',
        'Ürün Adı': 'Örnek Ürün 1',
        'Fiyat': 100,
        'Maliyet': 70,
        'Stok': 50,
        'Birim': 'Adet',
        'KDV': 18,
      },
      {
        'Barkod': '8690000000002',
        'Ürün Adı': 'Örnek Ürün 2',
        'Fiyat': 200,
        'Maliyet': 140,
        'Stok': 30,
        'Birim': 'Adet',
        'KDV': 18,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ürünler');
    XLSX.writeFile(wb, 'urun-sablonu.xlsx');
    toast.success('Şablon indirildi!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="border-2 border-dashed border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            Excel ile Toplu Ürün Yükleme
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Download Template */}
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Örnek Excel Şablonunu İndir
          </Button>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`
              relative p-12 border-2 border-dashed rounded-xl cursor-pointer
              transition-all duration-300
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-105' 
                : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/10'
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="text-center space-y-3">
              <motion.div
                animate={{ y: isDragActive ? -10 : 0 }}
                className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
              >
                <Upload className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <p className="text-lg font-semibold">
                  {isDragActive ? 'Dosyayı bırakın...' : 'Excel dosyasını sürükleyin'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  veya tıklayarak dosya seçin (.xlsx, .xls)
                </p>
              </div>
            </div>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between p-3 bg-green-100 dark:bg-green-950/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold">{preview.length} ürün hazır</span>
                </div>
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="p-2 text-left">Barkod</th>
                      <th className="p-2 text-left">Ürün Adı</th>
                      <th className="p-2 text-left">Fiyat</th>
                      <th className="p-2 text-left">Stok</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{item.barkod || item.Barkod}</td>
                        <td className="p-2">{item.urun_adi || item['Ürün Adı']}</td>
                        <td className="p-2">{item.fiyat || item.Fiyat} TL</td>
                        <td className="p-2">{item.stok || item.Stok}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button
                onClick={handleImport}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? 'İçe Aktarılıyor...' : 'Ürünleri İçe Aktar'}
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ExcelImport;

