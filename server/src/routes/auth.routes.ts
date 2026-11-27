import { Router } from 'express';
import { login, logout, me, register } from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', verifyToken, logout);
authRouter.get('/me', verifyToken, me);
