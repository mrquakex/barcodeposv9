import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const { dateFilter } = req.query;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 📅 DATE FILTER LOGIC
    let startDate: Date;
    let endDate: Date;
    
    switch (dateFilter) {
      case 'Bugün':
        startDate = today;
        endDate = tomorrow;
        break;
      case 'Bu Hafta':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay()); // Haftanın başı (Pazar)
        endDate = tomorrow;
        break;
      case 'Geçen Ay':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'Bu Ay':
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        break;
    }

    console.log(`📅 [DASHBOARD] Date filter: ${dateFilter || 'Bu Ay'}, Range: ${startDate.toISOString()} - ${endDate.toISOString()}`);

    // Bugünkü satışlar (heatmap için)
    const todaySales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);

    // Filtrelenmiş dönem satışları
    const periodSales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    const periodRevenue = periodSales.reduce((sum, sale) => sum + sale.total, 0);

    // Toplam sayılar
    const totalProducts = await prisma.product.count({ where: { isActive: true } });
    const totalCustomers = await prisma.customer.count({ where: { isActive: true } });
    const lowStockProducts = await prisma.product.count({
      where: {
        isActive: true,
        stock: {
          lte: prisma.product.fields.minStock,
        },
      },
    });

    // En çok satan ürünler (seçili dönem)
    const topProducts = await prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          createdAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      },
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });
        return {
          productId: item.productId,
          name: product?.name || 'Bilinmeyen Ürün',
          quantity: item._sum.quantity || 0,
          totalRevenue: item._sum.total || 0,
        };
      })
    );

    // Son 7 günlük satış grafiği
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const sales = await prisma.sale.findMany({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      const revenue = sales.reduce((sum, sale) => sum + sale.total, 0);

      last7Days.push({
        date: date.toISOString().split('T')[0],
        revenue,
        salesCount: sales.length,
      });
    }

    // 🆕 SALES HEATMAP (Saatlik satış analizi - bugün)
    const salesHeatmap = Array(24).fill(0);
    todaySales.forEach(sale => {
      const hour = new Date(sale.createdAt).getHours();
      salesHeatmap[hour] += sale.total;
    });

    // 🆕 REVENUE TREND (Son 6 ay karşılaştırması)
    const revenueTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
      
      const monthSalesData = await prisma.sale.findMany({
        where: {
          createdAt: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
      });

      const monthName = monthStart.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
      const revenue = monthSalesData.reduce((sum, sale) => sum + sale.total, 0);

      revenueTrend.push({
        month: monthName,
        revenue,
        salesCount: monthSalesData.length,
      });
    }

    // 🆕 CUSTOMER ANALYTICS
    // Yeni müşteriler (son 30 gün)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newCustomers = await prisma.customer.count({
      where: {
        isActive: true,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Borçlu müşteriler
    const debtorCustomers = await prisma.customer.count({
      where: {
        isActive: true,
        debt: {
          gt: 0,
        },
      },
    });

    // VIP müşteriler (en çok alışveriş yapan top 10)
    const customerPurchases = await prisma.sale.groupBy({
      by: ['customerId'],
      where: {
        customerId: { not: null },
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
      take: 10,
    });

    const vipCustomers = customerPurchases.length;

    // 🆕 GOAL TRACKING (Bu ay hedef: geçen ay gelirinin %20 fazlası)
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const lastMonthSales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lt: lastMonthEnd,
        },
      },
    });

    const lastMonthRevenue = lastMonthSales.reduce((sum, sale) => sum + sale.total, 0);
    const monthlyGoal = lastMonthRevenue * 1.2; // %20 artış hedefi
    const goalProgress = monthlyGoal > 0 ? (periodRevenue / monthlyGoal) * 100 : 0;

    // 🆕 PREVIOUS MONTH DATA (Change percentage calculation)
    const revenueChange = lastMonthRevenue > 0 
      ? ((periodRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;
    const salesChange = lastMonthSales.length > 0 
      ? ((periodSales.length - lastMonthSales.length) / lastMonthSales.length) * 100 
      : 0;

    res.json({
      todayRevenue,
      todaySalesCount: todaySales.length,
      monthRevenue: periodRevenue,
      monthSalesCount: periodSales.length,
      totalProducts,
      totalCustomers,
      lowStockProducts,
      topProducts: topProductsWithDetails,
      last7DaysChart: last7Days,
      // 🆕 NEW ANALYTICS
      salesHeatmap,
      revenueTrend,
      customerAnalytics: {
        newCustomers,
        vipCustomers,
        debtorCustomers,
        totalCustomers,
      },
      goalTracking: {
        currentRevenue: periodRevenue,
        monthlyGoal,
        goalProgress: Math.min(goalProgress, 100),
        lastMonthRevenue,
      },
      changePercentages: {
        revenueChange,
        salesChange,
      },
      dateFilter: dateFilter || 'Bu Ay', // 📅 Return selected filter
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Dashboard istatistikleri alınamadı' });
  }
};

export const getRecentSales = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    const sales = await prisma.sale.findMany({
      take: parseInt(limit as string),
      include: {
        user: {
          select: {
            name: true,
          },
        },
        customer: {
          select: {
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ sales });
  } catch (error) {
    console.error('Get recent sales error:', error);
    res.status(500).json({ error: 'Son satışlar getirilemedi' });
  }
};


