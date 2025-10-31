import { Response } from 'express';
import { CorpAuthRequest } from '../middleware/auth.middleware.js';
import { getErrorLogs, getPerformanceMetrics, getWebVitals } from '../lib/monitoring.js';

export const getMonitoringData = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { limit = '100' } = req.query;
    
    const errorLogs = getErrorLogs(parseInt(limit as string));
    const performanceMetrics = getPerformanceMetrics(parseInt(limit as string));
    const webVitals = getWebVitals();
    
    // Calculate averages
    const avgResponseTime = performanceMetrics.length > 0
      ? performanceMetrics.reduce((sum, m) => sum + m.duration, 0) / performanceMetrics.length
      : 0;
    
    const errorRate = performanceMetrics.length > 0
      ? (performanceMetrics.filter(m => m.statusCode >= 400).length / performanceMetrics.length) * 100
      : 0;
    
    const statusCodeDistribution = performanceMetrics.reduce((acc: any, m) => {
      const status = `${Math.floor(m.statusCode / 100)}xx`;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      errors: errorLogs,
      performance: {
        metrics: performanceMetrics,
        averageResponseTime: avgResponseTime.toFixed(2),
        errorRate: errorRate.toFixed(2),
        statusCodeDistribution,
      },
      webVitals,
    });
  } catch (error) {
    console.error('Get monitoring data error:', error);
    res.status(500).json({ error: 'Failed to fetch monitoring data' });
  }
};

export const getErrorStats = async (req: CorpAuthRequest, res: Response) => {
  try {
    const errorLogs = getErrorLogs(1000);
    
    const errorStats = {
      total: errorLogs.length,
      bySeverity: {
        critical: errorLogs.filter(e => e.severity === 'critical').length,
        high: errorLogs.filter(e => e.severity === 'high').length,
        medium: errorLogs.filter(e => e.severity === 'medium').length,
        low: errorLogs.filter(e => e.severity === 'low').length,
      },
      recent: errorLogs.slice(-10),
    };

    res.json({ stats: errorStats });
  } catch (error) {
    console.error('Get error stats error:', error);
    res.status(500).json({ error: 'Failed to fetch error stats' });
  }
};

