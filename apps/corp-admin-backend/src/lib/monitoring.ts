// Monitoring utilities for error tracking and analytics

export interface ErrorLog {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
}

const errorLogs: ErrorLog[] = [];
const performanceMetrics: PerformanceMetric[] = [];

export const logError = (error: Error, context?: Record<string, any>, severity: ErrorLog['severity'] = 'medium') => {
  const errorLog: ErrorLog = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date(),
    severity,
  };
  
  errorLogs.push(errorLog);
  
  // In production, send to Sentry or other error tracking service
  if (process.env.SENTRY_DSN) {
    // Sentry.captureException(error, { extra: context });
  }
  
  // Keep only last 1000 errors in memory
  if (errorLogs.length > 1000) {
    errorLogs.shift();
  }
};

export const logPerformance = (metric: PerformanceMetric) => {
  performanceMetrics.push(metric);
  
  // In production, send to analytics service
  if (process.env.ANALYTICS_ENABLED === 'true') {
    // Send to Plausible, Google Analytics, etc.
  }
  
  // Keep only last 1000 metrics in memory
  if (performanceMetrics.length > 1000) {
    performanceMetrics.shift();
  }
};

export const getErrorLogs = (limit = 100) => {
  return errorLogs.slice(-limit);
};

export const getPerformanceMetrics = (limit = 100) => {
  return performanceMetrics.slice(-limit);
};

export const getWebVitals = () => {
  // In production, collect real Web Vitals from frontend
  return {
    LCP: 1200, // Largest Contentful Paint (ms)
    FID: 50,   // First Input Delay (ms)
    CLS: 0.1,  // Cumulative Layout Shift
    FCP: 800,  // First Contentful Paint (ms)
    TTFB: 200, // Time to First Byte (ms)
  };
};

