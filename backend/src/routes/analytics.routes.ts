import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { analyticsService } from '../services/analytics.service';

const router = Router();
router.use(authenticateToken);

/**
 * RFM Analysis
 */
router.get('/rfm', async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.rfmAnalysis();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Churn Prediction
 */
router.get('/churn', async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.predictChurn();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Product Affinity
 */
router.get('/product-affinity', async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.productAffinity();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Customer CLV
 */
router.get('/clv/:customerId', async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.customerId);
    const clv = await analyticsService.calculateCLV(customerId);
    res.json({ success: true, data: { clv } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

