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
import mangadexRouter from './api/mangadex/mangadex.router';

const app = express();
const PORT = process.env.PORT || 4000;

// --- Middlewares Esenciales ---

// --- ¡NUEVA CONFIGURACIÓN DE CORS PARA PRODUCCIÓN! ---
// Define los orígenes (URLs) que tienen permiso para acceder a tu API
const allowedOrigins: (string | RegExp)[] = [
  'http://localhost:5173',
   'https://mangawebhaven.vercel.app',
  new RegExp('^https://wepcomic-.*-jeffersons-projects-a3b9005f\\.vercel\\.app$')
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => typeof o === 'string' ? o === origin : o.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por la política de CORS'));
    }
  },
};

app.use(cors(corsOptions));
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
app.use('/mangadex', mangadexRouter);

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