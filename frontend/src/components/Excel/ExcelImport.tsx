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
  const [allProducts, setAllProducts] = useState<any[]>([]);

  // Tüm özel karakterleri ve tırnakları temizle
  const cleanValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    let str = String(value).trim();
    
    // Başta ve sonda tırnak (", '), virgül (,), noktalı virgül (;) gibi karakterleri kaldır
    str = str.replace(/^[",';`´]+|[",';`´]+$/g, '');
    
    // Tekrar trim (temizleme sonrası boşluk kalabilir)
    str = str.trim();
    
    return str;
  };

  // Sayısal değerleri temizle ve parse et
  const cleanNumeric = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    
    let str = String(value).trim();
    // Başta ve sonda tırnak, virgül gibi karakterleri kaldır
    str = str.replace(/^[",';`´]+|[",';`´]+$/g, '');
    // Sadece sayı, nokta ve eksi işareti bırak
    str = str.replace(/[^\d.-]/g, '');
    
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

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
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 'A', defval: '' });
        
        // İlk satır başlık olabilir, kontrol et
        const startRow = json[0] && typeof json[0] === 'object' && 'A' in json[0] && 
                         (String(json[0].A).toLowerCase().includes('barkod') || 
                          String(json[0].A).toLowerCase().includes('ürün')) ? 1 : 0;
        
        const products = json.slice(startRow).filter((row: any) => row.A || row.B).map((row: any, index: number) => {
          const product = {
            barcode: cleanValue(row.A),
            name: cleanValue(row.B),
            stock: cleanValue(row.C),
            unit: cleanValue(row.D),
            price: cleanValue(row.E),
            taxRate: cleanValue(row.F),
            cost: cleanValue(row.G),
            parentCategory: cleanValue(row.H),
            category: cleanValue(row.I),
            price2: cleanValue(row.J),
            stockCode: cleanValue(row.K),
            description: cleanValue(row.L),
            quickSaleGroup: cleanValue(row.M),
            quickSaleOrder: cleanValue(row.N),
            minStock: cleanValue(row.O),
          };
          
          // İlk 3 ürün için temizleme logla
          if (index < 3) {
            console.log(`Ürün ${index + 1} temizlendi:`, {
              'Orijinal Barkod': row.A,
              'Temiz Barkod': product.barcode,
              'Orijinal Fiyat': row.E,
              'Temiz Fiyat': product.price,
            });
          }
          
          return product;
        });
        
        setAllProducts(products); // Tüm ürünleri sakla
        setPreview(products.slice(0, 10)); // İlk 10 kayıt önizleme
        toast.success(`${products.length} ürün yüklendi ve temizlendi!`);
      } catch (error) {
        console.error('Excel import error:', error);
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
    if (allProducts.length === 0) {
      toast.error('Önce bir Excel dosyası yükleyin!');
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Kategorileri bir kez fetch et (optimizasyon)
      const categoriesResponse = await api.get('/categories');
      const categories = categoriesResponse.data.categories;
      const categoryMap = new Map(); // Cache için

      console.log(`🚀 ${allProducts.length} ürün içe aktarılıyor...`);
      
      // Her ürünü API'ye gönder
      for (let i = 0; i < allProducts.length; i++) {
        const item = allProducts[i];
        
        // Her 50 üründe bir ilerleme göster
        if (i % 50 === 0) {
          console.log(`İlerleme: ${i}/${allProducts.length} ürün işlendi`);
        }
        
        try {
          // Kategori ID'sini bul veya oluştur (eğer kategori adı varsa)
          let categoryId = null;
          if (item.category) {
            const categoryKey = item.category.toLowerCase();
            
            // Cache'te var mı kontrol et
            if (categoryMap.has(categoryKey)) {
              categoryId = categoryMap.get(categoryKey);
            } else {
              // Cache'te yok, kategorilerde ara
              let category = categories.find((cat: any) => 
                cat.name.toLowerCase() === categoryKey
              );

              if (!category) {
                // Kategori yoksa oluştur
                try {
                  const newCategoryResponse = await api.post('/categories', {
                    name: item.category,
                    description: item.parentCategory || '',
                  });
                  category = newCategoryResponse.data.category;
                  categories.push(category); // Listeye ekle
                } catch (catError) {
                  console.error('Category creation error:', catError);
                }
              }

              if (category) {
                categoryId = category.id;
                categoryMap.set(categoryKey, categoryId); // Cache'e ekle
              }
            }
          }

          await api.post('/products', {
            barcode: item.barcode || undefined,
            name: item.name,
            price: cleanNumeric(item.price),
            cost: cleanNumeric(item.cost),
            stock: Math.floor(cleanNumeric(item.stock)),
            unit: item.unit || 'ADET',
            taxRate: cleanNumeric(item.taxRate) || 18,
            minStock: Math.floor(cleanNumeric(item.minStock)) || 5,
            description: item.description || item.stockCode || '',
            categoryId,
          });
          successCount++;
        } catch (itemError: any) {
          console.error(`Error importing ${item.name}:`, itemError);
          errorCount++;
        }
      }
      
      console.log(`✅ İçe aktarma tamamlandı: ${successCount} başarılı, ${errorCount} hata`);
      
      if (successCount > 0 && errorCount === 0) {
        toast.success(`✓ Tüm ürünler başarıyla eklendi! (${successCount} ürün)`);
      } else if (successCount > 0 && errorCount > 0) {
        toast.success(`✓ ${successCount} ürün eklendi, ${errorCount} ürün eklenemedi`);
      } else {
        toast.error(`✗ ${errorCount} ürün eklenemedi! Konsolu kontrol edin.`);
      }
      
      setPreview([]);
      setAllProducts([]);
      onImportComplete();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'İçe aktarma başarısız!');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Sütunları A-O olarak hazırla
    const template = [
      ['Ürün Barkodu', 'Ürün Adı', 'Adet', 'Birim', 'Fiyat 1 (Satış)', 'KDV', 'Alış Fiyatı', 'Üst Ürün Grubu', 'Ürün Grubu', 'Fiyat 2', 'Stok Kodu', 'Ürün Detayı', 'Satış Hızlı Ürün Grubu', 'Satış Hızlı Ürün Sırası', 'Kritik Stok Miktarı'],
      ['8690000000001', 'Coca Cola 330ml', 100, 'ADET', 15, 18, 10, 'İçecekler', 'Gazlı İçecekler', 15, 'CC-330', 'Coca Cola 330ml Kutu', 1, 1, 10],
      ['8690000000002', 'Fanta 330ml', 80, 'ADET', 12, 18, 8, 'İçecekler', 'Gazlı İçecekler', 12, 'FN-330', 'Fanta 330ml Kutu', 1, 2, 10],
      ['8690000000003', 'Süt 1L', 50, 'ADET', 25, 8, 18, 'Gıda', 'Süt Ürünleri', 25, 'SUT-1L', 'Tam Yağlı Süt 1 Litre', 1, 3, 5],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    
    // Sütun genişliklerini ayarla
    ws['!cols'] = [
      { wch: 15 }, // A - Barkod
      { wch: 30 }, // B - Ürün Adı
      { wch: 10 }, // C - Adet
      { wch: 10 }, // D - Birim
      { wch: 12 }, // E - Fiyat 1
      { wch: 8 },  // F - KDV
      { wch: 12 }, // G - Alış Fiyatı
      { wch: 20 }, // H - Üst Ürün Grubu
      { wch: 20 }, // I - Ürün Grubu
      { wch: 12 }, // J - Fiyat 2
      { wch: 15 }, // K - Stok Kodu
      { wch: 35 }, // L - Ürün Detayı
      { wch: 22 }, // M - Satış Hızlı Ürün Grubu
      { wch: 22 }, // N - Satış Hızlı Ürün Sırası
      { wch: 18 }, // O - Kritik Stok Miktarı
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ürünler');
    XLSX.writeFile(wb, 'urun-import-sablonu.xlsx');
    toast.success('Excel şablonu indirildi!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-h-[85vh] overflow-y-auto"
    >
      <Card className="border-2 border-dashed border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            Excel ile Toplu Ürün Yükleme
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Info Box */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border-2 border-blue-200 dark:border-blue-900">
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">📋 Excel Format Bilgisi</p>
            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <p>• <strong>Sütun A:</strong> Ürün Barkodu (Boş bırakılırsa otomatik)</p>
              <p>• <strong>Sütun B:</strong> Ürün Adı (Zorunlu)</p>
              <p>• <strong>Sütun C:</strong> Stok Miktarı</p>
              <p>• <strong>Sütun D:</strong> Birim (ADET, KG, GRAM)</p>
              <p>• <strong>Sütun E:</strong> Satış Fiyatı</p>
              <p>• <strong>Sütun F:</strong> KDV Oranı (%)</p>
              <p>• <strong>Sütun G:</strong> Alış Fiyatı</p>
              <p>• <strong>Sütun I:</strong> Ürün Grubu (Kategori)</p>
              <p>• <strong>Sütun O:</strong> Kritik Stok Miktarı</p>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-300 dark:border-blue-800">
              <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-2">🧹 Otomatik Temizleme:</p>
              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 font-mono">
                <p>• <span className="text-red-500">"8681254020277</span> → <span className="text-green-500">8681254020277</span></p>
                <p>• <span className="text-red-500">,55</span> → <span className="text-green-500">55</span></p>
                <p>• <span className="text-red-500">'ADET'</span> → <span className="text-green-500">ADET</span></p>
                <p>• Tırnak (", '), virgül (,), noktalı virgül (;) → Otomatik kaldırılır</p>
              </div>
            </div>
          </div>

          {/* Download Template */}
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="w-full h-11 font-bold"
          >
            <Download className="w-4 h-4 mr-2" />
            Excel Şablonunu İndir (A-O Sütunlar)
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
                className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center"
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
                  <thead className="bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-950/20">
                    <tr>
                      <th className="p-2 text-left font-bold">Barkod</th>
                      <th className="p-2 text-left font-bold">Ürün Adı</th>
                      <th className="p-2 text-left font-bold">Stok</th>
                      <th className="p-2 text-left font-bold">Birim</th>
                      <th className="p-2 text-left font-bold">Fiyat</th>
                      <th className="p-2 text-left font-bold">Kategori</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((item, index) => (
                      <tr key={index} className="border-t hover:bg-blue-50 dark:hover:bg-blue-950/10">
                        <td className="p-2 font-mono text-xs">{item.barcode || 'Otomatik'}</td>
                        <td className="p-2 font-semibold">{item.name}</td>
                        <td className="p-2">{item.stock}</td>
                        <td className="p-2">{item.unit}</td>
                        <td className="p-2 font-bold text-blue-700">₺{item.price}</td>
                        <td className="p-2 text-xs">{item.category || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  ℹ️ İlk 10 ürün önizleniyor. Tüm ürünler içe aktarılacak.
                </p>
              </div>

              <Button
                onClick={handleImport}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-700 to-slate-700 hover:from-blue-600 hover:to-slate-600"
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


