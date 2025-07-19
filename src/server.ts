// src/server.ts

import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

// --- Importaciones de Routers ---
import authRouter from './api/auth/auth.router';
import userRouter from './api/user/user.router';
import favoritesRouter from './api/favorites/favorites.router';
import mangaRouter from './api/manga/manga.router';
import communityRouter from './api/community/community.router';
import adminRouter from './api/admin/admin.router'; 
import notificationRouter from './api/notifications/notification.router';

const app = express();
const PORT = process.env.PORT || 4000;

// --- Middlewares Esenciales ---

// --- ¡NUEVA CONFIGURACIÓN DE CORS PARA PRODUCCIÓN! ---
// Define los orígenes (URLs) que tienen permiso para acceder a tu API
const allowedOrigins = [
  'http://localhost:5173', // Permite el desarrollo local del frontend
  // Cuando despliegues tu frontend, añade su URL aquí. Ejemplo:
  // 'https://tu-wepcomic.vercel.app', 
  // 'https://www.tu-dominio.com'
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Si la petición no tiene origen (como Postman) o si el origen está en nuestra lista blanca, la permitimos.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Si el origen no está permitido, la rechazamos.
      callback(new Error('No permitido por la política de CORS'));
    }
  },
};

app.use(cors(corsOptions)); // Usa las nuevas opciones de CORS

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- Rutas ---
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'UP', message: 'El servidor de WepComic está funcionando!' });
});

// Monta los routers en sus rutas base
app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/favorites', favoritesRouter);
app.use('/mangas', mangaRouter);
app.use('/community', communityRouter); 
app.use('/admin', adminRouter); 
app.use('/notifications', notificationRouter);

// --- Middlewares de Manejo de Errores ---
app.use((req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
});

app.listen(PORT, () => {
  console.log(`🎉 Servidor corriendo en http://localhost:${PORT}`);
});