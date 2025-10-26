import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
}

const BADGES: Badge[] = [
  { id: 'rookie', name: 'Rookie', description: '10 satış yap', icon: '🌟', requirement: 10 },
  { id: 'pro', name: 'Professional', description: '50 satış yap', icon: '💎', requirement: 50 },
  { id: 'expert', name: 'Expert', description: '100 satış yap', icon: '👑', requirement: 100 },
  { id: 'master', name: 'Master', description: '500 satış yap', icon: '🏆', requirement: 500 },
  { id: 'legend', name: 'Legend', description: '1000 satış yap', icon: '⭐', requirement: 1000 },
];

/**
 * Gamification Service
 */
class GamificationService {
  /**
   * Kullanıcının puanını hesapla
   */
  async calculateUserScore(userId: number): Promise<number> {
    const sales = await prisma.sale.findMany({
      where: { userId },
    });

    // Her satış 10 puan, toplam satış tutarının %1'i bonus
    const basePoints = sales.length * 10;
    const bonusPoints = sales.reduce((sum, sale) => sum + sale.total * 0.01, 0);

    return Math.round(basePoints + bonusPoints);
  }

  /**
   * Kullanıcının rozetlerini kontrol et
   */
  async getUserBadges(userId: number) {
    const salesCount = await prisma.sale.count({
      where: { userId },
    });

    const earnedBadges = BADGES.filter(badge => salesCount >= badge.requirement);
    const nextBadge = BADGES.find(badge => salesCount < badge.requirement);

    return {
      earned: earnedBadges,
      next: nextBadge,
      progress: nextBadge 
        ? {
            current: salesCount,
            required: nextBadge.requirement,
            percent: Math.round((salesCount / nextBadge.requirement) * 100),
          }
        : null,
    };
  }

  /**
   * Liderlik tablosu
   */
  async getLeaderboard(period: 'day' | 'week' | 'month' | 'all' = 'month') {
    const now = new Date();
    let startDate: Date | undefined;

    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setDate(1));
        break;
    }

    const sales = await prisma.sale.findMany({
      where: startDate ? { createdAt: { gte: startDate } } : undefined,
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    // Kullanıcı bazında grupla
    const userStats: Record<number, { name: string; sales: number; revenue: number; score: number }> = {};

    sales.forEach(sale => {
      const userId = sale.userId;
      if (!userStats[userId]) {
        userStats[userId] = {
          name: sale.user.name,
          sales: 0,
          revenue: 0,
          score: 0,
        };
      }
      userStats[userId].sales += 1;
      userStats[userId].revenue += sale.total;
      userStats[userId].score += 10 + sale.total * 0.01;
    });

    // Sırala
    const leaderboard = Object.entries(userStats)
      .map(([userId, stats]) => ({
        userId: parseInt(userId),
        ...stats,
        score: Math.round(stats.score),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Top 10

    return leaderboard;
  }

  /**
   * Günlük görevler
   */
  async getDailyQuests(userId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = await prisma.sale.count({
      where: {
        userId,
        createdAt: { gte: today },
      },
    });

    const quests = [
      {
        id: 'daily_5_sales',
        name: '5 Satış Yap',
        description: 'Bugün 5 satış tamamla',
        progress: todaySales,
        target: 5,
        reward: 50,
        completed: todaySales >= 5,
      },
      {
        id: 'daily_10_sales',
        name: '10 Satış Yap',
        description: 'Bugün 10 satış tamamla',
        progress: todaySales,
        target: 10,
        reward: 100,
        completed: todaySales >= 10,
      },
    ];

    return quests;
  }
}

export const gamificationService = new GamificationService();


