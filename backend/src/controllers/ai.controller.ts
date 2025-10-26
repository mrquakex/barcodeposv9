import { Request, Response } from 'express';
import { aiService } from '../services/ai.service';

export const getSalesPredictions = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const predictions = await aiService.predictSales(days);
    
    res.json({
      success: true,
      data: predictions,
    });
  } catch (error: any) {
    // Yeterli veri yoksa 500 değil, 200 döndür (boş sonuç)
    console.warn('Sales predictions warning:', error.message);
    res.json({
      success: true,
      data: [],
      message: error.message || 'Henüz yeterli satış verisi yok. Lütfen satış yapın.',
    });
  }
};

export const detectAnomalies = async (req: Request, res: Response) => {
  try {
    const anomalies = await aiService.detectAnomalies();
    
    res.json({
      success: true,
      data: anomalies,
    });
  } catch (error: any) {
    console.warn('Anomaly detection warning:', error.message);
    res.json({
      success: true,
      data: [],
      message: error.message || 'Henüz yeterli satış verisi yok.',
    });
  }
};

export const getStockRecommendations = async (req: Request, res: Response) => {
  try {
    const recommendations = await aiService.getStockRecommendations();
    
    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error: any) {
    console.warn('Stock recommendations warning:', error.message);
    res.json({
      success: true,
      data: [],
      message: error.message || 'Henüz yeterli veri yok.',
    });
  }
};

export const getProductRecommendations = async (req: Request, res: Response) => {
  try {
    const customerId = req.query.customerId as string | undefined;
    const recommendations = await aiService.getProductRecommendations(customerId);
    
    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error: any) {
    console.warn('Product recommendations warning:', error.message);
    res.json({
      success: true,
      data: [],
      message: error.message || 'Henüz yeterli veri yok.',
    });
  }
};


