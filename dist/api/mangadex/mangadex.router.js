"use strict";
// src/api/mangadex/mangadex.router.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// --- ¡IMPORTAMOS AMBOS CONTROLADORES! ---
const mangadex_controller_1 = require("./mangadex.controller");
const router = express_1.default.Router();
// Rutas para DATOS (JSON) que usan el proxy genérico
router.get('/manga', mangadex_controller_1.proxyToMangaDex);
router.get('/manga/tag', mangadex_controller_1.proxyToMangaDex);
router.get('/manga/:id', mangadex_controller_1.proxyToMangaDex);
router.get('/manga/:id/feed', mangadex_controller_1.proxyToMangaDex);
router.get('/chapter', mangadex_controller_1.proxyToMangaDex);
router.get('/statistics/manga', mangadex_controller_1.proxyToMangaDex);
router.get('/at-home/server/:chapterId', mangadex_controller_1.proxyToMangaDex);
// --- ¡RUTA ESPECÍFICA PARA IMÁGENES! ---
// Esta ruta ahora usa el nuevo controlador 'proxyMangaDexImage'
router.get('/covers/:mangaId/:fileName', mangadex_controller_1.proxyMangaDexImage);
exports.default = router;
