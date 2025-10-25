/**
 * Performance Monitoring Service
 */
class MonitoringService {
  private metrics: Map<string, number[]> = new Map();
  private errors: Array<{ timestamp: Date; error: string; stack?: string }> = [];
  
  /**
   * Track API response time
   */
  trackResponseTime(endpoint: string, duration: number) {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, []);
    }
    
    const times = this.metrics.get(endpoint)!;
    times.push(duration);
    
    // Keep only last 100 measurements
    if (times.length > 100) {
      times.shift();
    }
  }

  /**
   * Log error
   */
  logError(error: Error, context?: Record<string, any>) {
    this.errors.push({
      timestamp: new Date(),
      error: error.message,
      stack: error.stack,
      ...context,
    } as any);

    // Keep only last 1000 errors
    if (this.errors.length > 1000) {
      this.errors.shift();
    }

    console.error('[ERROR]', error.message, context);
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const report: Record<string, any> = {};

    this.metrics.forEach((times, endpoint) => {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      
      report[endpoint] = {
        avg: Math.round(avg),
        min: Math.round(min),
        max: Math.round(max),
        count: times.length,
      };
    });

    return {
      endpoints: report,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      errors: this.errors.slice(-50), // Last 50 errors
    };
  }

  /**
   * Get system health
   */
  getHealth() {
    const memUsage = process.memoryUsage();
    const memUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    return {
      status: memUsedPercent > 90 ? 'critical' : memUsedPercent > 70 ? 'warning' : 'healthy',
      uptime: process.uptime(),
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        percent: Math.round(memUsedPercent),
      },
      timestamp: new Date(),
    };
  }
}

export const monitoringService = new MonitoringService();

