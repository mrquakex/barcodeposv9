import { Router } from 'express';
import { login, getMe, logout } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, getMe);
router.post('/logout', logout);

export default router;

