"use strict";
// src/server.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// --- Importaciones de Routers ---
const auth_router_1 = __importDefault(require("./api/auth/auth.router"));
const user_router_1 = __importDefault(require("./api/user/user.router"));
const favorites_router_1 = __importDefault(require("./api/favorites/favorites.router"));
const manga_router_1 = __importDefault(require("./api/manga/manga.router"));
const community_router_1 = __importDefault(require("./api/community/community.router"));
const admin_router_1 = __importDefault(require("./api/admin/admin.router"));
const notification_router_1 = __importDefault(require("./api/notifications/notification.router"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// --- Middlewares Esenciales ---
// --- ¡NUEVA CONFIGURACIÓN DE CORS PARA PRODUCCIÓN! ---
// Define los orígenes (URLs) que tienen permiso para acceder a tu API
const allowedOrigins = [
    'http://localhost:5173', // Permite el desarrollo local del frontend
    // Cuando despliegues tu frontend, añade su URL aquí. Ejemplo:
    // 'https://tu-wepcomic.vercel.app', 
    // 'https://www.tu-dominio.com'
];
const corsOptions = {
    origin: (origin, callback) => {
        // Si la petición no tiene origen (como Postman) o si el origen está en nuestra lista blanca, la permitimos.
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            // Si el origen no está permitido, la rechazamos.
            callback(new Error('No permitido por la política de CORS'));
        }
    },
};
app.use((0, cors_1.default)(corsOptions)); // Usa las nuevas opciones de CORS
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// --- Rutas ---
app.get('/api/health', (req, res) => {
    res.json({ status: 'UP', message: 'El servidor de WepComic está funcionando!' });
});
// Monta los routers en sus rutas base
app.use('/auth', auth_router_1.default);
app.use('/users', user_router_1.default);
app.use('/favorites', favorites_router_1.default);
app.use('/mangas', manga_router_1.default);
app.use('/community', community_router_1.default);
app.use('/admin', admin_router_1.default);
app.use('/notifications', notification_router_1.default);
// --- Middlewares de Manejo de Errores ---
app.use((req, res, next) => {
    const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
    res.status(404);
    next(error);
});
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    });
});
app.listen(PORT, () => {
    console.log(`🎉 Servidor corriendo en http://localhost:${PORT}`);
});
