// src/api/admin/admin.controller.ts

import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../db';
import { AuthRequest } from '../middleware/auth.middleware';
import { Prisma, ContentStatus } from '@prisma/client';
// --- Controlador para obtener Nuevas Obras Pendientes ---
// Estos son mangas que nunca han sido aprobados antes.
export const getNewSubmissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  // 1. Leemos los parámetros 'page' y 'limit' de la URL. Si no vienen, usamos valores por defecto.
  const page = parseInt(req.query.page as string) || 1;
  const limit = 7; // Límite fijo de 7, como pediste.
  
  // 2. Calculamos el 'skip' para la consulta de Prisma.
  const skip = (page - 1) * limit;


  const [submissions, total] = await prisma.$transaction([
    prisma.manga.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        title: true,
        coverUrl: true,
        status: true,
        uploader: { select: { username: true } },
        createdAt: true
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: skip,  
    }),
    prisma.manga.count({ where: { status: 'PENDING' } }) 
  ]);

  // 4. Devolvemos la respuesta en un formato estructurado que incluye los datos y la información de paginación.
  res.status(200).json({
    data: submissions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  });
});

// --- Controlador para obtener Ediciones Pendientes ---
// Estos son mangas que ya fueron aprobados pero se editaron y ahora requieren re-aprobación.
export const getPendingEdits = asyncHandler(async (req: AuthRequest, res: Response) => {
  // 1. Leemos los parámetros de paginación
  const page = parseInt(req.query.page as string) || 1;
  const limit = 7; // Límite fijo de 7
  const skip = (page - 1) * limit;

  // 2. Definimos la condición de búsqueda usando el enum para seguridad de tipos
  const whereCondition: Prisma.MangaWhereInput = {
    status: ContentStatus.APPROVED,
    chapters: {
      some: {
        status: ContentStatus.PENDING
      }
    }
  };

  // 3. Ejecutamos la consulta paginada y el conteo total en una transacción
  const [edits, total] = await prisma.$transaction([
    prisma.manga.findMany({
      where: whereCondition,
      select: {
        id: true,
        title: true,
        coverUrl: true,
        status: true,
        lastEditedBy: { select: { username: true } },
        uploader: { select: { username: true } }, // Incluido por si lastEditedBy es null
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'asc'
      },
      take: limit,
      skip: skip,
    }),
    prisma.manga.count({ where: whereCondition })
  ]);

  // 4. Devolvemos la respuesta en el formato de paginación
  res.status(200).json({
    data: edits,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  });
});

// --- Controlador para obtener todos los detalles de un Manga para Revisión ---
export const getMangaForReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mangaId } = req.params;

  const manga = await prisma.manga.findUnique({
    where: { id: mangaId },
    include: { // Incluimos toda la información relevante
      uploader: { select: { username: true } },
      lastEditedBy: { select: { username: true } },
      chapters: {
        include: {
          pages: {
            orderBy: { pageNumber: 'asc' },
          },
        },
        orderBy: { chapterNumber: 'asc' }
      }
    }
  });

  if (!manga) {
    res.status(404);
    throw new Error('Manga no encontrado para revisión.');
  }

  res.status(200).json(manga);
});


// --- Controlador para APROBAR un manga y TODOS sus capítulos pendientes ---
export const approveManga = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mangaId } = req.params;

  // Opcional: Chequeo rápido para ver si hay algo que aprobar.
  const mangaNeedsReview = await prisma.manga.findFirst({
    where: {
      id: mangaId,
      OR: [
        { status: 'PENDING' },
        { chapters: { some: { status: 'PENDING' } } }
      ]
    },
    select: { id: true }
  });

  if (!mangaNeedsReview) {
    // Si no hay nada pendiente, liberamos el bloqueo por si acaso y salimos.
    await prisma.manga.update({
        where: { id: mangaId },
        data: { lockedById: null, lockedAt: null }
    });
    res.status(400);
    throw new Error('No hay nada que aprobar para este manga.');
  }

  // Usamos una transacción para todas las operaciones
  await prisma.$transaction(async (tx) => {
    
    // 1. Obtenemos todos los capítulos PENDIENTES, incluyendo su idioma y el ID del contribuyente.
    const pendingChapters = await tx.chapter.findMany({
      where: {
        mangaId: mangaId,
        status: 'PENDING',
      },
      select: { id: true, chapterNumber: true, language: true, lastEditedById: true }
    });
    
    // 2. Si hay capítulos pendientes, rechazamos las versiones antiguas que coincidan en número e idioma.
    if (pendingChapters.length > 0) {
      const chaptersToRejectConditions = pendingChapters.map(pc => ({
        chapterNumber: pc.chapterNumber,
        language: pc.language,
      }));

      await tx.chapter.updateMany({
        where: {
          mangaId: mangaId,
          OR: chaptersToRejectConditions,
          id: { notIn: pendingChapters.map(c => c.id) },
          status: { in: ['APPROVED', 'PENDING'] }
        },
        data: { status: 'REJECTED' }
      });
    }

    // 3. Aprobamos el manga principal, obtenemos su título y liberamos el bloqueo.
    const approvedManga = await tx.manga.update({
      where: { id: mangaId },
      data: { 
        status: 'APPROVED',
        lockedById: null,
        lockedAt: null,
      },
      select: { title: true }
    });

    // 4. Aprobamos todos los capítulos que estaban pendientes.
    const pendingChapterIds = pendingChapters.map(c => c.id);
    if (pendingChapterIds.length > 0) {
      await tx.chapter.updateMany({
        where: { id: { in: pendingChapterIds } },
        data: { status: 'APPROVED' },
      });
    }

    // --- LÓGICA DE NOTIFICACIONES ---

    // 5. Notificar a los seguidores si se aprobaron capítulos.
    if (pendingChapters.length > 0) {
      const favorites = await tx.favorite.findMany({
        where: { comicId: mangaId },
        select: { userId: true }
      });

      if (favorites.length > 0) {
        const userIdsToNotify = favorites.map(fav => fav.userId);
        await tx.notification.createMany({
          data: userIdsToNotify.map(userId => ({
            userId: userId,
            type: 'NEW_CHAPTER',
            message: `¡Nuevos capítulos de "${approvedManga.title}" han sido aprobados!`,
            link: `/comic/${mangaId}`
          }))
        });
      }
    }
    
    // 6. Notificar a los contribuidores de los capítulos aprobados.
    const chaptersWithContributors = pendingChapters.filter(c => c.lastEditedById);
    if (chaptersWithContributors.length > 0) {
      await tx.notification.createMany({
        data: chaptersWithContributors.map(chapter => ({
          userId: chapter.lastEditedById!,
          type: 'PROPOSAL_APPROVED',
          message: `¡Tu contribución ha sido aprobada! El Capítulo ${chapter.chapterNumber} de "${approvedManga.title}" ahora es público.`,
          link: `/comic/${mangaId}/chapter/${chapter.id}`
        }))
      });
    }
  });

  res.status(200).json({ message: `Manga con ID ${mangaId} y sus capítulos pendientes han sido aprobados y se han enviado las notificaciones.` });
});

// --- Controlador para APROBAR un capítulo específico ---
export const approveChapter = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { chapterId } = req.params;

  const chapterToApprove = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { 
      mangaId: true, 
      chapterNumber: true,
      language: true, 
      lastEditedById: true,
      manga: { select: { title: true } }
    }
  });

  if (!chapterToApprove) {
    res.status(404);
    throw new Error('Capítulo a aprobar no encontrado.');
  }

  await prisma.$transaction(async (tx) => {
    // --- Operación A y B (sin cambios) ---
    await tx.chapter.updateMany({
      where: {
        mangaId: chapterToApprove.mangaId,
        chapterNumber: chapterToApprove.chapterNumber,
        language: chapterToApprove.language, 
        id: { not: chapterId },
        status: { in: ['APPROVED', 'PENDING'] }
      },
      data: { status: 'REJECTED' }
    });

    await tx.chapter.update({
      where: { id: chapterId },
      data: { status: 'APPROVED' },
    });
    
    // --- LÓGICA DE NOTIFICACIONES CORREGIDA ---

    // 3. Notificar a los seguidores (si los hay)
    const favorites = await tx.favorite.findMany({
      where: { comicId: chapterToApprove.mangaId },
      select: { userId: true }
    });
    
    // --- CAMBIO CLAVE: Envolvemos la lógica en un 'if' en lugar de hacer 'return' ---
    if (favorites.length > 0) {
      const userIdsToNotify = favorites.map(fav => fav.userId);
      await tx.notification.createMany({
        data: userIdsToNotify.map(userId => ({
          userId: userId,
          type: 'NEW_CHAPTER',
          message: `¡Nuevo capítulo! Ya está disponible el Cap. ${chapterToApprove.chapterNumber} de "${chapterToApprove.manga.title}".`,
          link: `/comic/${chapterToApprove.mangaId}/chapter/${chapterId}`
        }))
      });
    }

    // 4. Notificar al contribuyente (si existe)
    // Esta parte del código ahora SIEMPRE se ejecutará, sin importar si había seguidores o no.
    if (chapterToApprove.lastEditedById) {
      await tx.notification.create({
        data: {
          userId: chapterToApprove.lastEditedById,
          type: 'PROPOSAL_APPROVED',
          message: `¡Tu contribución ha sido aprobada! El Capítulo ${chapterToApprove.chapterNumber} de "${chapterToApprove.manga.title}" ahora es público.`,
          link: `/comic/${chapterToApprove.mangaId}/chapter/${chapterId}`
        }
      });
    }
  });

  res.status(200).json({ message: `Capítulo con ID ${chapterId} ha sido aprobado y se han enviado las notificaciones.` });
});

// --- Controlador para RECHAZAR un manga (y todos sus capítulos) ---
export const rejectManga = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mangaId } = req.params;
  const { reason } = req.body;

  if (!reason) {
    res.status(400);
    throw new Error('Se requiere un motivo para el rechazo.');
  }

  // 1. Obtenemos el estado actual del manga.
  const manga = await prisma.manga.findUnique({
    where: { id: mangaId },
    select: { status: true, title: true } // Obtenemos el título para las notificaciones
  });

  if (!manga) {
    res.status(404);
    throw new Error('Manga no encontrado.');
  }

  // 2. Obtenemos los capítulos PENDIENTES para saber a quién notificar.
  const pendingChapters = await prisma.chapter.findMany({
    where: {
      mangaId: mangaId,
      status: 'PENDING'
    },
    select: { id: true, lastEditedById: true, chapterNumber: true }
  });
  const chaptersWithContributors = pendingChapters.filter(c => c.lastEditedById);

  // 3. Aplicamos la lógica condicional basada en el estado.
  if (manga.status === 'APPROVED') {
    // --- CASO 1: El manga ya está aprobado ---
    // Solo se rechazan los capítulos pendientes.

    const rejectChaptersPromise = prisma.chapter.updateMany({
      where: { 
        mangaId: mangaId,
        status: 'PENDING',
      },
      data: { status: 'REJECTED', rejectionReason: reason },
    });

    const unlockPromise = prisma.manga.update({
        where: { id: mangaId },
        data: { lockedById: null, lockedAt: null }
    });
    
    // Ejecutamos ambas operaciones en paralelo
    await Promise.all([rejectChaptersPromise, unlockPromise]);

    // Notificamos a los contribuidores de los capítulos rechazados.
    if (chaptersWithContributors.length > 0) {
      await prisma.notification.createMany({
        data: chaptersWithContributors.map(chapter => ({
          userId: chapter.lastEditedById!,
          type: 'PROPOSAL_REJECTED',
          message: `Tu contribución para el Cap. ${chapter.chapterNumber} de "${manga.title}" fue rechazada. Motivo: ${reason}`,
          link: `/comic/${mangaId}`
        }))
      });
    }

    res.status(200).json({ message: `Los capítulos pendientes del manga han sido rechazados y se han enviado las notificaciones.` });

  } else {
    // --- CASO 2: El manga es una nueva obra (status: PENDING) ---
    // Se rechaza todo.

    const rejectMangaPromise = prisma.manga.update({
      where: { id: mangaId },
      data: { 
        status: 'REJECTED',
        rejectionReason: reason,
        lockedById: null,
        lockedAt: null,
      },
    });

    const rejectChaptersPromise = prisma.chapter.updateMany({
      where: { 
        mangaId: mangaId,
        // Rechazamos todos los capítulos asociados, no solo los pendientes
      },
      data: { status: 'REJECTED', rejectionReason: reason },
    });
    
    // Ejecutamos todo en una transacción
    await prisma.$transaction([rejectMangaPromise, rejectChaptersPromise]);

    // Notificamos a los contribuidores.
    if (chaptersWithContributors.length > 0) {
       await prisma.notification.createMany({
        data: chaptersWithContributors.map(chapter => ({
          userId: chapter.lastEditedById!,
          type: 'PROPOSAL_REJECTED',
          message: `Tu contribución para el Cap. ${chapter.chapterNumber} de "${manga.title}" fue rechazada. Motivo: ${reason}`,
          link: `/comic/${mangaId}`
        }))
      });
    }
    
    res.status(200).json({ message: `Manga con ID ${mangaId} y todos sus capítulos han sido rechazados y se han enviado las notificaciones.` });
  }
});

// --- Controlador para RECHAZAR un capítulo específico ---
export const rejectChapter = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { chapterId } = req.params;
  const { reason } = req.body; // Leemos el motivo del body

  // 1. Rechazamos el capítulo y guardamos el resultado
  const rejectedChapter = await prisma.chapter.update({
    where: { id: chapterId },
    data: { 
      status: 'REJECTED', 
      rejectionReason: reason 
    },
    // Incluimos los datos que necesitamos para la notificación
    select: {
      lastEditedById: true,
      mangaId: true,
      chapterNumber: true,
      manga: {
        select: {
          title: true
        }
      }
    }
  });

  if (!rejectedChapter) {
    res.status(404);
    throw new Error('Capítulo no encontrado para rechazar.');
  }

  // 2. --- ¡NUEVO! Creamos la notificación para el contribuyente ---
  // Nos aseguramos de que haya un usuario a quien notificar
  if (rejectedChapter.lastEditedById) {
    await prisma.notification.create({
      data: {
        userId: rejectedChapter.lastEditedById,
        type: 'PROPOSAL_REJECTED', // Reutilizamos este tipo, es adecuado
        message: `Tu contribución para el Cap. ${rejectedChapter.chapterNumber} de "${rejectedChapter.manga.title}" fue rechazada. Motivo: ${reason}`,
        // Enlazamos a la página principal del manga para que el usuario tenga contexto
        link: `/comic/${rejectedChapter.mangaId}` 
      }
    });
  }

  // 3. Enviamos la respuesta de éxito
  res.status(200).json({ message: `Capítulo con ID ${chapterId} ha sido rechazado y se ha notificado al usuario.` });
});

// --- Controlador para ELIMINAR un manga y todo su contenido asociado ---
// Esta es una acción destructiva y final.
export const deleteManga = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mangaId } = req.params;

  // Gracias a `onDelete: Cascade` en nuestro schema.prisma,
  // al eliminar un manga, Prisma se encargará de eliminar
  // todos sus capítulos y páginas asociados.
  await prisma.manga.delete({
    where: { id: mangaId },
  });

  res.status(204).send(); // 204 No Content, la operación fue exitosa pero no hay nada que devolver.
});

// --- Controlador para obtener Propuestas de Edición Pendientes ---
export const getPendingProposals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const pendingProposals = await prisma.editProposal.findMany({
    where: { status: 'PENDING' },
    include: {
      manga: { select: { title: true, id: true } },
      proposer: { select: { username: true } }
    },
    orderBy: { createdAt: 'asc' }
  });
  res.status(200).json(pendingProposals);
});

// --- Controlador para obtener los detalles de UNA Propuesta para Revisión ---
export const getProposalForReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { proposalId } = req.params;
  const proposal = await prisma.editProposal.findUnique({
    where: { id: proposalId },
    include: {
      manga: true, // Incluye todos los datos del manga original para comparar
      proposer: { select: { username: true } }
    }
  });
  if (!proposal) {
    res.status(404);
    throw new Error('Propuesta no encontrada.');
  }
  res.status(200).json(proposal);
});


// --- Controlador para APROBAR una propuesta de edición ---
export const approveProposal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { proposalId } = req.params;

  // Primero, obtenemos la propuesta y la información del manga relacionado.
  // Es importante tener los datos antes de la transacción.
  const proposal = await prisma.editProposal.findUnique({ 
    where: { id: proposalId },
    include: {
      manga: {
        select: { title: true } // Solo necesitamos el título del manga para el mensaje
      }
    }
  });

  if (!proposal) {
    res.status(404);
    throw new Error('Propuesta no encontrada.');
  }
  if (proposal.status !== 'PENDING') {
    res.status(400);
    throw new Error('Esta propuesta ya ha sido revisada.');
  }

  // Preparamos los datos a actualizar en el manga
  const dataToUpdate: { title?: string; author?: string; synopsis?: string; coverUrl?: string; lastEditedById?: string } = {};
  if (proposal.title) dataToUpdate.title = proposal.title;
  if (proposal.author) dataToUpdate.author = proposal.author;
  if (proposal.synopsis) dataToUpdate.synopsis = proposal.synopsis;
  if (proposal.coverUrl) dataToUpdate.coverUrl = proposal.coverUrl;
  dataToUpdate.lastEditedById = proposal.proposerId;

  // Ejecutamos TODAS las operaciones en una transacción para asegurar la integridad de los datos.
  await prisma.$transaction([
    // 1. Actualiza el manga con los datos propuestos.
    prisma.manga.update({
      where: { id: proposal.mangaId },
      data: dataToUpdate
    }),
    
    // 2. Actualiza el estado de la propuesta a APROBADA.
    prisma.editProposal.update({
      where: { id: proposalId },
      data: { status: 'APPROVED' }
    }),

    // 3. --- ¡NUEVO! Creamos la notificación para el usuario que hizo la propuesta ---
    prisma.notification.create({
      data: {
        userId: proposal.proposerId,
        type: 'PROPOSAL_APPROVED',
        message: `¡Buenas noticias! Tu propuesta de edición para "${proposal.manga.title}" ha sido aprobada.`,
        link: `/comic/${proposal.mangaId}`
      }
    })
  ]);

  res.status(200).json({ message: `Propuesta ${proposalId} aprobada y notificación enviada.` });
});

// --- Controlador para RECHAZAR una propuesta de edición ---
export const rejectProposal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { proposalId } = req.params;
  const { reason } = req.body;

  // 1. Actualizamos el estado de la propuesta a RECHAZADA.
  // Guardamos el resultado en una variable para obtener los detalles.
  const rejectedProposal = await prisma.editProposal.update({
    where: { id: proposalId },
    data: { status: 'REJECTED', rejectionReason: reason },
    // Incluimos la información del manga para poder usarla en la notificación.
    include: {
      manga: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });

  if (!rejectedProposal) {
    res.status(404);
    throw new Error('Propuesta no encontrada para rechazar.');
  }

  // 2. --- ¡NUEVO! Creamos la notificación para el usuario que hizo la propuesta ---
  await prisma.notification.create({
    data: {
      // El ID del usuario al que se le notifica
      userId: rejectedProposal.proposerId,
      // El tipo de notificación
      type: 'PROPOSAL_REJECTED',
      // El mensaje que verá el usuario
      message: `Tu propuesta para "${rejectedProposal.manga.title}" fue rechazada. Motivo: ${reason}`,
      // El enlace al que irá el usuario si hace clic en la notificación
      link: `/comic/${rejectedProposal.manga.id}`
    }
  });

  // 3. Enviamos la respuesta de éxito.
  res.status(200).json({ message: `Propuesta ${proposalId} rechazada y notificación enviada.` });
});


// Definimos la duración del bloqueo en minutos. 15 minutos es un buen punto de partida.
const LOCK_DURATION_MINUTES = 15;

// --- Controlador para BLOQUEAR un manga para revisión ---
export const lockMangaForReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mangaId } = req.params;
  const adminId = req.user!.id;

  const manga = await prisma.manga.findUnique({
    where: { id: mangaId },
    select: { 
      status: true, // Obtenemos el estado del manga ('PENDING', 'APPROVED', etc.)
      chapters: {    // Obtenemos los capítulos asociados...
        where: { status: 'PENDING' }, // ...pero solo los que estén pendientes.
        select: { id: true }          // Solo necesitamos saber si existen, con el 'id' es suficiente.
      }, 
      lockedById: true, 
      lockedAt: true, 
      lockedBy: { select: { username: true } } 
    }
  });

  if (!manga) {
    res.status(404);
    throw new Error('Manga no encontrado.');
  }

    // El manga solo necesita revisión si su propio estado es PENDING,
  // O si tiene al menos un capítulo PENDING.
  const needsReview = manga.status === 'PENDING' || manga.chapters.length > 0;
  if (!needsReview) {
    res.status(400); // Bad Request
    throw new Error('Este manga ya ha sido revisado y no tiene cambios pendientes.');
  }

  const now = new Date();
  const isLockExpired = manga.lockedAt && (now.getTime() - manga.lockedAt.getTime()) > LOCK_DURATION_MINUTES * 60 * 1000;

  // Un moderador puede bloquear si:
  // 1. No está bloqueado por nadie.
  // 2. Ya lo ha bloqueado él mismo (para refrescar el bloqueo).
  // 3. El bloqueo de otro moderador ha expirado.
  if (!manga.lockedById || manga.lockedById === adminId || isLockExpired) {
    const updatedManga = await prisma.manga.update({
      where: { id: mangaId },
      data: {
        lockedById: adminId,
        lockedAt: now,
      },
    });
    res.status(200).json({ success: true, message: 'Manga bloqueado para tu revisión.' });
  } else {
    // Si ya está bloqueado por otro moderador y el bloqueo es válido.
    res.status(409); // 409 Conflict
    throw new Error(`Este manga ya está siendo revisado por ${manga.lockedBy?.username || 'otro moderador'}.`);
  }
});


// --- Controlador para LIBERAR un manga ---
export const unlockManga = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mangaId } = req.params;
  const adminId = req.user!.id;

  // Actualizamos el manga para quitar el bloqueo, pero solo si el que lo pide es el que lo bloqueó.
  // Esto es una medida de seguridad para que un moderador no pueda "robarle" la tarea a otro.
  await prisma.manga.updateMany({
    where: {
      id: mangaId,
      lockedById: adminId, 
    },
    data: {
      lockedById: null,
      lockedAt: null,
    },
  });

  res.status(200).json({ success: true, message: 'Manga liberado.' });
});

export const getArchivedMangas = asyncHandler(async (req: AuthRequest, res: Response) => {
  // 1. Leemos los parámetros de paginación de la URL
  const page = parseInt(req.query.page as string) || 1;
  const limit = 7; // Límite fijo de 7 resultados por página
  const skip = (page - 1) * limit;

  // 2. Definimos la condición de búsqueda usando el enum para seguridad de tipos
  const whereCondition: Prisma.MangaWhereInput = { 
    status: ContentStatus.ARCHIVED 
  };

  // 3. Ejecutamos la consulta paginada y el conteo total en una transacción
  const [archived, total] = await prisma.$transaction([
    prisma.manga.findMany({
      where: whereCondition,
      select: {
        id: true,
        title: true,
        coverUrl: true,
        uploader: { select: { username: true } },
        updatedAt: true
      },
      orderBy: { 
        updatedAt: 'desc' 
      },
      take: limit,
      skip: skip,
    }),
    prisma.manga.count({ where: whereCondition })
  ]);

  // 4. Devolvemos la respuesta en el formato de paginación que el frontend espera
  res.status(200).json({
    data: archived,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  });
});

// --- Controlador para ELIMINAR un capítulo de forma permanente ---
export const deleteChapterPermanently = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { chapterId } = req.params;

  // Usamos delete. Si el capítulo no existe, Prisma lanzará un error que asyncHandler capturará.
  await prisma.chapter.delete({
    where: { id: chapterId },
  });

  // La cascada de borrado en el schema se encargará de borrar las páginas asociadas.
  res.status(204).send();
});

// --- Controlador para RESTAURAR un manga archivado ---
export const restoreManga = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mangaId } = req.params;

  // Buscamos el manga para asegurarnos de que realmente está archivado
  const mangaToRestore = await prisma.manga.findFirst({
    where: { id: mangaId, status: 'ARCHIVED' }
  });

  if (!mangaToRestore) {
    res.status(404);
    throw new Error('Manga no encontrado o no está archivado.');
  }

  // Lo restauramos al estado 'PENDING'. Esto asegura que un moderador
  // deba revisar el contenido antes de que vuelva a ser público. Es más seguro.
  await prisma.manga.update({
    where: { id: mangaId },
    data: { status: 'PENDING' }
  });

  res.status(200).json({ message: 'Manga restaurado y enviado a la cola de revisión.' });
});