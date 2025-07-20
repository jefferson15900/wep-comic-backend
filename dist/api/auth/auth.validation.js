"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchema = void 0;
// backend/src/api/auth/auth.validation.ts
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, { message: "El nombre de usuario debe tener al menos 3 caracteres." }).max(20, { message: "El nombre de usuario no puede tener más de 20 caracteres." }),
    email: zod_1.z.string().email({ message: "Por favor, introduce un correo electrónico válido." }),
    password: zod_1.z.string()
        .min(8, { message: "La contraseña debe tener al menos 8 caracteres." })
        .regex(/[a-z]/, { message: "La contraseña debe contener al menos una letra minúscula." })
        .regex(/[A-Z]/, { message: "La contraseña debe contener al menos una letra mayúscula." })
        .regex(/[0-9]/, { message: "La contraseña debe contener al menos un número." }),
});
