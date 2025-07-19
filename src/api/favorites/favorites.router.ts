// src/api/favorites/favorites.router.ts
import { Router } from 'express';
import { getFavorites, addFavorite, removeFavorite } from './favorites.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas de favoritos estarán protegidas.
// El middleware 'protect' se ejecutará para cada una de ellas.
router.route('/')
  .get(protect, getFavorites)
  .post(protect, addFavorite);

router.route('/:comicId')
  .delete(protect, removeFavorite);

export default router;