// src/api/manga/manga.controller.ts

import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../db';
import { AuthRequest } from '../middleware/auth.middleware';
import { Prisma } from '@prisma/client';

// Obtener una lista de mangas (para 'Añadido por la Comunidad')
export const getMangas = asyncHandler(async (req: AuthRequest, res: Response) => {
  
  const { title, page = '1', limit = '20', ids } = req.query;
  const showNsfwParam = req.query.showNsfw as string | undefined;
  
  const whereCondition: Prisma.MangaWhereInput = {
    status: 'APPROVED',
  };

  if (ids && Array.isArray(ids)) {
    whereCondition.id = { 
      in: ids as string[] 
    };
    
    const mangasByIds = await prisma.manga.findMany({ 
      where: whereCondition,
      include: {
        uploader: { select: { username: true } }
      }
    });
    
    // Quitamos el 'return' de aquí...
    res.status(200).json(mangasByIds);
    // ...y añadimos un 'return' vacío para asegurarnos de que la función termina.
    return;
  }
  
  // El resto de la lógica de paginación
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  if (title) {
    whereCondition.title = { 
      contains: title as string,
    };
  }

 if (showNsfwParam === 'false') {
    // Modo Familiar: Muestra SOLO SFW
    whereCondition.contentRating = 'SFW';
  } else if (showNsfwParam === 'true') {
    // Modo Adulto: Muestra SOLO NSFW
    whereCondition.contentRating = 'NSFW';
  }

  const [mangas, total] = await prisma.$transaction([
    prisma.manga.findMany({ 
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      take: limitNum,
      skip: skip,
      include: {
        uploader: {
          select: { username: true }
        }
      }
    }),
    prisma.manga.count({ where: whereCondition })
  ]);
  
  res.status(200).json({
    data: mangas,
    pagination: {
      total: total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    }
  });
});

// Obtener los detalles de un manga específico por su ID
export const getMangaById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mangaId } = req.params;
  const user = req.user; // Obtenemos el usuario (si está logueado) del middleware 'getUserIfLoggedIn'

  // La consulta principal para obtener los datos del manga no cambia.
  // ¡Importante! Asegúrate de que 'uploaderId' se incluya en la consulta.
  const manga = await prisma.manga.findUnique({
    where: { id: mangaId },
    include: {
      chapters: {
        where: { status: { not: 'ARCHIVED' } }, // No mostrar capítulos archivados
        include: {
          pages: {
            orderBy: { pageNumber: 'asc' },
            select: { id: true, pageNumber: true, imageUrl: true }
          }
        },
        orderBy: { chapterNumber: 'desc' }
      },
      uploader: { select: { id: true, username: true } } // Aseguramos que uploaderId (como id) y username estén
    }
  });
  
  // Hemos combinado las dos comprobaciones de 'manga no encontrado'
  if (!manga || manga.status === 'ARCHIVED') {
    res.status(404);
    throw new Error('Manga no encontrado');
  }

  // --- ¡NUEVA LÓGICA! ---
  // Comprobamos si el usuario actual tiene una propuesta pendiente para este manga.
  let userHasPendingProposal = false;
  // Solo hacemos la comprobación si hay un usuario logueado.
  if (user && manga.uploader) { // Solo tiene sentido si el manga es de la comunidad
    const pendingProposal = await prisma.editProposal.findFirst({
      where: {
        mangaId: mangaId,
        proposerId: user.id,
        status: 'PENDING'
      },
      select: { id: true }
    });
    userHasPendingProposal = !!pendingProposal;
  }
  // --- FIN DE LA LÓGICA ---


  const isApproved = manga.status === 'APPROVED';

  // Lógica de permisos para ver capítulos pendientes
  if (isApproved) {
    manga.chapters = manga.chapters.filter(chapter => chapter.status === 'APPROVED');
  } else {
    if (!user) {
      res.status(403);
      throw new Error('Este manga está pendiente de revisión y requiere inicio de sesión.');
    }

    const isOwner = user.id === manga.uploader.id;
    const isAdmin = user.role === 'ADMIN' || user.role === 'MODERATOR';

    if (!isOwner && !isAdmin) {
      res.status(403);
      throw new Error('No tienes permiso para ver este manga pendiente.');
    }
  }

  // Añadimos el nuevo booleano a la respuesta JSON
  res.json({ ...manga, userHasPendingProposal });
});

// Obtener las páginas de un capítulo específico
export const getChapterPages = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { chapterId } = req.params;
    const user = req.user;

    const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        include: { manga: { select: { uploaderId: true, status: true } } },
    });

    if (!chapter) {
        res.status(404);
        throw new Error('Capítulo no encontrado');
    }

    const isMangaApproved = chapter.manga.status === 'APPROVED';
    const isChapterApproved = chapter.status === 'APPROVED';

    if (isMangaApproved && isChapterApproved) {
        const pages = await prisma.page.findMany({
            where: { chapterId },
            orderBy: { pageNumber: 'asc' },
        });
        res.json(pages.map(p => p.imageUrl));
        return;
    }

    if (!user) {
        res.status(403);
        throw new Error('Este contenido está pendiente de revisión y requiere inicio de sesión.');
    }

    const isOwner = user.id === chapter.manga.uploaderId;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
        res.status(403);
        throw new Error('No tienes permiso para ver este contenido pendiente.');
    }

    const pages = await prisma.page.findMany({
        where: { chapterId },
        orderBy: { pageNumber: 'asc' },
    });
    res.json(pages.map(p => p.imageUrl));
});