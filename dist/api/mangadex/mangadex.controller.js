"use strict";
// src/api/mangadex/mangadex.controller.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.proxyMangaDexImage = exports.proxyToMangaDex = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const axios_1 = __importDefault(require("axios"));
const MANGADEX_API_URL = 'https://api.mangadex.org';
const MANGADEX_UPLOADS_URL = 'https://uploads.mangadex.org'; // <-- URL base para las imágenes
/**
 * Controlador genérico para hacer proxy de peticiones de DATOS (JSON) a la API de MangaDex.
 */
exports.proxyToMangaDex = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const mangaDexUrl = `${MANGADEX_API_URL}${req.path}`;
        const response = await (0, axios_1.default)({
            method: req.method,
            url: mangaDexUrl,
            params: req.query,
            headers: { 'Accept': 'application/json' }
        });
        res.status(response.status).json(response.data);
    }
    catch (error) {
        console.error('Error en el proxy de datos de MangaDex:', error.response?.data || error.message);
        res.status(error.response?.status || 500)
            .json(error.response?.data || { message: 'Error al contactar con la API de MangaDex' });
    }
});
/**
 * --- ¡NUEVO CONTROLADOR SOLO PARA IMÁGENES! ---
 * Controlador específico para hacer proxy de las imágenes de las portadas.
 * Este controlador tratará la respuesta como un stream de datos.
 */
exports.proxyMangaDexImage = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        // Usamos req.path para reconstruir la ruta de la imagen dinámicamente.
        // Ej: si la petición es a /mangadex/covers/id/file.jpg, req.path será /covers/id/file.jpg
        const imageUrl = `${MANGADEX_UPLOADS_URL}${req.path}`;
        const response = await (0, axios_1.default)({
            method: 'get',
            url: imageUrl,
            responseType: 'stream'
        });
        res.setHeader('Content-Type', response.headers['content-type']);
        response.data.pipe(res);
    }
    catch (error) {
        console.error('Error en el proxy de imágenes de MangaDex:', error.message);
        res.status(error.response?.status || 500).send('Error al obtener la imagen');
    }
});
