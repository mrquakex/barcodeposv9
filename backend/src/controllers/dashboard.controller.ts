import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Bugünkü satışlar
    const todaySales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);

    // Bu ayki satışlar
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const monthSales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: firstDayOfMonth,
          lt: firstDayOfNextMonth,
        },
      },
    });

    const monthRevenue = monthSales.reduce((sum, sale) => sum + sale.total, 0);

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

    // En çok satan ürünler (bu ay)
    const topProducts = await prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          createdAt: {
            gte: firstDayOfMonth,
            lt: firstDayOfNextMonth,
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
          product,
          totalQuantity: item._sum.quantity,
          totalRevenue: item._sum.total,
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
    const goalProgress = monthlyGoal > 0 ? (monthRevenue / monthlyGoal) * 100 : 0;

    // 🆕 PREVIOUS MONTH DATA (Change percentage calculation)
    const revenueChange = lastMonthRevenue > 0 
      ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;
    const salesChange = lastMonthSales.length > 0 
      ? ((monthSales.length - lastMonthSales.length) / lastMonthSales.length) * 100 
      : 0;

    res.json({
      todayRevenue,
      todaySalesCount: todaySales.length,
      monthRevenue,
      monthSalesCount: monthSales.length,
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
        currentRevenue: monthRevenue,
        monthlyGoal,
        goalProgress: Math.min(goalProgress, 100),
        lastMonthRevenue,
      },
      changePercentages: {
        revenueChange,
        salesChange,
      },
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


