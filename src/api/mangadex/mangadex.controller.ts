// src/api/mangadex/mangadex.controller.ts

import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import axios from 'axios';

const MANGADEX_API_URL = 'https://api.mangadex.org';

/**
 * Controlador genérico para hacer proxy de CUALQUIER petición a la API de MangaDex.
 * Toma la ruta, los parámetros y el método de la petición que llega a nuestro backend
 * y los reenvía a la API de MangaDex.
 */
export const proxyToMangaDex = asyncHandler(async (req: Request, res: Response) => {
  try {
    // 1. Construimos la URL completa de MangaDex. 
    // req.path contiene todo lo que viene después de '/mangadex' en la ruta.
    // Ej: si la petición es a /mangadex/manga/123, req.path será /manga/123
    const mangaDexUrl = `${MANGADEX_API_URL}${req.path}`;

    // 2. Hacemos la petición a MangaDex usando la configuración de la petición original.
    const response = await axios({
      method: req.method as 'get' | 'post' | 'put' | 'delete',
      url: mangaDexUrl,
      params: req.query, // Reenvía todos los parámetros de la query (ej: ?limit=10)
      data: req.body,    // Reenvía el cuerpo de la petición (para POSTs)
      headers: {
        'Accept': 'application/json', // Header estándar para APIs
      }
    });

    // 3. Devolvemos la respuesta de MangaDex (datos y código de estado) a nuestro frontend.
    res.status(response.status).json(response.data);

  } catch (error: any) {
    // Si MangaDex devuelve un error (ej: 404 Not Found), lo capturamos aquí.
    console.error('Error en el proxy de MangaDex:', error.response?.data || error.message);
    
    // Devolvemos el mismo error y mensaje que nos dio MangaDex al frontend.
    res.status(error.response?.status || 500)
       .json(error.response?.data || { message: 'Error al contactar con la API de MangaDex' });
  }
});