import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { generateEAN13 } from '../utils/barcode';

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { search, categoryId, isActive } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { barcode: { contains: search as string } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId as string;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Ürünler getirilemedi' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Ürün getirilemedi' });
  }
};

export const getProductByBarcode = async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params;

    const product = await prisma.product.findUnique({
      where: { barcode },
      include: {
        category: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product by barcode error:', error);
    res.status(500).json({ error: 'Ürün getirilemedi' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { barcode, name, description, price, cost, stock, unit, taxRate, minStock, categoryId, imageUrl } = req.body;

    // Barkod kontrolü
    let finalBarcode = barcode;
    if (!finalBarcode) {
      finalBarcode = generateEAN13();
    }

    // Barkod benzersiz mi kontrol et
    const existingProduct = await prisma.product.findUnique({
      where: { barcode: finalBarcode },
    });

    if (existingProduct) {
      return res.status(400).json({ error: 'Bu barkod zaten kullanılıyor' });
    }

    const product = await prisma.product.create({
      data: {
        barcode: finalBarcode,
        name,
        description,
        price: parseFloat(price),
        cost: cost ? parseFloat(cost) : 0,
        stock: stock ? parseInt(stock) : 0,
        unit: unit || 'Adet',
        taxRate: taxRate ? parseFloat(taxRate) : 18,
        minStock: minStock ? parseInt(minStock) : 5,
        categoryId,
        imageUrl,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json({ message: 'Ürün başarıyla oluşturuldu', product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Ürün oluşturulamadı' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, cost, stock, unit, taxRate, minStock, categoryId, imageUrl, isActive } = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: price ? parseFloat(price) : undefined,
        cost: cost ? parseFloat(cost) : undefined,
        stock: stock !== undefined ? parseInt(stock) : undefined,
        unit,
        taxRate: taxRate ? parseFloat(taxRate) : undefined,
        minStock: minStock ? parseInt(minStock) : undefined,
        categoryId,
        imageUrl,
        isActive,
      },
      include: {
        category: true,
      },
    });

    res.json({ message: 'Ürün başarıyla güncellendi', product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Ürün güncellenemedi' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id },
    });

    res.json({ message: 'Ürün başarıyla silindi' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Ürün silinemedi' });
  }
};

export const getLowStockProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        stock: {
          lte: prisma.product.fields.minStock,
        },
        isActive: true,
      },
      include: {
        category: true,
      },
      orderBy: {
        stock: 'asc',
      },
    });

    res.json({ products });
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({ error: 'Düşük stoklu ürünler getirilemedi' });
  }
};


