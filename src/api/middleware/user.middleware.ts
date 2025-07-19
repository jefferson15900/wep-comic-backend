// src/api/middleware/user.middleware.ts
// Este middleware es como 'protect', pero opcional. Si hay token, lo verifica. Si no, simplemente continúa.
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import prisma from '../../db';
import { AuthRequest } from './auth.middleware';

export const getUserIfLoggedIn = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  req.user = null; // Inicializar a null por defecto

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
      
      const user = await prisma.user.findUnique({
         where: { id: decoded.id },
         select: { id: true, email: true, username: true, role: true, createdAt: true, updatedAt: true, avatarUrl: true, bio: true, favoritesArePublic: true, }
      });
      
      if (user) {
        req.user = user;
      }

    } catch (error) {
      console.error('getUserIfLoggedIn: Error verificando token o buscando usuario:', error);
      req.user = null; 
    }
  }

  next();
});