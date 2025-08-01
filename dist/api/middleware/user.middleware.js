"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserIfLoggedIn = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const db_1 = __importDefault(require("../../db"));
exports.getUserIfLoggedIn = (0, express_async_handler_1.default)(async (req, res, next) => {
    req.user = null; // Inicializar a null por defecto
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const user = await db_1.default.user.findUnique({
                where: { id: decoded.id },
                select: { id: true, email: true, username: true, role: true, createdAt: true, updatedAt: true, avatarUrl: true, bio: true, favoritesArePublic: true, }
            });
            if (user) {
                req.user = user;
            }
        }
        catch (error) {
            console.error('getUserIfLoggedIn: Error verificando token o buscando usuario:', error);
            req.user = null;
        }
    }
    next();
});
