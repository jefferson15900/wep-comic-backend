// backend/src/api/middleware/validate.middleware.ts

import { Request, Response, NextFunction } from 'express';
// --- CAMBIO 1: Importamos 'ZodObject' en lugar de 'AnyZodObject' ---
import { ZodObject, ZodError } from 'zod';

export const validate = (schema: ZodObject<any>) => // <-- Usamos el tipo corregido aquí
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // Intenta validar el cuerpo de la petición contra el esquema.
      schema.parse(req.body);
      // Si la validación es exitosa, pasa al siguiente middleware.
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Si es un error de validación de Zod...
        
        // --- CAMBIO 2: Usamos 'error.issues' en lugar de 'error.errors' ---
        const errorMessages = error.issues.map(issue => ({
          field: issue.path.join('.'), // El campo que falló (ej. 'password')
          message: issue.message,     // El mensaje de error (ej. "La contraseña es muy corta")
        }));
        
        // Enviamos la respuesta de error y terminamos el ciclo.
        res.status(400).json({ message: 'Datos inválidos', errors: errorMessages });
      } else {
        // Si es otro tipo de error, lo pasamos al manejador de errores global.
        next(error);
      }
    }
  };