import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { gamificationService } from '../services/gamification.service';

const router = Router();
router.use(authenticateToken);

/**
 * Get user score
 */
router.get('/score', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const score = await gamificationService.calculateUserScore(userId);
    res.json({ success: true, data: { score } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get user badges
 */
router.get('/badges', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const badges = await gamificationService.getUserBadges(userId);
    res.json({ success: true, data: badges });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get leaderboard
 */
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as any) || 'month';
    const leaderboard = await gamificationService.getLeaderboard(period);
    res.json({ success: true, data: leaderboard });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get daily quests
 */
router.get('/quests', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const quests = await gamificationService.getDailyQuests(userId);
    res.json({ success: true, data: quests });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;


