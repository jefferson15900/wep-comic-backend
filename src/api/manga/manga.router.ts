// src/api/manga/manga.router.ts

import { Router } from 'express';
import { getMangas, getMangaById, getChapterPages } from './manga.controller';
import { getUserIfLoggedIn } from '../middleware/user.middleware';
import commentsRouter from '../comments/comments.router';

const router = Router();

// --- Rutas de Lectura de Mangas ---

// Obtener lista de mangas (público para los aprobados)
router.get('/', getMangas);

// Obtener detalles de un manga específico (público para los aprobados)
router.get('/:mangaId', getUserIfLoggedIn, getMangaById);

// Obtener las páginas de un capítulo específico (público para los aprobados)
router.get('/:mangaId/chapters/:chapterId/pages', getUserIfLoggedIn, getChapterPages);

// enviada al 'commentsRouter' para que la maneje
router.use('/:mangaId/comments', commentsRouter);

export default router;