"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsRead = exports.getNotifications = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const db_1 = __importDefault(require("../../db"));
// Obtener notificaciones del usuario (no leídas primero)
exports.getNotifications = (0, express_async_handler_1.default)(async (req, res) => {
    const userId = req.user.id;
    // 1. Calculamos la fecha de hace 30 días a partir de ahora.
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const notifications = await db_1.default.notification.findMany({
        where: {
            userId,
            // 2. --- ¡NUEVO FILTRO DE FECHA! ---
            // Solo trae notificaciones cuya fecha de creación (createdAt)
            // sea mayor o igual que (gte) la de hace 30 días.
            createdAt: {
                gte: thirtyDaysAgo
            }
        },
        orderBy: [
            { isRead: 'asc' }, // Opcional: Muestra las no leídas (false) primero
            { createdAt: 'desc' } // Luego, ordena por fecha de la más nueva a la más vieja
        ],
        take: 50, // Aumentamos el límite a 50, ya que el total es más pequeño
    });
    res.status(200).json(notifications);
});
// Marcar todas las notificaciones como leídas
exports.markAsRead = (0, express_async_handler_1.default)(async (req, res) => {
    const userId = req.user.id;
    await db_1.default.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
    });
    res.status(204).send();
});
