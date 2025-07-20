"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAvatar = exports.uploadPages = exports.uploadCover = void 0;
// src/config/cloudinary.ts
const cloudinary_1 = require("cloudinary");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const multer_1 = __importDefault(require("multer"));
// La configuración de credenciales no cambia
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// --- Motor de Almacenamiento para PORTADAS (Covers) ---
const coverStorage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: {
        folder: 'wepcomic_covers',
        allowed_formats: ['jpeg', 'png', 'jpg', 'webp'],
        // Redimensionamos las portadas para que no sean excesivamente grandes
        transformation: [{ width: 800, crop: 'limit' }],
    }, // 'as any' para evitar problemas de tipos con params
});
// --- Motor de Almacenamiento para PÁGINAS DE CAPÍTULO (Pages) ---
const pageStorage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: {
        folder: 'wepcomic_pages', // Guardamos las páginas en una carpeta diferente
        allowed_formats: ['jpeg', 'png', 'jpg', 'webp'],
        // ¡SIN TRANSFORMACIÓN! Guardamos la imagen con su calidad y tamaño original.
        // Opcionalmente, podrías poner un límite de ancho muy grande, ej: { width: 2000, crop: 'limit' }
    },
});
const avatarStorage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: {
        folder: 'wepcomic_avatars',
        allowed_formats: ['jpeg', 'png', 'jpg', 'webp'],
        // Redimensionamos los avatares a un tamaño cuadrado y razonable
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    },
});
// --- Creamos dos middlewares de Multer diferentes ---
exports.uploadCover = (0, multer_1.default)({ storage: coverStorage });
exports.uploadPages = (0, multer_1.default)({ storage: pageStorage });
exports.uploadAvatar = (0, multer_1.default)({ storage: avatarStorage });
