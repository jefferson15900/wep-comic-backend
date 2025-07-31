"use strict";
// backend/src/api/middleware/moderator.middleware.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderatorOrAdminOnly = void 0;
/**
 * Middleware para permitir el acceso solo a usuarios con rol 'MODERATOR' o 'ADMIN'.
 * Debe usarse DESPUÉS del middleware 'protect'.
 */
const moderatorOrAdminOnly = (req, res, next) => {
    // El middleware 'protect' ya ha verificado que req.user existe.
    if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'MODERATOR')) {
        // Si el usuario es ADMIN o MODERATOR, puede continuar.
        next();
    }
    else {
        // Si no, se le deniega el acceso.
        res.status(403); // 403 Forbidden
        throw new Error('Acceso denegado. Se requiere rol de moderador o administrador.');
    }
};
exports.moderatorOrAdminOnly = moderatorOrAdminOnly;
