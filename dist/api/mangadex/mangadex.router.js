"use strict";
// src/api/mangadex/mangadex.router.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// Asegúrate de importar ambos controladores
const mangadex_controller_1 = require("./mangadex.controller");
const router = express_1.default.Router();
// --- RUTAS PARA DATOS (JSON) ---
// Estas usan el proxy genérico para datos
router.get('/manga', mangadex_controller_1.proxyToMangaDex);
router.get('/manga/tag', mangadex_controller_1.proxyToMangaDex);
router.get('/manga/:id', mangadex_controller_1.proxyToMangaDex);
router.get('/manga/:id/feed', mangadex_controller_1.proxyToMangaDex);
router.get('/chapter', mangadex_controller_1.proxyToMangaDex);
router.get('/statistics/manga', mangadex_controller_1.proxyToMangaDex);
router.get('/at-home/server/:chapterId', mangadex_controller_1.proxyToMangaDex);
// --- RUTAS PARA IMÁGENES ---
// Estas usan el proxy específico para imágenes (stream)
// 1. RUTA PARA LAS PORTADAS
router.get('/covers/:mangaId/:fileName', mangadex_controller_1.proxyMangaDexImage);
// 2. RUTA PARA LAS PÁGINAS DE CAPÍTULOS
router.get('/data-saver/:hash/:fileName', mangadex_controller_1.proxyMangaDexImage);
exports.default = router;
