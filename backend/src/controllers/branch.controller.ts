import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAllBranches = async (req: Request, res: Response) => {
  try {
    const branches = await prisma.branch.findMany({
      include: { _count: { select: { stockMovements: true, expenses: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ branches });
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({ error: 'Şubeler getirilemedi' });
  }
};

export const createBranch = async (req: Request, res: Response) => {
  try {
    const { name, address, phone, email } = req.body;
    const branch = await prisma.branch.create({ data: { name, address, phone, email } });
    res.status(201).json({ message: 'Şube oluşturuldu', branch });
  } catch (error) {
    console.error('Create branch error:', error);
    res.status(500).json({ error: 'Şube oluşturulamadı' });
  }
};

export const updateBranch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, isActive } = req.body;
    const branch = await prisma.branch.update({ where: { id }, data: { name, address, phone, email, isActive } });
    res.json({ message: 'Şube güncellendi', branch });
  } catch (error) {
    console.error('Update branch error:', error);
    res.status(500).json({ error: 'Şube güncellenemedi' });
  }
};

