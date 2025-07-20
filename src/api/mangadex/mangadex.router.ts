// src/api/mangadex/mangadex.router.ts

import express from 'express';
import { proxyToMangaDex } from './mangadex.controller';

const router = express.Router();

// En lugar de un comodín, definimos cada ruta que el frontend necesita.
// Todas usarán el mismo controlador 'proxyToMangaDex' que se encarga de reenviar la petición.

// Para: getAllComics, getComicsByIds, getNewlyAddedComics, etc.
router.get('/manga', proxyToMangaDex);

// Para: getMangaTags
router.get('/manga/tag', proxyToMangaDex);

// Para: getComicById
router.get('/manga/:id', proxyToMangaDex);

// Para: getComicById (para obtener los capítulos)
router.get('/manga/:id/feed', proxyToMangaDex);

// Para: getRecentlyUpdatedComics
router.get('/chapter', proxyToMangaDex);

// Para: getMangaStatistics
router.get('/statistics/manga', proxyToMangaDex);

// Para: getChapterPages
router.get('/at-home/server/:chapterId', proxyToMangaDex);


export default router;