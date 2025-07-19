// src/api/user/user.router.ts

import { Router } from 'express';
import { 
  getUserProfile, 
  updateUserPassword, 
  getUserProfileByUsername, 
  updateUserProfile,
  getUserCreations,
  getUserContributions,
  getUserFavorites
} from './user.controller';
import { protect } from '../middleware/auth.middleware';
import { getUserIfLoggedIn } from '../middleware/user.middleware';
import { uploadAvatar } from '../../config/cloudinary'; // <-- IMPORTA el middleware

const router = Router();

// --- Rutas del Usuario Autenticado (/me) ---
router.get('/me', protect, getUserProfile);
router.put('/me/password', protect, updateUserPassword);

// --- RUTA CORREGIDA ---
// Añadimos el middleware uploadAvatar.single('avatar') para procesar el archivo
router.put('/me/profile', protect, uploadAvatar.single('avatar'), updateUserProfile);


// --- Rutas de Perfiles Públicos ---
router.get('/profile/:username', getUserIfLoggedIn, getUserProfileByUsername); // Usamos getUserIfLoggedIn para el "isOwner"
router.get('/profile/:username/favorites', getUserFavorites);
router.get('/profile/:username/creations', getUserIfLoggedIn, getUserCreations);
router.get('/profile/:username/contributions', getUserContributions);


export default router;