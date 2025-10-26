import { Router } from 'express';
import { getAllCampaigns, createCampaign, getAllCoupons, createCoupon } from '../controllers/campaign.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.use(authorize('ADMIN', 'MANAGER'));

router.get('/', getAllCampaigns);
router.post('/', createCampaign);
router.get('/coupons', getAllCoupons);
router.post('/coupons', createCoupon);

export default router;


