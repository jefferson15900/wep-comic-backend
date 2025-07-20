"use strict";
// src/api/user/user.router.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_middleware_1 = require("../middleware/user.middleware");
const cloudinary_1 = require("../../config/cloudinary"); // <-- IMPORTA el middleware
const router = (0, express_1.Router)();
// --- Rutas del Usuario Autenticado (/me) ---
router.get('/me', auth_middleware_1.protect, user_controller_1.getUserProfile);
router.put('/me/password', auth_middleware_1.protect, user_controller_1.updateUserPassword);
// --- RUTA CORREGIDA ---
// Añadimos el middleware uploadAvatar.single('avatar') para procesar el archivo
router.put('/me/profile', auth_middleware_1.protect, cloudinary_1.uploadAvatar.single('avatar'), user_controller_1.updateUserProfile);
// --- Rutas de Perfiles Públicos ---
router.get('/profile/:username', user_middleware_1.getUserIfLoggedIn, user_controller_1.getUserProfileByUsername); // Usamos getUserIfLoggedIn para el "isOwner"
router.get('/profile/:username/favorites', user_controller_1.getUserFavorites);
router.get('/profile/:username/creations', user_middleware_1.getUserIfLoggedIn, user_controller_1.getUserCreations);
router.get('/profile/:username/contributions', user_controller_1.getUserContributions);
exports.default = router;
