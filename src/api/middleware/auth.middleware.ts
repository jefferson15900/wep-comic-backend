// src/api/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import prisma from '../../db';
import { User } from '@prisma/client';

// Extendemos la interfaz Request de Express.
export interface AuthRequest extends Request {
  // La propiedad 'user' que añadimos nosotros.
  // Puede ser el objeto de usuario, null si no se encuentra, o undefined.
  user?: Omit<User, 'password'> | null;
  
  // --- CORRECCIÓN ---
  // Añadimos una firma de índice.
  // Esto le dice a TypeScript que este objeto puede tener CUALQUIER otra propiedad
  // con un nombre de tipo string (como 'file' que añade Multer).
  // Esto hace que el tipo sea flexible y evita errores de compilación.
  [key: string]: any;
}

// Middleware "guardián" para proteger rutas.
export const protect = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  // Verificamos si la cabecera 'Authorization' existe y empieza con 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 1. Extraemos el token.
      token = req.headers.authorization.split(' ')[1];

      // 2. Verificamos y decodificamos el token.
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

      // 3. Buscamos al usuario en la base de datos y lo adjuntamos a 'req'.
      req.user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          avatarUrl: true,
          bio: true,
          favoritesArePublic: true,
        },
      });

      if (!req.user) {
        res.status(401);
        throw new Error('No autorizado, el usuario de este token ya no existe');
      }

      // Todo correcto, continuamos a la siguiente función.
      next();

    } catch (error) {
      res.status(401);
      throw new Error('No autorizado, el token es inválido o ha expirado');
    }
  }

  // Si no se encontró ningún token en la cabecera.
  if (!token) {
    res.status(401);
    throw new Error('No autorizado, no se ha proporcionado un token');
  }
});