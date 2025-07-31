"use strict";
// backend/src/api/middleware/validate.middleware.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
// --- CAMBIO 1: Importamos 'ZodObject' en lugar de 'AnyZodObject' ---
const zod_1 = require("zod");
const validate = (schema) => // <-- Usamos el tipo corregido aquí
 (req, res, next) => {
    try {
        // Intenta validar el cuerpo de la petición contra el esquema.
        schema.parse(req.body);
        // Si la validación es exitosa, pasa al siguiente middleware.
        next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            // Si es un error de validación de Zod...
            // --- CAMBIO 2: Usamos 'error.issues' en lugar de 'error.errors' ---
            const errorMessages = error.issues.map(issue => ({
                field: issue.path.join('.'), // El campo que falló (ej. 'password')
                message: issue.message, // El mensaje de error (ej. "La contraseña es muy corta")
            }));
            // Enviamos la respuesta de error y terminamos el ciclo.
            res.status(400).json({ message: 'Datos inválidos', errors: errorMessages });
        }
        else {
            // Si es otro tipo de error, lo pasamos al manejador de errores global.
            next(error);
        }
    }
};
exports.validate = validate;
