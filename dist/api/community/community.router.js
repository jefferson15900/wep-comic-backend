"use strict";
// src/api/community/community.router.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const cloudinary_1 = require("../../config/cloudinary");
const community_controller_1 = require("./community.controller");
const router = (0, express_1.Router)();
// --- Rutas de Creación ---
// Crear un nuevo manga (solo metadatos y portada)
router.post('/mangas', auth_middleware_1.protect, cloudinary_1.uploadCover.single('coverImage'), community_controller_1.createManga);
// Añadir un nuevo capítulo a un manga existente
router.post('/mangas/:mangaId/chapters', auth_middleware_1.protect, cloudinary_1.uploadPages.array('pages', 50), community_controller_1.addChapterToManga);
// --- Rutas de Edición ---
// Editar metadatos de un manga (y opcionalmente su portada)
router.put('/mangas/:mangaId', auth_middleware_1.protect, cloudinary_1.uploadCover.single('coverImage'), community_controller_1.editMangaMetadata);
// Editar metadatos de un capítulo
router.put('/chapters/:chapterId', auth_middleware_1.protect, community_controller_1.editChapterMetadata);
// Reemplazar todas las páginas de un capítulo
router.post('/chapters/:chapterId/replace', auth_middleware_1.protect, cloudinary_1.uploadPages.array('pages', 50), community_controller_1.replaceChapterPages);
// Ruta para que un usuario proponga una edición a los metadatos de un manga
router.post('/mangas/:mangaId/propose-edit', auth_middleware_1.protect, cloudinary_1.uploadCover.single('coverImage'), community_controller_1.proposeMangaEdit);
// Usamos el verbo DELETE porque, desde la perspectiva del usuario, está borrando el recurso.
// La ruta está protegida, por lo que solo usuarios logueados pueden acceder.
router.delete('/mangas/:mangaId', auth_middleware_1.protect, community_controller_1.archiveManga);
exports.default = router;
