import express from 'express';
import { login, refreshToken } from '../controllers/authController';
import { loginLimiter } from '../middleware/rateLimit';

const router = express.Router();

router.post('/login', loginLimiter, login);
router.post('/refresh', refreshToken);

export default router;