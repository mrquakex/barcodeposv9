import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requireSuperAdmin } from '../middleware/license.middleware';

const router = Router();

// IBAN settings upsert
router.post('/iban-settings', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { bankName, iban, accountHolder, instructions, currency = 'TRY', fastQrUrl } = req.body;
    const settings = await prisma.settings.upsert({
      where: { id: 'global' },
      update: {
        eInvoiceConfig: JSON.stringify({ bankName, iban, accountHolder, instructions, currency, fastQrUrl })
      },
      create: {
        id: 'global',
        storeName: 'BarcodePOS',
        eInvoiceConfig: JSON.stringify({ bankName, iban, accountHolder, instructions, currency, fastQrUrl })
      }
    });
    res.json({ ok: true, settings });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'IBAN ayarları kaydedilemedi' });
  }
});

// Approve/Reject payment receipt
router.post('/payment-receipts/:id/decision', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { decision = 'APPROVED' } = req.body;
    const receipt = await prisma.paymentReceipt.update({
      where: { id },
      data: {
        status: decision,
        approvedAt: decision === 'APPROVED' ? new Date() : null
      }
    });

    if (decision === 'APPROVED') {
      // Activate or extend license for tenant
      const existing = await prisma.license.findFirst({ where: { tenantId: receipt.tenantId, status: 'ACTIVE' } });
      const now = new Date();
      const newExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // default +30 days
      if (existing) {
        await prisma.license.update({ where: { id: existing.id }, data: { expiresAt: newExpiry } });
      } else {
        await prisma.license.create({ data: { tenantId: receipt.tenantId, status: 'ACTIVE', plan: 'STANDARD', expiresAt: newExpiry } });
      }
    }

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Dekont kararı uygulanamadı' });
  }
});

// One-time: set all stocks to zero
router.post('/stock/zero-all', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const before = await tx.product.findMany({ select: { id: true, stock: true } });
      await tx.product.updateMany({ data: { stock: 0 } });
      await tx.activityLog.create({ data: { userId: (req as any).userId || null, action: 'UPDATE', module: 'PRODUCT', description: `ALL_STOCKS_ZEROED: ${before.length} products`, newValue: JSON.stringify({ at: new Date().toISOString() }) } });
      return { updated: before.length };
    });
    res.json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Toplu stok sıfırlama başarısız' });
  }
});

export default router;


