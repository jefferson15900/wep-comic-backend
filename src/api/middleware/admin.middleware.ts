// src/api/middleware/admin.middleware.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Usamos el middleware 'protect' ANTES que este, por lo que 'req.user' existirá.
  if (req.user && req.user.role === 'ADMIN') {
    next(); // El usuario es ADMIN, puede continuar.
  } else {
    res.status(403); // Forbidden
    throw new Error('Acceso denegado. Se requiere rol de administrador.');
  }
};