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
    // Construimos la URL de la imagen usando los parámetros de la ruta
    const imageUrl = `${MANGADEX_UPLOADS_URL}/covers/${req.params.mangaId}/${req.params.fileName}`;

    // Hacemos la petición a MangaDex pidiendo la respuesta como un 'stream'
    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'stream'
    });
    
    // Le decimos al navegador del usuario qué tipo de imagen estamos enviando
    res.setHeader('Content-Type', response.headers['content-type']);
    
    // "Entubamos" el stream de la imagen desde MangaDex directamente a la respuesta para el usuario
    response.data.pipe(res);

  } catch (error: any) {
    console.error('Error en el proxy de imágenes de MangaDex:', error.message);
    res.status(error.response?.status || 500).send('Error al obtener la imagen');
  }
});