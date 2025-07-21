// src/api/mangadex/mangadex.router.ts

import express from 'express';
// --- ¡IMPORTAMOS AMBOS CONTROLADORES! ---
import { proxyToMangaDex, proxyMangaDexImage } from './mangadex.controller';

const router = express.Router();

// Rutas para DATOS (JSON) que usan el proxy genérico
router.get('/manga', proxyToMangaDex);
router.get('/manga/tag', proxyToMangaDex);
router.get('/manga/:id', proxyToMangaDex);
router.get('/manga/:id/feed', proxyToMangaDex);
router.get('/chapter', proxyToMangaDex);
router.get('/statistics/manga', proxyToMangaDex);
router.get('/at-home/server/:chapterId', proxyToMangaDex);

// --- ¡RUTA ESPECÍFICA PARA IMÁGENES! ---
// Esta ruta ahora usa el nuevo controlador 'proxyMangaDexImage'
router.get('/covers/:mangaId/:fileName', proxyMangaDexImage);

export default router;