// src/api/mangadex/mangadex.router.ts

import express from 'express';
// Asegúrate de importar ambos controladores
import { proxyToMangaDex, proxyMangaDexImage } from './mangadex.controller';

const router = express.Router();

// --- RUTAS PARA DATOS (JSON) ---
// Estas usan el proxy genérico para datos
router.get('/manga', proxyToMangaDex);
router.get('/manga/tag', proxyToMangaDex);
router.get('/manga/:id', proxyToMangaDex);
router.get('/manga/:id/feed', proxyToMangaDex);
router.get('/chapter', proxyToMangaDex);
router.get('/statistics/manga', proxyToMangaDex);
router.get('/at-home/server/:chapterId', proxyToMangaDex);

// --- RUTAS PARA IMÁGENES ---
// Estas usan el proxy específico para imágenes (stream)

// 1. RUTA PARA LAS PORTADAS
router.get('/covers/:mangaId/:fileName', proxyMangaDexImage);

// 2. RUTA PARA LAS PÁGINAS DE CAPÍTULOS
router.get('/data-saver/:hash/:fileName', proxyMangaDexImage);

export default router;