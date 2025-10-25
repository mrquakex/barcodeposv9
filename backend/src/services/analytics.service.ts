import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Advanced Analytics Service
 */
class AnalyticsService {
  /**
   * Customer Lifetime Value (CLV)
   */
  async calculateCLV(customerId: number): Promise<number> {
    const sales = await prisma.sale.findMany({
      where: { customerId },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    if (sales.length === 0) return 0;

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    
    // Basit CLV = Ortalama satış değeri * Satış sayısı
    // Gerçek CLV formülü daha karmaşık (retention rate, discount rate vb.)
    return totalRevenue;
  }

  /**
   * RFM Analysis (Recency, Frequency, Monetary)
   */
  async rfmAnalysis() {
    const customers = await prisma.customer.findMany({
      include: {
        sales: {
          select: { total: true, createdAt: true },
        },
      },
    });

    const now = new Date();
    
    const rfmData = customers.map(customer => {
      if (customer.sales.length === 0) {
        return {
          customerId: customer.id,
          name: customer.name,
          recency: 999,
          frequency: 0,
          monetary: 0,
          score: 0,
          segment: 'Lost',
        };
      }

      // Recency: Son alışverişten bu yana geçen gün
      const lastSale = customer.sales.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      )[0];
      const recency = Math.floor(
        (now.getTime() - lastSale.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Frequency: Alışveriş sayısı
      const frequency = customer.sales.length;

      // Monetary: Toplam harcama
      const monetary = customer.sales.reduce((sum, sale) => sum + sale.total, 0);

      // Basit skorlama (1-5)
      const rScore = recency < 30 ? 5 : recency < 60 ? 4 : recency < 90 ? 3 : recency < 180 ? 2 : 1;
      const fScore = frequency >= 20 ? 5 : frequency >= 10 ? 4 : frequency >= 5 ? 3 : frequency >= 2 ? 2 : 1;
      const mScore = monetary >= 10000 ? 5 : monetary >= 5000 ? 4 : monetary >= 2000 ? 3 : monetary >= 500 ? 2 : 1;

      const totalScore = rScore + fScore + mScore;

      // Segment belirleme
      let segment = 'Lost';
      if (totalScore >= 13) segment = 'Champions';
      else if (totalScore >= 11) segment = 'Loyal';
      else if (totalScore >= 9) segment = 'Potential';
      else if (totalScore >= 7) segment = 'At Risk';
      else if (totalScore >= 5) segment = 'Hibernating';

      return {
        customerId: customer.id,
        name: customer.name,
        recency,
        frequency,
        monetary,
        rScore,
        fScore,
        mScore,
        totalScore,
        segment,
      };
    });

    return rfmData.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Churn Prediction (Basit)
   */
  async predictChurn() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const customers = await prisma.customer.findMany({
      include: {
        sales: {
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const churnRisk = customers
      .map(customer => {
        if (customer.sales.length === 0) {
          return {
            customerId: customer.id,
            name: customer.name,
            risk: 'high',
            reason: 'No purchases',
          };
        }

        const lastSale = customer.sales[0];
        
        // Son alışveriş 60 gün önce
        if (lastSale.createdAt < sixtyDaysAgo) {
          return {
            customerId: customer.id,
            name: customer.name,
            risk: 'high',
            reason: 'Inactive for 60+ days',
          };
        }
        
        // Son alışveriş 30-60 gün arası
        if (lastSale.createdAt < thirtyDaysAgo) {
          return {
            customerId: customer.id,
            name: customer.name,
            risk: 'medium',
            reason: 'Inactive for 30-60 days',
          };
        }

        return null;
      })
      .filter(Boolean);

    return churnRisk;
  }

  /**
   * Product Affinity (Hangi ürünler birlikte satılıyor?)
   */
  async productAffinity() {
    const sales = await prisma.sale.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Her satıştaki ürün çiftlerini say
    const pairs: Record<string, number> = {};

    sales.forEach(sale => {
      const products = sale.items.map(item => item.product);
      
      // Her ürün çiftini bul
      for (let i = 0; i < products.length; i++) {
        for (let j = i + 1; j < products.length; j++) {
          const key = [products[i].id, products[j].id].sort().join('-');
          pairs[key] = (pairs[key] || 0) + 1;
        }
      }
    });

    // En çok birlikte satılan ürünler
    const topPairs = Object.entries(pairs)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(async ([key, count]) => {
        const [id1, id2] = key.split('-').map(Number);
        const [p1, p2] = await Promise.all([
          prisma.product.findUnique({ where: { id: id1 } }),
          prisma.product.findUnique({ where: { id: id2 } }),
        ]);
        
        return {
          product1: p1?.name,
          product2: p2?.name,
          count,
        };
      });

    return Promise.all(topPairs);
  }
}

export const analyticsService = new AnalyticsService();

