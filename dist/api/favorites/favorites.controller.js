"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFavorite = exports.addFavorite = exports.getFavorites = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const db_1 = __importDefault(require("../../db"));
// Obtener todos los favoritos de un usuario
exports.getFavorites = (0, express_async_handler_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const favorites = await db_1.default.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
    // Devolvemos solo un array de los IDs de los cómics
    res.json(favorites.map(fav => fav.comicId));
});
// Añadir un nuevo favorito
exports.addFavorite = (0, express_async_handler_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { comicId } = req.body;
    if (!comicId) {
        res.status(400);
        throw new Error('El comicId es requerido');
    }
    const newFavorite = await db_1.default.favorite.create({
        data: {
            userId: userId,
            comicId,
        },
    });
    res.status(201).json(newFavorite);
});
// Quitar un favorito
exports.removeFavorite = (0, express_async_handler_1.default)(async (req, res) => {
    const userId = req.user?.id;
    // Obtenemos el comicId de los parámetros de la URL (ej: /favorites/abc-123)
    const { comicId } = req.params;
    await db_1.default.favorite.delete({
        where: {
            userId_comicId: {
                userId: userId,
                comicId,
            },
        },
    });
    res.status(204).send(); // 204 No Content
});
