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
    res.status(500).json({
      success: false,
      error: error.message,
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
    res.status(500).json({
      success: false,
      error: error.message,
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
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getProductRecommendations = async (req: Request, res: Response) => {
  try {
    const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
    const recommendations = await aiService.getProductRecommendations(customerId);
    
    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

