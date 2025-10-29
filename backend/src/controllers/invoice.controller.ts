import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        sale: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ invoices });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Faturalar getirilemedi' });
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        sale: { include: { items: { include: { product: true } } } },
        customer: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Fatura bulunamadı' });
    }

    res.json({ invoice });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Fatura getirilemedi' });
  }
};

export const createInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { saleId, type = 'E_INVOICE' } = req.body;

    if (!saleId) {
      return res.status(400).json({ error: 'Satış ID gereklidir' });
    }

    // Check if sale exists
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!sale) {
      return res.status(404).json({ error: 'Satış bulunamadı' });
    }

    if (!sale.customerId) {
      return res.status(400).json({ error: 'Satışa ait müşteri bilgisi yok' });
    }

    // Check if invoice already exists for this sale
    const existingInvoice = await prisma.invoice.findUnique({
      where: { saleId },
    });

    if (existingInvoice) {
      return res.status(400).json({ error: 'Bu satış için zaten fatura oluşturulmuş' });
    }

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(6, '0')}`;

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        saleId,
        customerId: sale.customerId,
        type,
        status: 'DRAFT',
        subtotal: Number(sale.subtotal) || Number(sale.total) - Number(sale.taxAmount || 0),
        taxAmount: Number(sale.taxAmount) || 0,
        total: Number(sale.total),
      },
      include: {
        sale: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        customer: true,
      },
    });

    res.status(201).json({ invoice, message: 'Fatura başarıyla oluşturuldu' });
  } catch (error: any) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: error.message || 'Fatura oluşturulamadı' });
  }
};

export const updateInvoiceStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, eInvoiceData } = req.body;

    const validStatuses = ['DRAFT', 'SENT', 'APPROVED', 'CANCELLED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Geçersiz durum' });
    }

    const updateData: any = { status };

    if (status === 'SENT') {
      updateData.sentAt = new Date();
    } else if (status === 'APPROVED') {
      updateData.approvedAt = new Date();
    }

    if (eInvoiceData) {
      updateData.eInvoiceData = JSON.stringify(eInvoiceData);
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        sale: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        customer: true,
      },
    });

    res.json({ invoice, message: 'Fatura durumu güncellendi' });
  } catch (error: any) {
    console.error('Update invoice status error:', error);
    res.status(500).json({ error: error.message || 'Fatura durumu güncellenemedi' });
  }
};

export const deleteInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return res.status(404).json({ error: 'Fatura bulunamadı' });
    }

    if (invoice.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Sadece taslak faturalar silinebilir' });
    }

    await prisma.invoice.delete({ where: { id } });

    res.json({ message: 'Fatura silindi' });
  } catch (error: any) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: error.message || 'Fatura silinemedi' });
  }
};

// GİB E-Invoice integration placeholder
export const sendToGIB = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        sale: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        customer: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Fatura bulunamadı' });
    }

    // TODO: GİB Integration
    // This is a placeholder - real GİB integration requires:
    // 1. E-Invoice provider (Logo, Foriba, Uyumsoft, etc.)
    // 2. Company certificate
    // 3. SOAP API integration
    // 4. XML generation (UBL-TR format)
    
    // For now, just mark as sent
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        eInvoiceData: JSON.stringify({
          gibStatus: 'MOCK_SENT',
          sentAt: new Date().toISOString(),
          message: 'GİB entegrasyonu henüz aktif değil (mock data)',
        }),
      },
      include: {
        sale: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        customer: true,
      },
    });

    res.json({ 
      invoice: updatedInvoice, 
      message: 'Fatura GİB\'e gönderildi (Test Modu)',
      warning: 'Gerçek GİB entegrasyonu için bir e-fatura sağlayıcısı gereklidir'
    });
  } catch (error: any) {
    console.error('Send to GİB error:', error);
    res.status(500).json({ error: error.message || 'Fatura GİB\'e gönderilemedi' });
  }
};
