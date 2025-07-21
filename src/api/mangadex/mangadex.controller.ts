// src/api/mangadex/mangadex.controller.ts

import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import axios from 'axios';

const MANGADEX_API_URL = 'https://api.mangadex.org';
const MANGADEX_UPLOADS_URL = 'https://uploads.mangadex.org'; // <-- URL base para las imágenes

/**
 * Controlador genérico para hacer proxy de peticiones de DATOS (JSON) a la API de MangaDex.
 */
export const proxyToMangaDex = asyncHandler(async (req: Request, res: Response) => {
  try {
    const mangaDexUrl = `${MANGADEX_API_URL}${req.path}`;
    
    const response = await axios({
      method: req.method as 'get',
      url: mangaDexUrl,
      params: req.query,
      headers: { 'Accept': 'application/json' }
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
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
export const proxyMangaDexImage = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Usamos req.path para reconstruir la ruta de la imagen dinámicamente.
    // Ej: si la petición es a /mangadex/covers/id/file.jpg, req.path será /covers/id/file.jpg
    const imageUrl = `${MANGADEX_UPLOADS_URL}${req.path}`;

    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'stream'
    });
    
    res.setHeader('Content-Type', response.headers['content-type']);
    response.data.pipe(res);

  } catch (error: any) {
    console.error('Error en el proxy de imágenes de MangaDex:', error.message);
    res.status(error.response?.status || 500).send('Error al obtener la imagen');
  }
});