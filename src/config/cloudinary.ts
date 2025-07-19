// src/config/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// La configuración de credenciales no cambia
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// --- Motor de Almacenamiento para PORTADAS (Covers) ---
const coverStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'wepcomic_covers',
    allowed_formats: ['jpeg', 'png', 'jpg', 'webp'],
    // Redimensionamos las portadas para que no sean excesivamente grandes
    transformation: [{ width: 800, crop: 'limit' }],
  } as any, // 'as any' para evitar problemas de tipos con params
});


// --- Motor de Almacenamiento para PÁGINAS DE CAPÍTULO (Pages) ---
const pageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'wepcomic_pages', // Guardamos las páginas en una carpeta diferente
    allowed_formats: ['jpeg', 'png', 'jpg', 'webp'],
    // ¡SIN TRANSFORMACIÓN! Guardamos la imagen con su calidad y tamaño original.
    // Opcionalmente, podrías poner un límite de ancho muy grande, ej: { width: 2000, crop: 'limit' }
  } as any,
});

const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'wepcomic_avatars',
    allowed_formats: ['jpeg', 'png', 'jpg', 'webp'],
    // Redimensionamos los avatares a un tamaño cuadrado y razonable
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  } as any,
});



// --- Creamos dos middlewares de Multer diferentes ---
export const uploadCover = multer({ storage: coverStorage });
export const uploadPages = multer({ storage: pageStorage });
export const uploadAvatar = multer({ storage: avatarStorage });