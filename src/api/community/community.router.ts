// src/api/community/community.router.ts

import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { uploadCover, uploadPages } from '../../config/cloudinary';
import { 
  createManga, 
  addChapterToManga,
  editMangaMetadata,
  editChapterMetadata,
  replaceChapterPages,
  proposeMangaEdit,
  archiveManga  
} from './community.controller'; 

const router = Router();

// --- Rutas de Creación ---

// Crear un nuevo manga (solo metadatos y portada)
router.post('/mangas', protect, uploadCover.single('coverImage'), createManga);

// Añadir un nuevo capítulo a un manga existente
router.post('/mangas/:mangaId/chapters', protect, uploadPages.array('pages', 50), addChapterToManga);

// --- Rutas de Edición ---

// Editar metadatos de un manga (y opcionalmente su portada)
router.put('/mangas/:mangaId', protect, uploadCover.single('coverImage'), editMangaMetadata);

// Editar metadatos de un capítulo
router.put('/chapters/:chapterId', protect, editChapterMetadata);

// Reemplazar todas las páginas de un capítulo
router.post('/chapters/:chapterId/replace', protect, uploadPages.array('pages', 50), replaceChapterPages);

// Ruta para que un usuario proponga una edición a los metadatos de un manga
router.post('/mangas/:mangaId/propose-edit', protect, uploadCover.single('coverImage'), proposeMangaEdit);

// Usamos el verbo DELETE porque, desde la perspectiva del usuario, está borrando el recurso.
// La ruta está protegida, por lo que solo usuarios logueados pueden acceder.
router.delete('/mangas/:mangaId', protect, archiveManga);
export default router;