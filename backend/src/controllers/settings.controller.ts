import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      // Varsayılan ayarları oluştur
      settings = await prisma.settings.create({
        data: {
          id: 'default',
          storeName: 'Benim Marketim',
          currency: 'TL',
          theme: 'light',
        },
      });
    }

    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Ayarlar getirilemedi' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const {
      storeName,
      storeAddress,
      storePhone,
      storeEmail,
      logoUrl,
      currency,
      theme,
      receiptFooter,
    } = req.body;

    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 'default',
          storeName,
          storeAddress,
          storePhone,
          storeEmail,
          logoUrl,
          currency,
          theme,
          receiptFooter,
        },
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          storeName,
          storeAddress,
          storePhone,
          storeEmail,
          logoUrl,
          currency,
          theme,
          receiptFooter,
        },
      });
    }

    res.json({ message: 'Ayarlar başarıyla güncellendi', settings });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Ayarlar güncellenemedi' });
  }
};


