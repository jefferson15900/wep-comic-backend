// backend/src/api/admin/admin.router.ts

import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/admin.middleware'; // Lo mantenemos para acciones destructivas
import { moderatorOrAdminOnly } from '../middleware/moderator.middleware'; // Importamos el nuevo
import { 
  getNewSubmissions,
  getPendingEdits,
  getMangaForReview,
  approveManga,
  approveChapter,
  rejectManga,
  rejectChapter,
  deleteManga, // Esta será solo para admins
  getPendingProposals,
  getProposalForReview,
  approveProposal,
  rejectProposal,
  lockMangaForReview,
  unlockManga,
  getArchivedMangas,
  deleteChapterPermanently,
  restoreManga  
} from './admin.controller';

const router = Router();

// --- ¡AÑADE ESTAS NUEVAS RUTAS DE BLOQUEO! ---
// Deben estar protegidas por el middleware que permite a moderadores y admins.
router.post('/review/manga/:mangaId/lock', protect, moderatorOrAdminOnly, lockMangaForReview);
router.post('/review/manga/:mangaId/unlock', protect, moderatorOrAdminOnly, unlockManga);


// --- RUTAS DE MODERACIÓN (Para Moderadores y Admins) ---
// Todas estas rutas usan el nuevo middleware 'moderatorOrAdminOnly'

router.post('/manga/:mangaId/restore', protect, moderatorOrAdminOnly, restoreManga);

// Obtener colas de moderación
router.get('/new-submissions', protect, moderatorOrAdminOnly, getNewSubmissions);
router.get('/pending-edits', protect, moderatorOrAdminOnly, getPendingEdits);
router.get('/pending-proposals', protect, moderatorOrAdminOnly, getPendingProposals);
router.get('/archived-mangas', protect, moderatorOrAdminOnly, getArchivedMangas);

// Obtener detalles para revisión
router.get('/review/manga/:mangaId', protect, moderatorOrAdminOnly, getMangaForReview);
router.get('/review/proposal/:proposalId', protect, moderatorOrAdminOnly, getProposalForReview);

// Acciones de aprobación
router.post('/manga/:mangaId/approve', protect, moderatorOrAdminOnly, approveManga);
router.post('/chapter/:chapterId/approve', protect, moderatorOrAdminOnly, approveChapter);
router.post('/proposals/:proposalId/approve', protect, moderatorOrAdminOnly, approveProposal);

// Acciones de rechazo
router.post('/manga/:mangaId/reject', protect, moderatorOrAdminOnly, rejectManga);
router.post('/chapter/:chapterId/reject', protect, moderatorOrAdminOnly, rejectChapter);
router.post('/proposals/:proposalId/reject', protect, moderatorOrAdminOnly, rejectProposal);

router.post('/manga/:mangaId/restore', protect, moderatorOrAdminOnly, restoreManga);
// --- RUTA DE ADMINISTRACIÓN (SOLO PARA Admins) ---
// La acción de eliminar es destructiva, la reservamos para el rol de ADMIN.
router.delete('/manga/:mangaId', protect, adminOnly, deleteManga);
router.delete('/chapter/:chapterId', protect, adminOnly, deleteChapterPermanently);


export default router;