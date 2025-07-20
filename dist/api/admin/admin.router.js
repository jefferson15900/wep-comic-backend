"use strict";
// backend/src/api/admin/admin.router.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware"); // Lo mantenemos para acciones destructivas
const moderator_middleware_1 = require("../middleware/moderator.middleware"); // Importamos el nuevo
const admin_controller_1 = require("./admin.controller");
const router = (0, express_1.Router)();
// --- ¡AÑADE ESTAS NUEVAS RUTAS DE BLOQUEO! ---
// Deben estar protegidas por el middleware que permite a moderadores y admins.
router.post('/review/manga/:mangaId/lock', auth_middleware_1.protect, moderator_middleware_1.moderatorOrAdminOnly, admin_controller_1.lockMangaForReview);
router.post('/review/manga/:mangaId/unlock', auth_middleware_1.protect, moderator_middleware_1.moderatorOrAdminOnly, admin_controller_1.unlockManga);
// --- RUTAS DE MODERACIÓN (Para Moderadores y Admins) ---
// Todas estas rutas usan el nuevo middleware 'moderatorOrAdminOnly'
router.post('/manga/:mangaId/restore', auth_middleware_1.protect, moderator_middleware_1.moderatorOrAdminOnly, admin_controller_1.restoreManga);
// Obtener colas de moderación
router.get('/new-submissions', auth_middleware_1.protect, moderator_middleware_1.moderatorOrAdminOnly, admin_controller_1.getNewSubmissions);
router.get('/pending-edits', auth_middleware_1.protect, moderator_middleware_1.moderatorOrAdminOnly, admin_controller_1.getPendingEdits);
router.get('/pending-proposals', auth_middleware_1.protect, moderator_middleware_1.moderatorOrAdminOnly, admin_controller_1.getPendingProposals);
router.get('/archived-mangas', auth_middleware_1.protect, moderator_middleware_1.moderatorOrAdminOnly, admin_controller_1.getArchivedMangas);
// Obtener detalles para revisión
router.get('/review/manga/:mangaId', auth_middleware_1.protect, moderator_middleware_1.moderatorOrAdminOnly, admin_controller_1.getMangaForReview);
router.get('/review/proposal/:proposalId', auth_middleware_1.protect, moderator_middleware_1.moderatorOrAdminOnly, admin_controller_1.getProposalForReview);
// Acciones de aprobación
router.post('/manga/:mangaId/approve', auth_middleware_1.protect, moderator_middleware_1.moderatorOrAdminOnly, admin_controller_1.approveManga);
router.post('/chapter/:chapterId/approve', auth_middleware_1.protect, moderator_middleware_1.moderatorOrAdminOnly, admin_controller_1.approveChapter);
router.post('/proposals/:proposalId/approve', auth_middleware_1.protect, moderator_middleware_1.moderatorOrAdminOnly, admin_controller_1.approveProposal);
// Acciones de rechazo
router.post('/manga/:mangaId/reject', auth_middleware_1.protect, moderator_middleware_1.moderatorOrAdminOnly, admin_controller_1.rejectManga);
router.post('/chapter/:chapterId/reject', auth_middleware_1.protect, moderator_middleware_1.moderatorOrAdminOnly, admin_controller_1.rejectChapter);
router.post('/proposals/:proposalId/reject', auth_middleware_1.protect, moderator_middleware_1.moderatorOrAdminOnly, admin_controller_1.rejectProposal);
router.post('/manga/:mangaId/restore', auth_middleware_1.protect, moderator_middleware_1.moderatorOrAdminOnly, admin_controller_1.restoreManga);
// --- RUTA DE ADMINISTRACIÓN (SOLO PARA Admins) ---
// La acción de eliminar es destructiva, la reservamos para el rol de ADMIN.
router.delete('/manga/:mangaId', auth_middleware_1.protect, admin_middleware_1.adminOnly, admin_controller_1.deleteManga);
router.delete('/chapter/:chapterId', auth_middleware_1.protect, admin_middleware_1.adminOnly, admin_controller_1.deleteChapterPermanently);
exports.default = router;
