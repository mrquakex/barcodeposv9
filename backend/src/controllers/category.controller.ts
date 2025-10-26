import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Kategoriler getirilemedi' });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Kategori bulunamadı' });
    }

    res.json({ category });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Kategori getirilemedi' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    const category = await prisma.category.create({
      data: { name },
    });

    res.status(201).json({ message: 'Kategori başarıyla oluşturuldu', category });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Kategori oluşturulamadı' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: { name },
    });

    res.json({ message: 'Kategori başarıyla güncellendi', category });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Kategori güncellenemedi' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Kategoriye ait ürün var mı kontrol et
    const productsCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      return res.status(400).json({ 
        error: `Bu kategoride ${productsCount} adet ürün var. Önce ürünleri silmeniz gerekiyor.` 
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    res.json({ message: 'Kategori başarıyla silindi' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Kategori silinemedi' });
  }
};


