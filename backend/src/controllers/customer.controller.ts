import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    const { search, isActive } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: { sales: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ customers });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Müşteriler getirilemedi' });
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Müşteri bulunamadı' });
    }

    res.json({ customer });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Müşteri getirilemedi' });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address } = req.body;

    // Email varsa benzersiz mi kontrol et
    if (email) {
      const existingCustomer = await prisma.customer.findUnique({
        where: { email },
      });

      if (existingCustomer) {
        return res.status(400).json({ error: 'Bu email zaten kullanılıyor' });
      }
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        address,
      },
    });

    res.status(201).json({ message: 'Müşteri başarıyla oluşturuldu', customer });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Müşteri oluşturulamadı' });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, debt, credit, isActive } = req.body;

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        address,
        debt: debt !== undefined ? parseFloat(debt) : undefined,
        credit: credit !== undefined ? parseFloat(credit) : undefined,
        isActive,
      },
    });

    res.json({ message: 'Müşteri başarıyla güncellendi', customer });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Müşteri güncellenemedi' });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.customer.delete({
      where: { id },
    });

    res.json({ message: 'Müşteri başarıyla silindi' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Müşteri silinemedi' });
  }
};


