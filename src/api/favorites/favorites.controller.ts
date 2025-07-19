// src/api/favorites/favorites.controller.ts
import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../db';
import { AuthRequest } from '../middleware/auth.middleware';

// Obtener todos los favoritos de un usuario
export const getFavorites = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  // Devolvemos solo un array de los IDs de los cómics
  res.json(favorites.map(fav => fav.comicId));
});

// Añadir un nuevo favorito
export const addFavorite = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { comicId } = req.body;

  if (!comicId) {
    res.status(400);
    throw new Error('El comicId es requerido');
  }

  const newFavorite = await prisma.favorite.create({
    data: {
      userId: userId!,
      comicId,
    },
  });
  res.status(201).json(newFavorite);
});

// Quitar un favorito
export const removeFavorite = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  // Obtenemos el comicId de los parámetros de la URL (ej: /favorites/abc-123)
  const { comicId } = req.params;

  await prisma.favorite.delete({
    where: {
      userId_comicId: { // Usamos el índice único para encontrar el registro exacto
        userId: userId!,
        comicId,
      },
    },
  });
  res.status(204).send(); // 204 No Content
});