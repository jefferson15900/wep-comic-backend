"use strict";
// src/api/comments/comments.controller.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.createComment = exports.getComments = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const db_1 = __importDefault(require("../../db"));
// Obtener comentarios para un manga
exports.getComments = (0, express_async_handler_1.default)(async (req, res) => {
    const { mangaId } = req.params;
    const comments = await db_1.default.comment.findMany({
        where: { mangaId },
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: {
                    username: true,
                    avatarUrl: true,
                },
            },
        },
    });
    res.json(comments);
});
// Crear un nuevo comentario (requiere autenticación)
exports.createComment = (0, express_async_handler_1.default)(async (req, res) => {
    const { mangaId } = req.params;
    const { text } = req.body;
    const userId = req.user?.id;
    if (!text || text.trim() === '') {
        res.status(400);
        throw new Error('El comentario no puede estar vacío.');
    }
    // --- ¡CORRECCIÓN CLAVE AQUÍ! ---
    // Usamos 'connect' para decirle a Prisma explícitamente cómo relacionar
    // el nuevo comentario con el usuario y el manga existentes.
    const newComment = await db_1.default.comment.create({
        data: {
            text,
            user: {
                connect: { id: userId }
            },
            manga: {
                connect: { id: mangaId }
            },
        },
        // El 'include' sigue siendo el mismo
        include: {
            user: {
                select: {
                    username: true,
                    avatarUrl: true,
                },
            },
        },
    });
    res.status(201).json(newComment);
});
// Eliminar un comentario (solo para Admin/Moderador)
exports.deleteComment = (0, express_async_handler_1.default)(async (req, res) => {
    const { commentId } = req.params;
    // Verificamos si el comentario existe antes de intentar borrarlo
    const comment = await db_1.default.comment.findUnique({
        where: { id: commentId },
    });
    if (!comment) {
        res.status(404);
        throw new Error('Comentario no encontrado.');
    }
    await db_1.default.comment.delete({
        where: { id: commentId },
    });
    res.status(204).send(); // 204 No Content es la respuesta estándar para un DELETE exitoso
});
