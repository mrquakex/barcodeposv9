import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import ExcelJS from 'exceljs';

// 📊 SALES REPORT
export const getSalesReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, groupBy = 'day', paymentMethod, userId } = req.query;

    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);

    const where: any = {
      createdAt: {
        gte: start,
        lte: end,
      },
    };

    if (paymentMethod) {
      where.paymentMethod = paymentMethod as string;
    }

    if (userId) {
      where.userId = userId as string;
    }

    // Get all sales in date range
    const sales = await prisma.sale.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate totals
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalTax = sales.reduce((sum, sale) => sum + Number(sale.taxAmount || 0), 0);
    const totalDiscount = sales.reduce((sum, sale) => sum + Number(sale.discountAmount || 0), 0);
    const totalItems = sales.reduce((sum, sale) => sum + sale.items.length, 0);

    // Group by payment method
    const paymentMethodBreakdown = sales.reduce((acc: any, sale) => {
      const method = sale.paymentMethod;
      if (!acc[method]) {
        acc[method] = {
          count: 0,
          total: 0,
        };
      }
      acc[method].count++;
      acc[method].total += Number(sale.total);
      return acc;
    }, {});

    // Group by user (cashier)
    const userBreakdown = sales.reduce((acc: any, sale) => {
      const userName = sale.user.name;
      if (!acc[userName]) {
        acc[userName] = {
          count: 0,
          total: 0,
        };
      }
      acc[userName].count++;
      acc[userName].total += Number(sale.total);
      return acc;
    }, {});

    // Group by time period
    const groupedSales: any = {};
    sales.forEach((sale) => {
      const date = new Date(sale.createdAt);
      let key: string;

      if (groupBy === 'hour') {
        key = date.toISOString().substring(0, 13) + ':00';
      } else if (groupBy === 'day') {
        key = date.toISOString().substring(0, 10);
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().substring(0, 10);
      } else if (groupBy === 'month') {
        key = date.toISOString().substring(0, 7);
      } else {
        key = date.toISOString().substring(0, 10);
      }

      if (!groupedSales[key]) {
        groupedSales[key] = {
          date: key,
          count: 0,
          revenue: 0,
          tax: 0,
          discount: 0,
        };
      }

      groupedSales[key].count++;
      groupedSales[key].revenue += Number(sale.total);
      groupedSales[key].tax += Number(sale.taxAmount || 0);
      groupedSales[key].discount += Number(sale.discountAmount || 0);
    });

    const timeSeriesData = Object.values(groupedSales).sort((a: any, b: any) => 
      a.date.localeCompare(b.date)
    );

    res.json({
      summary: {
        totalSales,
        totalRevenue: totalRevenue.toFixed(2),
        totalTax: totalTax.toFixed(2),
        totalDiscount: totalDiscount.toFixed(2),
        totalItems,
        averageOrderValue: totalSales > 0 ? (totalRevenue / totalSales).toFixed(2) : '0.00',
      },
      paymentMethodBreakdown,
      userBreakdown,
      timeSeriesData,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({ error: 'Satış raporu oluşturulamadı' });
  }
};

// 📦 PRODUCT PERFORMANCE REPORT
export const getProductPerformanceReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, categoryId, limit = 50 } = req.query;

    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);

    // Get sale items in date range
    const saleItemsWhere: any = {
      sale: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    };

    const saleItems = await prisma.saleItem.findMany({
      where: saleItemsWhere,
      include: {
        product: {
          include: {
            category: true,
          },
        },
        sale: true,
      },
    });

    // Filter by category if provided
    const filteredItems = categoryId
      ? saleItems.filter(item => item.product.categoryId === categoryId)
      : saleItems;

    // Group by product
    const productStats: any = {};
    filteredItems.forEach((item) => {
      const productId = item.productId;
      if (!productStats[productId]) {
        productStats[productId] = {
          productId,
          barcode: item.product.barcode,
          name: item.product.name,
          category: item.product.category?.name || 'Uncategorized',
          quantitySold: 0,
          totalRevenue: 0,
          totalProfit: 0,
          salesCount: 0,
          currentStock: item.product.stock,
          avgSalePrice: 0,
          buyPrice: Number(item.product.buyPrice),
          sellPrice: Number(item.product.sellPrice),
        };
      }

      productStats[productId].quantitySold += item.quantity;
      productStats[productId].totalRevenue += Number(item.total);
      productStats[productId].totalProfit += (Number(item.unitPrice) - Number(item.product.buyPrice)) * item.quantity;
      productStats[productId].salesCount++;
    });

    // Convert to array and calculate averages
    const productsArray = Object.values(productStats).map((p: any) => ({
      ...p,
      avgSalePrice: p.salesCount > 0 ? (p.totalRevenue / p.quantitySold).toFixed(2) : '0.00',
      profitMargin: p.totalRevenue > 0 ? ((p.totalProfit / p.totalRevenue) * 100).toFixed(2) : '0.00',
    }));

    // Sort by revenue and limit
    const topProducts = productsArray
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, Number(limit));

    // Get category breakdown
    const categoryBreakdown = productsArray.reduce((acc: any, product: any) => {
      const cat = product.category;
      if (!acc[cat]) {
        acc[cat] = {
          quantitySold: 0,
          revenue: 0,
          profit: 0,
          productsCount: 0,
        };
      }
      acc[cat].quantitySold += product.quantitySold;
      acc[cat].revenue += product.totalRevenue;
      acc[cat].profit += product.totalProfit;
      acc[cat].productsCount++;
      return acc;
    }, {});

    // Summary
    const totalQuantitySold = productsArray.reduce((sum, p: any) => sum + p.quantitySold, 0);
    const totalRevenue = productsArray.reduce((sum, p: any) => sum + p.totalRevenue, 0);
    const totalProfit = productsArray.reduce((sum, p: any) => sum + p.totalProfit, 0);

    res.json({
      summary: {
        totalProducts: productsArray.length,
        totalQuantitySold,
        totalRevenue: totalRevenue.toFixed(2),
        totalProfit: totalProfit.toFixed(2),
        profitMargin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : '0.00',
      },
      topProducts,
      categoryBreakdown,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
  } catch (error) {
    console.error('Product performance report error:', error);
    res.status(500).json({ error: 'Ürün performans raporu oluşturulamadı' });
  }
};

// 👥 CUSTOMER ANALYTICS REPORT
export const getCustomerAnalyticsReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, segment } = req.query;

    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get all customers with their sales
    const customers = await prisma.customer.findMany({
      include: {
        sales: {
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          include: {
            items: true,
          },
        },
      },
    });

    // Calculate RFM scores
    const now = new Date();
    const customerAnalytics = customers.map((customer) => {
      const totalSpent = customer.sales.reduce((sum, sale) => sum + Number(sale.total), 0);
      const frequency = customer.sales.length;
      const lastSale = customer.sales.length > 0
        ? customer.sales.reduce((latest, sale) => 
            sale.createdAt > latest ? sale.createdAt : latest, customer.sales[0].createdAt)
        : null;
      const recency = lastSale ? Math.floor((now.getTime() - lastSale.getTime()) / (1000 * 60 * 60 * 24)) : 999;

      // Simple RFM scoring (1-5 scale)
      const recencyScore = recency <= 7 ? 5 : recency <= 30 ? 4 : recency <= 60 ? 3 : recency <= 90 ? 2 : 1;
      const frequencyScore = frequency >= 10 ? 5 : frequency >= 5 ? 4 : frequency >= 3 ? 3 : frequency >= 1 ? 2 : 1;
      const monetaryScore = totalSpent >= 5000 ? 5 : totalSpent >= 2000 ? 4 : totalSpent >= 1000 ? 3 : totalSpent >= 500 ? 2 : 1;
      const rfmScore = recencyScore + frequencyScore + monetaryScore;

      // Segment based on RFM
      let customerSegment = 'At Risk';
      if (rfmScore >= 13) customerSegment = 'Champions';
      else if (rfmScore >= 10) customerSegment = 'Loyal';
      else if (rfmScore >= 7) customerSegment = 'Potential';
      else if (rfmScore >= 4) customerSegment = 'At Risk';
      else customerSegment = 'Lost';

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        totalSpent,
        frequency,
        recency,
        lastPurchaseDate: lastSale?.toISOString() || null,
        averageOrderValue: frequency > 0 ? (totalSpent / frequency).toFixed(2) : '0.00',
        rfmScore: {
          recency: recencyScore,
          frequency: frequencyScore,
          monetary: monetaryScore,
          total: rfmScore,
        },
        segment: customerSegment,
        loyaltyPoints: customer.loyaltyPoints || 0,
      };
    });

    // Filter by segment if provided
    const filteredCustomers = segment
      ? customerAnalytics.filter(c => c.segment === segment)
      : customerAnalytics;

    // Segment distribution
    const segmentDistribution = customerAnalytics.reduce((acc: any, customer) => {
      const seg = customer.segment;
      if (!acc[seg]) {
        acc[seg] = {
          count: 0,
          totalRevenue: 0,
        };
      }
      acc[seg].count++;
      acc[seg].totalRevenue += customer.totalSpent;
      return acc;
    }, {});

    // Top customers
    const topCustomers = customerAnalytics
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 20);

    res.json({
      summary: {
        totalCustomers: customers.length,
        activeCustomers: customerAnalytics.filter(c => c.recency <= 30).length,
        newCustomers: customerAnalytics.filter(c => c.frequency === 1).length,
        totalRevenue: customerAnalytics.reduce((sum, c) => sum + c.totalSpent, 0).toFixed(2),
        averageLifetimeValue: customers.length > 0
          ? (customerAnalytics.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length).toFixed(2)
          : '0.00',
      },
      segmentDistribution,
      topCustomers,
      customers: filteredCustomers.sort((a, b) => b.totalSpent - a.totalSpent),
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
  } catch (error) {
    console.error('Customer analytics report error:', error);
    res.status(500).json({ error: 'Müşteri analitik raporu oluşturulamadı' });
  }
};

// 💰 FINANCIAL REPORT
export const getFinancialReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);

    // Get sales (revenue)
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalTax = sales.reduce((sum, sale) => sum + Number(sale.taxAmount || 0), 0);
    
    // Calculate COGS (Cost of Goods Sold)
    const cogs = sales.reduce((sum, sale) => {
      const saleCogs = sale.items.reduce((itemSum, item) => {
        return itemSum + (Number(item.product.buyPrice) * item.quantity);
      }, 0);
      return sum + saleCogs;
    }, 0);

    // Get expenses
    const expenses = await prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        category: true,
      },
    });

    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

    // Calculate profit
    const grossProfit = totalRevenue - cogs;
    const netProfit = grossProfit - totalExpenses;
    const grossProfitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(2) : '0.00';
    const netProfitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : '0.00';

    // Expense breakdown by category
    const expenseBreakdown = expenses.reduce((acc: any, expense) => {
      const category = expense.category.name;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Number(expense.amount);
      return acc;
    }, {});

    res.json({
      summary: {
        totalRevenue: totalRevenue.toFixed(2),
        totalTax: totalTax.toFixed(2),
        cogs: cogs.toFixed(2),
        grossProfit: grossProfit.toFixed(2),
        grossProfitMargin: grossProfitMargin + '%',
        totalExpenses: totalExpenses.toFixed(2),
        netProfit: netProfit.toFixed(2),
        netProfitMargin: netProfitMargin + '%',
      },
      expenseBreakdown,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
  } catch (error) {
    console.error('Financial report error:', error);
    res.status(500).json({ error: 'Finansal rapor oluşturulamadı' });
  }
};

// 📦 INVENTORY REPORT
export const getInventoryReport = async (req: Request, res: Response) => {
  try {
    const { stockStatus, categoryId } = req.query;

    const where: any = {
      isActive: true,
    };

    if (categoryId) {
      where.categoryId = categoryId as string;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
    });

    // Categorize by stock status
    const criticalStock = products.filter(p => p.stock === 0);
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock);
    const normalStock = products.filter(p => p.stock > p.minStock);

    // Filter by status if provided
    let filteredProducts = products;
    if (stockStatus === 'critical') {
      filteredProducts = criticalStock;
    } else if (stockStatus === 'low') {
      filteredProducts = lowStock;
    } else if (stockStatus === 'normal') {
      filteredProducts = normalStock;
    }

    // Calculate total stock value
    const totalStockValue = products.reduce((sum, p) => {
      return sum + (Number(p.buyPrice) * p.stock);
    }, 0);

    const totalStockValueRetail = products.reduce((sum, p) => {
      return sum + (Number(p.sellPrice) * p.stock);
    }, 0);

    // Category breakdown
    const categoryBreakdown = products.reduce((acc: any, product) => {
      const category = product.category?.name || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = {
          productCount: 0,
          totalStock: 0,
          stockValue: 0,
          criticalCount: 0,
          lowCount: 0,
        };
      }
      acc[category].productCount++;
      acc[category].totalStock += product.stock;
      acc[category].stockValue += Number(product.buyPrice) * product.stock;
      if (product.stock === 0) acc[category].criticalCount++;
      else if (product.stock <= product.minStock) acc[category].lowCount++;
      return acc;
    }, {});

    res.json({
      summary: {
        totalProducts: products.length,
        criticalStock: criticalStock.length,
        lowStock: lowStock.length,
        normalStock: normalStock.length,
        totalStockValue: totalStockValue.toFixed(2),
        totalStockValueRetail: totalStockValueRetail.toFixed(2),
        potentialProfit: (totalStockValueRetail - totalStockValue).toFixed(2),
      },
      products: filteredProducts.map(p => ({
        id: p.id,
        barcode: p.barcode,
        name: p.name,
        category: p.category?.name || 'Uncategorized',
        stock: p.stock,
        minStock: p.minStock,
        buyPrice: Number(p.buyPrice).toFixed(2),
        sellPrice: Number(p.sellPrice).toFixed(2),
        stockValue: (Number(p.buyPrice) * p.stock).toFixed(2),
        status: p.stock === 0 ? 'critical' : p.stock <= p.minStock ? 'low' : 'normal',
      })),
      categoryBreakdown,
    });
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({ error: 'Envanter raporu oluşturulamadı' });
  }
};

// 📥 EXPORT REPORT
export const exportReport = async (req: Request, res: Response) => {
  try {
    const { reportType, format = 'excel', data } = req.body;

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(reportType || 'Report');

      // Add title
      worksheet.mergeCells('A1:E1');
      worksheet.getCell('A1').value = `${reportType || 'Report'} - ${new Date().toLocaleDateString('tr-TR')}`;
      worksheet.getCell('A1').font = { size: 16, bold: true };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };

      // Add data based on report type
      if (reportType === 'sales' && data) {
        worksheet.addRow([]);
        worksheet.addRow(['Tarih', 'Satış Sayısı', 'Gelir', 'Vergi', 'İndirim']);
        
        if (data.timeSeriesData) {
          data.timeSeriesData.forEach((row: any) => {
            worksheet.addRow([
              row.date,
              row.count,
              `₺${Number(row.revenue).toFixed(2)}`,
              `₺${Number(row.tax).toFixed(2)}`,
              `₺${Number(row.discount).toFixed(2)}`,
            ]);
          });
        }
      } else if (reportType === 'products' && data) {
        worksheet.addRow([]);
        worksheet.addRow(['Ürün Adı', 'Kategori', 'Satılan Miktar', 'Gelir', 'Kar', 'Kar Marjı']);
        
        if (data.topProducts) {
          data.topProducts.forEach((row: any) => {
            worksheet.addRow([
              row.name,
              row.category,
              row.quantitySold,
              `₺${Number(row.totalRevenue).toFixed(2)}`,
              `₺${Number(row.totalProfit).toFixed(2)}`,
              `${row.profitMargin}%`,
            ]);
          });
        }
      }

      // Style header row
      worksheet.getRow(3).font = { bold: true };
      worksheet.getRow(3).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width = 20;
      });

      // Send file
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${reportType || 'report'}-${Date.now()}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.status(400).json({ error: 'Sadece Excel formatı destekleniyor' });
    }
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ error: 'Rapor dışa aktarılamadı' });
  }
};


