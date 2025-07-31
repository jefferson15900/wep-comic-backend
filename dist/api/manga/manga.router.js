"use strict";
// src/api/manga/manga.router.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const manga_controller_1 = require("./manga.controller");
const user_middleware_1 = require("../middleware/user.middleware");
const comments_router_1 = __importDefault(require("../comments/comments.router"));
const router = (0, express_1.Router)();
// --- Rutas de Lectura de Mangas ---
// Obtener lista de mangas (público para los aprobados)
router.get('/', manga_controller_1.getMangas);
// Obtener detalles de un manga específico (público para los aprobados)
router.get('/:mangaId', user_middleware_1.getUserIfLoggedIn, manga_controller_1.getMangaById);
// Obtener las páginas de un capítulo específico (público para los aprobados)
router.get('/:mangaId/chapters/:chapterId/pages', user_middleware_1.getUserIfLoggedIn, manga_controller_1.getChapterPages);
// enviada al 'commentsRouter' para que la maneje
router.use('/:mangaId/comments', comments_router_1.default);
exports.default = router;
