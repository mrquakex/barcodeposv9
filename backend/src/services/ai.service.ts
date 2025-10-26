import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * AI/ML Service - Satış Tahmini ve Anomali Tespiti
 */
class AIService {
  /**
   * Satış Tahmini - Linear Regression ile
   * Geçmiş verilere dayalı gelecek satış tahmini
   */
  async predictSales(days: number = 7): Promise<{
    predictions: Array<{ date: string; predictedSales: number }>;
    trend: 'increasing' | 'decreasing' | 'stable';
    confidence: number;
  }> {
    try {
      // Son 30 günün satış verilerini al
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const sales = await prisma.sale.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
        select: {
          totalAmount: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (sales.length < 7) {
        throw new Error('Yeterli veri yok (minimum 7 gün gerekli)');
      }

      // Günlük bazda grupla
      const dailySales = this.groupByDay(sales);
      const days_data = Object.entries(dailySales).map(([date, total]) => ({
        date,
        total,
      }));

      // Linear regression ile trend hesapla
      const { slope, intercept } = this.linearRegression(
        days_data.map((_, i) => i),
        days_data.map((d) => d.total)
      );

      // Gelecek tahminleri
      const predictions = [];
      const lastIndex = days_data.length;
      
      for (let i = 0; i < days; i++) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + i + 1);
        const predictedSales = slope * (lastIndex + i) + intercept;

        predictions.push({
          date: futureDate.toISOString().split('T')[0],
          predictedSales: Math.max(0, predictedSales), // Negatif olamaz
        });
      }

      // Trend analizi
      const trend = slope > 100 ? 'increasing' : slope < -100 ? 'decreasing' : 'stable';

      // Güven seviyesi (R² coefficient)
      const confidence = this.calculateRSquared(
        days_data.map((_, i) => i),
        days_data.map((d) => d.total),
        slope,
        intercept
      );

      return {
        predictions,
        trend,
        confidence: Math.min(100, Math.max(0, confidence * 100)),
      };
    } catch (error) {
      console.error('Sales prediction error:', error);
      throw error;
    }
  }

  /**
   * Anomali Tespiti - Z-Score metoduyla
   * Olağandışı satış/stok hareketlerini tespit et
   */
  async detectAnomalies(): Promise<{
    salesAnomalies: Array<{ date: string; amount: number; severity: string }>;
    stockAnomalies: Array<{ productId: number; name: string; issue: string }>;
  }> {
    try {
      // Son 30 günün satış verilerini al
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const sales = await prisma.sale.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
        select: {
          totalAmount: true,
          createdAt: true,
        },
      });

      // Günlük satışları grupla
      const dailySales = this.groupByDay(sales);
      const totals = Object.values(dailySales);

      // İstatistikler
      const mean = totals.reduce((a, b) => a + b, 0) / totals.length;
      const stdDev = Math.sqrt(
        totals.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / totals.length
      );

      // Z-Score ile anomali tespiti (|z| > 2 ise anomali)
      const salesAnomalies = Object.entries(dailySales)
        .map(([date, total]) => {
          const zScore = (total - mean) / stdDev;
          if (Math.abs(zScore) > 2) {
            return {
              date,
              amount: total,
              severity: Math.abs(zScore) > 3 ? 'high' : 'medium',
              zScore,
            };
          }
          return null;
        })
        .filter(Boolean) as any[];

      // Stok anomalileri
      const products = await prisma.product.findMany({
        select: {
          id: true,
          name: true,
          stock: true,
          minStock: true,
        },
      });

      const stockAnomalies = products
        .map((product) => {
          // Düşük stok
          if (product.stock <= (product.minStock || 10)) {
            return {
              productId: product.id,
              name: product.name,
              issue: `Kritik düşük stok: ${product.stock} adet`,
            };
          }
          // Aşırı stok (minStock'un 20 katından fazla)
          if (product.stock > (product.minStock || 10) * 20) {
            return {
              productId: product.id,
              name: product.name,
              issue: `Aşırı stok: ${product.stock} adet`,
            };
          }
          return null;
        })
        .filter(Boolean) as any[];

      return {
        salesAnomalies,
        stockAnomalies,
      };
    } catch (error) {
      console.error('Anomaly detection error:', error);
      throw error;
    }
  }

  /**
   * Akıllı Stok Önerisi
   * Hangi ürünlerden kaç adet sipariş verilmeli?
   */
  async getStockRecommendations(): Promise<
    Array<{
      productId: string;
      name: string;
      currentStock: number;
      recommendedOrder: number;
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }>
  > {
    try {
      // Son 30 günün satış verilerini al
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const sales = await prisma.saleItem.findMany({
        where: {
          sale: {
            createdAt: { gte: thirtyDaysAgo },
          },
        },
        include: {
          product: true,
        },
      });

      // Ürün bazında günlük ortalama satış hesapla
      const productSales: Record<string, { total: number; name: string; stock: number }> = {};

      sales.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            total: 0,
            name: item.product.name,
            stock: item.product.stock,
          };
        }
        productSales[item.productId].total += item.quantity;
      });

      // Öneriler oluştur
      const recommendations = Object.entries(productSales)
        .map(([productId, data]) => {
          const avgDailySales = data.total / 30;
          const daysUntilStockout = data.stock / (avgDailySales || 1);

          // Kritik stok seviyesi (7 günden az)
          if (daysUntilStockout < 7) {
            return {
              productId,
              name: data.name,
              currentStock: data.stock,
              recommendedOrder: Math.ceil(avgDailySales * 30), // 30 günlük stok
              reason: `Mevcut stok ${Math.floor(daysUntilStockout)} gün yetecek`,
              priority: 'high' as const,
            };
          }

          // Orta öncelik (14 günden az)
          if (daysUntilStockout < 14) {
            return {
              productId,
              name: data.name,
              currentStock: data.stock,
              recommendedOrder: Math.ceil(avgDailySales * 20), // 20 günlük stok
              reason: `Stok optimize edilebilir`,
              priority: 'medium' as const,
            };
          }

          return null;
        })
        .filter(Boolean) as any[];

      return recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    } catch (error) {
      console.error('Stock recommendations error:', error);
      throw error;
    }
  }

  /**
   * Ürün Önerisi - Müşteri alışveriş geçmişine göre
   */
  async getProductRecommendations(customerId?: string): Promise<
    Array<{
      productId: string;
      name: string;
      reason: string;
      score: number;
    }>
  > {
    try {
      if (customerId) {
        // Müşteri bazlı öneriler
        const customerSales = await prisma.saleItem.findMany({
          where: {
            sale: {
              customerId,
            },
          },
          include: {
            product: true,
          },
        });

        // Sık alınan ürünler
        const productCounts: Record<string, { name: string; count: number }> = {};
        customerSales.forEach((item) => {
          if (!productCounts[item.productId]) {
            productCounts[item.productId] = {
              name: item.product.name,
              count: 0,
            };
          }
          productCounts[item.productId].count += item.quantity;
        });

        return Object.entries(productCounts)
          .map(([productId, data]) => ({
            productId,
            name: data.name,
            reason: 'Sıklıkla satın aldığınız ürün',
            score: data.count,
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
      } else {
        // Genel popüler ürünler
        const popularProducts = await prisma.saleItem.groupBy({
          by: ['productId'],
          _sum: {
            quantity: true,
          },
          orderBy: {
            _sum: {
              quantity: 'desc',
            },
          },
          take: 5,
        });

        const recommendations = await Promise.all(
          popularProducts.map(async (item) => {
            const product = await prisma.product.findUnique({
              where: { id: item.productId },
            });
            return {
              productId: item.productId,
              name: product?.name || 'Unknown',
              reason: 'En çok satılan ürün',
              score: item._sum.quantity || 0,
            };
          })
        );

        return recommendations;
      }
    } catch (error) {
      console.error('Product recommendations error:', error);
      throw error;
    }
  }

  /**
   * Linear Regression (En Küçük Kareler Yöntemi)
   */
  private linearRegression(x: number[], y: number[]): { slope: number; intercept: number } {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * R² (Coefficient of Determination) - Model güvenirliği
   */
  private calculateRSquared(
    x: number[],
    y: number[],
    slope: number,
    intercept: number
  ): number {
    const yMean = y.reduce((a, b) => a + b, 0) / y.length;
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssResidual = y.reduce(
      (sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2),
      0
    );

    return 1 - ssResidual / ssTotal;
  }

  /**
   * Satışları günlük bazda grupla
   */
  private groupByDay(sales: Array<{ createdAt: Date; totalAmount: number }>): Record<string, number> {
    const grouped: Record<string, number> = {};

    sales.forEach((sale) => {
      const date = sale.createdAt.toISOString().split('T')[0];
      grouped[date] = (grouped[date] || 0) + sale.totalAmount;
    });

    return grouped;
  }
}

export const aiService = new AIService();


