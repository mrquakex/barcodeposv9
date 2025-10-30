import { Router, Request, Response } from 'express';
import { sendEmail, sendPasswordResetEmail, sendWelcomeEmail, sendSaleReceiptEmail } from '../services/email.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * Test basic email
 * POST /api/test-email/basic
 */
router.post('/basic', authenticate, async (req: Request, res: Response) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({ message: 'Email adresi gerekli' });
    }

    await sendEmail({
      to,
      subject: '🧪 Test Email - BarcodePOS',
      html: '<h1>Test Email</h1><p>Brevo SMTP çalışıyor! 🎉</p>',
    });

    res.json({ message: 'Test email gönderildi!' });
  } catch (error: any) {
    console.error('Test email error:', error);
    res.status(500).json({ message: error.message || 'Email gönderilemedi' });
  }
});

/**
 * Test password reset email
 * POST /api/test-email/password-reset
 */
router.post('/password-reset', authenticate, async (req: Request, res: Response) => {
  try {
    const { to, userName } = req.body;

    if (!to) {
      return res.status(400).json({ message: 'Email adresi gerekli' });
    }

    const resetToken = 'test-token-123456789';
    
    await sendPasswordResetEmail(to, resetToken, userName || 'Test User');

    res.json({ message: 'Şifre sıfırlama email\'i gönderildi!' });
  } catch (error: any) {
    console.error('Password reset email error:', error);
    res.status(500).json({ message: error.message || 'Email gönderilemedi' });
  }
});

/**
 * Test welcome email
 * POST /api/test-email/welcome
 */
router.post('/welcome', authenticate, async (req: Request, res: Response) => {
  try {
    const { to, userName } = req.body;

    if (!to) {
      return res.status(400).json({ message: 'Email adresi gerekli' });
    }

    await sendWelcomeEmail(to, userName || 'Test User');

    res.json({ message: 'Hoş geldin email\'i gönderildi!' });
  } catch (error: any) {
    console.error('Welcome email error:', error);
    res.status(500).json({ message: error.message || 'Email gönderilemedi' });
  }
});

/**
 * Test sale receipt email
 * POST /api/test-email/sale-receipt
 */
router.post('/sale-receipt', authenticate, async (req: Request, res: Response) => {
  try {
    const { to, customerName } = req.body;

    if (!to) {
      return res.status(400).json({ message: 'Email adresi gerekli' });
    }

    await sendSaleReceiptEmail(
      to,
      customerName || 'Test Müşteri',
      'SAT-TEST-001',
      150.00,
      [
        { name: 'Test Ürün 1', quantity: 2, price: 50 },
        { name: 'Test Ürün 2', quantity: 1, price: 50 },
      ]
    );

    res.json({ message: 'Satış fişi email\'i gönderildi!' });
  } catch (error: any) {
    console.error('Sale receipt email error:', error);
    res.status(500).json({ message: error.message || 'Email gönderilemedi' });
  }
});

export default router;
