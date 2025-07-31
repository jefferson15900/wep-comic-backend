"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/api/favorites/favorites.router.ts
const express_1 = require("express");
const favorites_controller_1 = require("./favorites.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Todas las rutas de favoritos estarán protegidas.
// El middleware 'protect' se ejecutará para cada una de ellas.
router.route('/')
    .get(auth_middleware_1.protect, favorites_controller_1.getFavorites)
    .post(auth_middleware_1.protect, favorites_controller_1.addFavorite);
router.route('/:comicId')
    .delete(auth_middleware_1.protect, favorites_controller_1.removeFavorite);
exports.default = router;
