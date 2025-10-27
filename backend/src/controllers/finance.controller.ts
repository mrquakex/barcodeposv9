import { Request, Response } from 'express';
import prisma from '../lib/prisma';

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

export const getProfitLoss = async (req: Request, res: Response) => {
  try {
    const sales = await prisma.sale.findMany();
    const expenses = await prisma.expense.findMany();
    
    const revenue = sales.reduce((sum, s) => sum + s.netAmount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const profit = revenue - totalExpenses;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

    res.json({ revenue, expenses: totalExpenses, profit, profitMargin });
  } catch (error) {
    console.error('Profit/Loss error:', error);
    res.status(500).json({ error: 'Kar/Zarar verisi alınamadı' });
  }
};

export const getProfitLossChart = async (req: Request, res: Response) => {
  try {
    const last12Months = [];
    const today = new Date();
    const labels = [];
    const profitData = [];
    const lossData = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);

      const sales = await prisma.sale.findMany({
        where: { createdAt: { gte: date, lt: nextMonth } }
      });
      const expenses = await prisma.expense.findMany({
        where: { expenseDate: { gte: date, lt: nextMonth } }
      });

      const revenue = sales.reduce((sum, s) => sum + s.netAmount, 0);
      const expense = expenses.reduce((sum, e) => sum + e.amount, 0);
      const profit = revenue - expense;

      labels.push(date.toLocaleDateString('tr-TR', { month: 'short' }));
      profitData.push(profit > 0 ? profit : 0);
      lossData.push(profit < 0 ? Math.abs(profit) : 0);
    }

    res.json({ labels, profit: profitData, loss: lossData });
  } catch (error) {
    console.error('Profit/Loss chart error:', error);
    res.status(500).json({ error: 'Grafik verisi alınamadı' });
  }
};


