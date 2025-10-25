import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getFinancialSummary = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const where: any = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const sales = await prisma.sale.findMany({ where });
    const expenses = await prisma.expense.findMany({ where: startDate || endDate ? { expenseDate: where.createdAt } : {} });
    
    const totalRevenue = sales.reduce((sum, s) => sum + s.netAmount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    res.json({ totalRevenue, totalExpenses, netProfit, salesCount: sales.length, expensesCount: expenses.length });
  } catch (error) {
    console.error('Financial summary error:', error);
    res.status(500).json({ error: 'Finansal özet alınamadı' });
  }
};

export const getCashFlow = async (req: Request, res: Response) => {
  try {
    const last30Days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const sales = await prisma.sale.findMany({ where: { createdAt: { gte: date, lt: nextDate } } });
      const expenses = await prisma.expense.findMany({ where: { expenseDate: { gte: date, lt: nextDate } } });

      last30Days.push({
        date: date.toISOString().split('T')[0],
        income: sales.reduce((sum, s) => sum + s.netAmount, 0),
        expense: expenses.reduce((sum, e) => sum + e.amount, 0),
      });
    }

    res.json({ cashFlow: last30Days });
  } catch (error) {
    console.error('Cash flow error:', error);
    res.status(500).json({ error: 'Nakit akışı alınamadı' });
  }
};

