"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = void 0;
const adminOnly = (req, res, next) => {
    // Usamos el middleware 'protect' ANTES que este, por lo que 'req.user' existirá.
    if (req.user && req.user.role === 'ADMIN') {
        next(); // El usuario es ADMIN, puede continuar.
    }
    else {
        res.status(403); // Forbidden
        throw new Error('Acceso denegado. Se requiere rol de administrador.');
    }
};
exports.adminOnly = adminOnly;
