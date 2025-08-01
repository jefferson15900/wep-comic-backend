"use strict";
// src/api/middleware/auth.middleware.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const db_1 = __importDefault(require("../../db"));
// Middleware "guardián" para proteger rutas.
exports.protect = (0, express_async_handler_1.default)(async (req, res, next) => {
    let token;
    // Verificamos si la cabecera 'Authorization' existe y empieza con 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Extraemos el token.
            token = req.headers.authorization.split(' ')[1];
            // 2. Verificamos y decodificamos el token.
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            // 3. Buscamos al usuario en la base de datos y lo adjuntamos a 'req'.
            req.user = await db_1.default.user.findUnique({
                where: { id: decoded.id },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                    avatarUrl: true,
                    bio: true,
                    favoritesArePublic: true,
                },
            });
            if (!req.user) {
                res.status(401);
                throw new Error('No autorizado, el usuario de este token ya no existe');
            }
            // Todo correcto, continuamos a la siguiente función.
            next();
        }
        catch (error) {
            res.status(401);
            throw new Error('No autorizado, el token es inválido o ha expirado');
        }
    }
    // Si no se encontró ningún token en la cabecera.
    if (!token) {
        res.status(401);
        throw new Error('No autorizado, no se ha proporcionado un token');
    }
});
