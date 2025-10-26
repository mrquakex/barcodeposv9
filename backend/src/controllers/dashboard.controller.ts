import { Request, Response } from 'express';
import prisma from '../utils/prisma';

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


