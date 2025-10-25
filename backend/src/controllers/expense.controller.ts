import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllExpenses = async (req: Request, res: Response) => {
  try {
    const { categoryId, startDate, endDate } = req.query;
    const where: any = {};

    if (categoryId) where.categoryId = categoryId as string;
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate as string);
      if (endDate) where.expenseDate.lte = new Date(endDate as string);
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: { category: true, user: { select: { name: true } }, branch: true },
      orderBy: { expenseDate: 'desc' },
    });

    res.json({ expenses });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Giderler getirilemedi' });
  }
};

export const createExpense = async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, amount, description, paymentMethod, expenseDate, receiptNumber } = req.body;

    const expense = await prisma.expense.create({
      data: {
        categoryId,
        amount: parseFloat(amount),
        description,
        paymentMethod,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        receiptNumber,
        userId: req.userId!,
      },
      include: { category: true },
    });

    res.status(201).json({ message: 'Gider kaydedildi', expense });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Gider oluşturulamadı' });
  }
};

export const getAllExpenseCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.expenseCategory.findMany({
      where: { isActive: true },
      include: { _count: { select: { expenses: true } } },
      orderBy: { name: 'asc' },
    });

    res.json({ categories });
  } catch (error) {
    console.error('Get expense categories error:', error);
    res.status(500).json({ error: 'Gider kategorileri getirilemedi' });
  }
};

export const createExpenseCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const category = await prisma.expenseCategory.create({
      data: { name, description },
    });

    res.status(201).json({ message: 'Kategori oluşturuldu', category });
  } catch (error) {
    console.error('Create expense category error:', error);
    res.status(500).json({ error: 'Kategori oluşturulamadı' });
  }
};

