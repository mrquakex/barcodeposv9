import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { gdprService } from '../services/gdpr.service';

const router = Router();

// Tüm endpoint'ler authentication gerektirir
router.use(authenticateToken);

/**
 * Kullanıcı verilerini dışa aktar
 */
router.get('/export-my-data', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const data = await gdprService.exportUserData(userId);
    
    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Kullanıcıyı anonimleştir
 */
router.post('/anonymize-me', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const result = await gdprService.anonymizeUser(userId);
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Kullanıcıyı sil
 */
router.delete('/delete-me', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const result = await gdprService.deleteUser(userId);
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Müşteri verilerini dışa aktar (Admin)
 */
router.get('/export-customer/:id', async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.id);
    const data = await gdprService.exportCustomerData(customerId);
    
    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Müşteriyi anonimleştir (Admin)
 */
router.post('/anonymize-customer/:id', async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.id);
    const result = await gdprService.anonymizeCustomer(customerId);
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Rıza kaydet
 */
router.post('/consent', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { consentType, granted } = req.body;
    
    const result = await gdprService.recordConsent(userId, consentType, granted);
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

