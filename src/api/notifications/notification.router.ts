// backend/src/api/notifications/notification.router.ts
import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getNotifications, markAsRead } from './notification.controller';

const router = Router();

router.use(protect); // Todas las rutas aquí requieren inicio de sesión

router.get('/', getNotifications);
router.post('/read', markAsRead);

export default router;