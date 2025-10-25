import React from 'react';
import * as XLSX from 'xlsx';
import Button from '../ui/Button';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface ExcelExportProps {
  data: any[];
  filename: string;
}

const ExcelExport: React.FC<ExcelExportProps> = ({ data, filename }) => {
  const handleExport = () => {
    if (data.length === 0) {
      toast.error('Dışa aktarılacak veri yok!');
      return;
    }

    const exportData = data.map((item) => ({
      'Barkod': item.barcode,
      'Ürün Adı': item.name,
      'Fiyat': item.price,
      'Maliyet': item.cost,
      'Stok': item.stock,
      'Birim': item.unit,
      'KDV %': item.taxRate,
      'Min Stok': item.minStock,
      'Kategori': item.category?.name || '-',
      'Durum': item.isActive ? 'Aktif' : 'Pasif',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ürünler');
    
    // Kolon genişlikleri
    ws['!cols'] = [
      { width: 15 }, // Barkod
      { width: 30 }, // Ürün Adı
      { width: 10 }, // Fiyat
      { width: 10 }, // Maliyet
      { width: 10 }, // Stok
      { width: 10 }, // Birim
      { width: 10 }, // KDV
      { width: 12 }, // Min Stok
      { width: 15 }, // Kategori
      { width: 10 }, // Durum
    ];

    XLSX.writeFile(wb, `${filename}.xlsx`);
    toast.success('Excel dosyası indirildi!');
  };

  return (
    <Button onClick={handleExport} variant="outline" className="gap-2">
      <Download className="w-4 h-4" />
      Excel İndir
    </Button>
  );
};

export default ExcelExport;

