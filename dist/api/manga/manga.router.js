"use strict";
// src/api/manga/manga.router.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const manga_controller_1 = require("./manga.controller");
const user_middleware_1 = require("../middleware/user.middleware");
const router = (0, express_1.Router)();
// --- Rutas de Lectura de Mangas ---
// Obtener lista de mangas (público para los aprobados)
router.get('/', manga_controller_1.getMangas);
// Obtener detalles de un manga específico (público para los aprobados)
router.get('/:mangaId', user_middleware_1.getUserIfLoggedIn, manga_controller_1.getMangaById);
// Obtener las páginas de un capítulo específico (público para los aprobados)
router.get('/:mangaId/chapters/:chapterId/pages', user_middleware_1.getUserIfLoggedIn, manga_controller_1.getChapterPages);
exports.default = router;
