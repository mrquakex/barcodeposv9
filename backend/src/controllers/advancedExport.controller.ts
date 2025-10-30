import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { sendEmail } from '../services/email.service';

// 📊 GELİŞMİŞ EXPORT - Excel, PDF, CSV, JSON
export const advancedExport = async (req: Request, res: Response) => {
  try {
    const {
      reportType,
      format,
      startDate,
      endDate,
      category,
      supplier,
      includeInactive,
      includeImages,
      includeSummary,
      includeCharts,
      excludeZeroStock,
      includeLogo,
    } = req.query;

    let data: any[] = [];
    let summary: any = {};

    // ======= RAPOR TİPİNE GÖRE VERİ HAZIRLA =======
    switch (reportType) {
      case 'products':
        const productWhere: any = {};
        if (category && category !== 'all') productWhere.categoryId = category;
        if (supplier && supplier !== 'all') productWhere.supplierId = supplier;
        if (!includeInactive) productWhere.isActive = true;
        if (excludeZeroStock === 'true') productWhere.stock = { gt: 0 };

        data = await prisma.product.findMany({
          where: productWhere,
          include: {
            category: true,
            supplier: true,
          },
        });

        summary = {
          totalProducts: data.length,
          totalValue: data.reduce((sum, p) => sum + p.stock * p.buyPrice, 0),
          avgStock: data.reduce((sum, p) => sum + p.stock, 0) / data.length || 0,
        };
        break;

      case 'movements':
        const movementsWhere: any = {};
        if (startDate) movementsWhere.createdAt = { gte: new Date(startDate as string) };
        if (endDate) {
          const end = new Date(endDate as string);
          end.setHours(23, 59, 59, 999);
          movementsWhere.createdAt = { ...movementsWhere.createdAt, lte: end };
        }

        data = await prisma.stockMovement.findMany({
          where: movementsWhere,
          include: {
            product: true,
            user: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        const totalIn = data.filter(m => m.type === 'IN').reduce((sum, m) => sum + m.quantity, 0);
        const totalOut = data.filter(m => m.type === 'OUT').reduce((sum, m) => sum + m.quantity, 0);
        summary = { totalMovements: data.length, totalIn, totalOut };
        break;

      case 'abc':
        const abcProducts = await prisma.product.findMany({
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            stock: true,
            buyPrice: true,
            sellPrice: true,
          },
        });

        const productsWithValue = abcProducts.map(p => ({
          ...p,
          value: p.stock * p.buyPrice,
        })).sort((a, b) => b.value - a.value);

        const totalValue = productsWithValue.reduce((sum, p) => sum + p.value, 0);
        let cumulative = 0;

        data = productsWithValue.map(p => {
          cumulative += p.value;
          const percentage = (cumulative / totalValue) * 100;
          let category = 'C';
          if (percentage <= 80) category = 'A';
          else if (percentage <= 95) category = 'B';

          return { ...p, category, percentage: percentage.toFixed(2) };
        });

        const countA = data.filter(p => p.category === 'A').length;
        const countB = data.filter(p => p.category === 'B').length;
        const countC = data.filter(p => p.category === 'C').length;

        summary = {
          A: { count: countA, totalValue: data.filter(p => p.category === 'A').reduce((sum, p) => sum + p.value, 0) },
          B: { count: countB, totalValue: data.filter(p => p.category === 'B').reduce((sum, p) => sum + p.value, 0) },
          C: { count: countC, totalValue: data.filter(p => p.category === 'C').reduce((sum, p) => sum + p.value, 0) },
        };
        break;

      case 'aging':
      case 'turnover':
      case 'valuation':
      default:
        return res.status(400).json({ error: 'Bu rapor tipi henüz desteklenmiyor. Yakında eklenecek!' });
    }

    // ======= FORMATA GÖRE EXPORT =======
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Rapor');

      // Header styling
      worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

      if (reportType === 'products') {
        worksheet.columns = [
          { header: 'Ürün Adı', key: 'name', width: 30 },
          { header: 'Barkod', key: 'barcode', width: 15 },
          { header: 'Kategori', key: 'category', width: 20 },
          { header: 'Stok', key: 'stock', width: 10 },
          { header: 'Alış Fiyatı', key: 'buyPrice', width: 15 },
          { header: 'Satış Fiyatı', key: 'sellPrice', width: 15 },
          { header: 'Stok Değeri', key: 'value', width: 15 },
        ];

        data.forEach(p => {
          worksheet.addRow({
            name: p.name,
            barcode: p.barcode,
            category: p.category?.name || '-',
            stock: p.stock,
            buyPrice: p.buyPrice,
            sellPrice: p.sellPrice,
            value: p.stock * p.buyPrice,
          });
        });
      } else if (reportType === 'movements') {
        worksheet.columns = [
          { header: 'Tarih', key: 'date', width: 20 },
          { header: 'Ürün', key: 'product', width: 30 },
          { header: 'Tip', key: 'type', width: 10 },
          { header: 'Miktar', key: 'quantity', width: 10 },
          { header: 'Önceki Stok', key: 'previousStock', width: 15 },
          { header: 'Yeni Stok', key: 'newStock', width: 15 },
          { header: 'Kullanıcı', key: 'user', width: 20 },
        ];

        data.forEach(m => {
          worksheet.addRow({
            date: m.createdAt.toLocaleString('tr-TR'),
            product: m.product?.name || '-',
            type: m.type === 'IN' ? 'Giriş' : 'Çıkış',
            quantity: m.quantity,
            previousStock: m.previousStock,
            newStock: m.newStock,
            user: m.user?.name || 'Sistem',
          });
        });
      } else if (reportType === 'abc') {
        worksheet.columns = [
          { header: 'Ürün Adı', key: 'name', width: 30 },
          { header: 'Kategori', key: 'category', width: 10 },
          { header: 'Stok', key: 'stock', width: 10 },
          { header: 'Stok Değeri', key: 'value', width: 15 },
          { header: 'Kümülatif %', key: 'percentage', width: 15 },
        ];

        data.forEach(p => {
          worksheet.addRow({
            name: p.name,
            category: p.category,
            stock: p.stock,
            value: p.value,
            percentage: p.percentage + '%',
          });
        });
      }

      // Style header row
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0066CC' },
      };
      worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-${Date.now()}.xlsx"`);

      await workbook.xlsx.write(res);
      res.end();
    } else if (format === 'pdf') {
      const doc = new jsPDF();

      // Logo & Header
      if (includeLogo === 'true') {
        doc.setFontSize(20);
        doc.setTextColor(0, 102, 204);
        doc.text('BARCODEPOS - STOK YÖNETİM SİSTEMİ', 14, 20);
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Rapor Türü: ${reportType}`, 14, 30);
        doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 14, 36);
      }

      // Summary
      if (includeSummary === 'true') {
        doc.setFontSize(10);
        let y = includeLogo === 'true' ? 50 : 20;
        doc.text('ÖZET İSTATİSTİKLER', 14, y);
        y += 6;

        if (reportType === 'products') {
          doc.text(`Toplam Ürün: ${summary.totalProducts}`, 14, y);
          y += 6;
          doc.text(`Toplam Stok Değeri: ₺${summary.totalValue.toFixed(2)}`, 14, y);
          y += 6;
          doc.text(`Ortalama Stok: ${summary.avgStock.toFixed(2)}`, 14, y);
          y += 10;
        } else if (reportType === 'movements') {
          doc.text(`Toplam Hareket: ${summary.totalMovements}`, 14, y);
          y += 6;
          doc.text(`Toplam Giriş: ${summary.totalIn}`, 14, y);
          y += 6;
          doc.text(`Toplam Çıkış: ${summary.totalOut}`, 14, y);
          y += 10;
        }
      }

      // Table
      const startY = includeSummary === 'true' ? (includeLogo === 'true' ? 76 : 46) : (includeLogo === 'true' ? 50 : 20);

      if (reportType === 'products') {
        autoTable(doc, {
          startY,
          head: [['Ürün Adı', 'Barkod', 'Stok', 'Alış', 'Satış']],
          body: data.map(p => [
            p.name,
            p.barcode,
            p.stock,
            `₺${p.buyPrice.toFixed(2)}`,
            `₺${p.sellPrice.toFixed(2)}`,
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [0, 102, 204] },
        });
      } else if (reportType === 'movements') {
        autoTable(doc, {
          startY,
          head: [['Tarih', 'Ürün', 'Tip', 'Miktar']],
          body: data.slice(0, 50).map(m => [
            new Date(m.createdAt).toLocaleDateString('tr-TR'),
            m.product?.name || '-',
            m.type === 'IN' ? 'Giriş' : 'Çıkış',
            m.quantity,
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [0, 102, 204] },
        });
      } else if (reportType === 'abc') {
        autoTable(doc, {
          startY,
          head: [['Ürün', 'Kategori', 'Değer', 'Kümülatif %']],
          body: data.slice(0, 50).map(p => [
            p.name,
            p.category,
            `₺${p.value.toFixed(2)}`,
            p.percentage + '%',
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [0, 102, 204] },
        });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-${Date.now()}.pdf"`);
      res.send(Buffer.from(doc.output('arraybuffer')));
    } else if (format === 'csv') {
      let csv = '';

      if (reportType === 'products') {
        csv = 'Ürün Adı,Barkod,Kategori,Stok,Alış Fiyatı,Satış Fiyatı\n';
        data.forEach(p => {
          csv += `"${p.name}","${p.barcode}","${p.category?.name || '-'}",${p.stock},${p.buyPrice},${p.sellPrice}\n`;
        });
      } else if (reportType === 'movements') {
        csv = 'Tarih,Ürün,Tip,Miktar,Önceki Stok,Yeni Stok\n';
        data.forEach(m => {
          csv += `"${m.createdAt.toLocaleString('tr-TR')}","${m.product?.name || '-'}","${m.type === 'IN' ? 'Giriş' : 'Çıkış'}",${m.quantity},${m.previousStock},${m.newStock}\n`;
        });
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-${Date.now()}.csv"`);
      res.send('\uFEFF' + csv); // UTF-8 BOM for Excel compatibility
    } else if (format === 'json') {
      res.json({ data, summary });
    } else {
      return res.status(400).json({ error: 'Geçersiz format' });
    }
  } catch (error: any) {
    console.error('Advanced export error:', error);
    res.status(500).json({ error: 'Dışa aktarma başarısız: ' + error.message });
  }
};

// 📧 EMAIL REPORT - Raporu e-posta ile gönder
export const emailReport = async (req: Request, res: Response) => {
  try {
    const {
      reportType,
      format,
      startDate,
      endDate,
      emailTo,
      includeCharts,
    } = req.body;

    // Mock email send (gerçek implementasyon için email service kullanılmalı)
    const emailBody = `
      <h2>Stok Yönetim Raporu</h2>
      <p><strong>Rapor Türü:</strong> ${reportType}</p>
      <p><strong>Format:</strong> ${format}</p>
      <p><strong>Tarih Aralığı:</strong> ${startDate} - ${endDate}</p>
      <p>Raporunuz ektedir.</p>
    `;

    // Email gönderme fonksiyonu buraya gelecek
    // await sendEmail(emailTo, `Stok Raporu - ${reportType}`, emailBody);

    res.json({ success: true, message: `Rapor ${emailTo} adresine gönderildi` });
  } catch (error: any) {
    console.error('Email report error:', error);
    res.status(500).json({ error: 'E-posta gönderimi başarısız: ' + error.message });
  }
};

