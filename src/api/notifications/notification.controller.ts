// backend/src/api/notifications/notification.controller.ts
import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../db';
import { AuthRequest } from '../middleware/auth.middleware';

// Obtener notificaciones del usuario (no leídas primero)
export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  
  // 1. Calculamos la fecha de hace 30 días a partir de ahora.
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const notifications = await prisma.notification.findMany({
    where: { 
      userId,
      // 2. --- ¡NUEVO FILTRO DE FECHA! ---
      // Solo trae notificaciones cuya fecha de creación (createdAt)
      // sea mayor o igual que (gte) la de hace 30 días.
      createdAt: {
        gte: thirtyDaysAgo 
      }
    },
    orderBy: [
        { isRead: 'asc' },      // Opcional: Muestra las no leídas (false) primero
        { createdAt: 'desc' }   // Luego, ordena por fecha de la más nueva a la más vieja
    ],
    take: 50, // Aumentamos el límite a 50, ya que el total es más pequeño
  });

  res.status(200).json(notifications);
});

// Marcar todas las notificaciones como leídas
export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  res.status(204).send();
});