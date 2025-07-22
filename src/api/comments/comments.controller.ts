// src/api/comments/comments.controller.ts

import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../db';
// --- ¡RUTA CORREGIDA! ---
import { AuthRequest } from '../middleware/auth.middleware';

// Obtener comentarios para un manga
export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const { mangaId } = req.params;
  const comments = await prisma.comment.findMany({
    where: { mangaId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          username: true,
          avatarUrl: true,
        },
      },
    },
  });
  res.json(comments);
});

// Crear un nuevo comentario (requiere autenticación)
export const createComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mangaId } = req.params;
  const { text } = req.body;
  const userId = req.user?.id;

  if (!text || text.trim() === '') {
    res.status(400);
    throw new Error('El comentario no puede estar vacío.');
  }

  // --- ¡CORRECCIÓN CLAVE AQUÍ! ---
  // Usamos 'connect' para decirle a Prisma explícitamente cómo relacionar
  // el nuevo comentario con el usuario y el manga existentes.
  const newComment = await prisma.comment.create({
    data: {
      text,
      user: { // En lugar de userId
        connect: { id: userId! }
      },
      manga: { // En lugar de mangaId
        connect: { id: mangaId }
      },
    },
    // El 'include' sigue siendo el mismo
    include: {
      user: {
        select: {
          username: true,
          avatarUrl: true,
        },
      },
    },
  });

  res.status(201).json(newComment);
});


// Eliminar un comentario (solo para Admin/Moderador)
export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;

  // Verificamos si el comentario existe antes de intentar borrarlo
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    res.status(404);
    throw new Error('Comentario no encontrado.');
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  res.status(204).send(); // 204 No Content es la respuesta estándar para un DELETE exitoso
});