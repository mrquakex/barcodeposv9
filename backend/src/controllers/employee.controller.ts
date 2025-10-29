import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getEmployeePerformance = async (req: Request, res: Response) => {
  try {
    const { period = 'last30days', startDate: customStartDate, endDate: customEndDate } = req.query;

    let startDate: Date, endDate: Date;

    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate as string);
      endDate = new Date(customEndDate as string);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const now = new Date();
      startDate = new Date();
      endDate = new Date();

      switch (period) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'last7days':
          startDate.setDate(now.getDate() - 6);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'last30days':
          startDate.setDate(now.getDate() - 29);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'thismonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        default:
          startDate.setDate(now.getDate() - 29);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
      }
    }

    // Get all users (employees)
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['CASHIER', 'MANAGER'],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branch: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get sales data for each employee
    const performanceData = await Promise.all(
      users.map(async (user) => {
        const sales = await prisma.sale.findMany({
          where: {
            userId: user.id,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            items: true,
          },
        });

        const totalSales = sales.length;
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
        const totalItemsSold = sales.reduce(
          (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
          0
        );
        const averageSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

        // Calculate sales by day for trend
        const salesByDay: { [key: string]: { count: number; revenue: number } } = {};
        sales.forEach((sale) => {
          const date = sale.createdAt.toISOString().split('T')[0];
          if (!salesByDay[date]) {
            salesByDay[date] = { count: 0, revenue: 0 };
          }
          salesByDay[date].count++;
          salesByDay[date].revenue += sale.total;
        });

        return {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          userRole: user.role,
          branchName: user.branch?.name,
          kpis: {
            totalSales,
            totalRevenue,
            totalItemsSold,
            averageSaleValue,
          },
          salesTrend: Object.entries(salesByDay)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, data]) => ({
              date,
              count: data.count,
              revenue: data.revenue,
            })),
        };
      })
    );

    // Sort by total revenue for leaderboard
    const leaderboard = performanceData
      .sort((a, b) => b.kpis.totalRevenue - a.kpis.totalRevenue)
      .map((emp, index) => ({
        rank: index + 1,
        ...emp,
      }));

    res.json({
      startDate,
      endDate,
      period,
      leaderboard,
      summary: {
        totalEmployees: users.length,
        totalSalesAllEmployees: performanceData.reduce((sum, emp) => sum + emp.kpis.totalSales, 0),
        totalRevenueAllEmployees: performanceData.reduce((sum, emp) => sum + emp.kpis.totalRevenue, 0),
      },
    });
  } catch (error) {
    console.error('Get employee performance error:', error);
    res.status(500).json({ error: 'Performans verileri getirilemedi' });
  }
};

