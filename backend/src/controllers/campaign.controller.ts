import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAllCampaigns = async (req: Request, res: Response) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: { _count: { select: { coupons: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ campaigns });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Kampanyalar getirilemedi' });
  }
};

export const createCampaign = async (req: Request, res: Response) => {
  try {
    const { name, description, type, discountType, discountValue, startDate, endDate, minPurchase } = req.body;
    const campaign = await prisma.campaign.create({
      data: { name, description, type, discountType, discountValue: discountValue ? parseFloat(discountValue) : null, startDate: new Date(startDate), endDate: new Date(endDate), minPurchase: minPurchase ? parseFloat(minPurchase) : null },
    });
    res.status(201).json({ message: 'Kampanya oluşturuldu', campaign });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Kampanya oluşturulamadı' });
  }
};

export const getAllCoupons = async (req: Request, res: Response) => {
  try {
    const coupons = await prisma.coupon.findMany({
      include: { campaign: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ coupons });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ error: 'Kuponlar getirilemedi' });
  }
};

export const createCoupon = async (req: Request, res: Response) => {
  try {
    const { code, campaignId, discountType, discountValue, maxUses, minPurchase, startDate, endDate } = req.body;
    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) return res.status(400).json({ error: 'Bu kod zaten kullanılıyor' });

    const coupon = await prisma.coupon.create({
      data: { code, campaignId, discountType, discountValue: parseFloat(discountValue), maxUses: maxUses ? parseInt(maxUses) : null, minPurchase: minPurchase ? parseFloat(minPurchase) : null, startDate: new Date(startDate), endDate: new Date(endDate) },
    });
    res.status(201).json({ message: 'Kupon oluşturuldu', coupon });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ error: 'Kupon oluşturulamadı' });
  }
};

