import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/auth.controller';
import { loginRateLimit } from '../middleware/rateLimit.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', loginRateLimit, login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

export default router;


