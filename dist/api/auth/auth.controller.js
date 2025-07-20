"use strict";
// src/api/auth/auth.controller.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const db_1 = __importDefault(require("../../db"));
const bcrypt = __importStar(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
// --- Helper Function para generar el Token ---
// Esta función crea y firma un token JWT que identifica al usuario.
const generateToken = (id) => {
    // Obtenemos la palabra secreta de las variables de entorno.
    // Si no existe, lanzamos un error para detener la aplicación, ya que es un fallo crítico.
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error('JWT_SECRET no está definido en el archivo .env');
        process.exit(1);
    }
    return jsonwebtoken_1.default.sign({ id }, jwtSecret, {
        expiresIn: '30d', // El token será válido durante 30 días
    });
};
// --- Controlador para REGISTRAR un nuevo usuario ---
exports.registerUser = (0, express_async_handler_1.default)(async (req, res) => {
    const { email, username, password } = req.body;
    // Comprobar si el usuario ya existe
    const existingUser = await db_1.default.user.findFirst({
        where: { OR: [{ email }, { username }] },
    });
    if (existingUser) {
        res.status(409); // Conflict
        throw new Error('El email o el nombre de usuario ya existen');
    }
    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // Crear el usuario en la base de datos
    const newUser = await db_1.default.user.create({
        data: {
            email,
            username,
            password: hashedPassword,
        },
    });
    // Si el usuario se crea con éxito, devolver los datos y un token
    if (newUser) {
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json({
            message: 'Usuario registrado con éxito',
            user: userWithoutPassword,
            token: generateToken(newUser.id), // Le damos un token inmediatamente al registrarse
        });
    }
    else {
        res.status(400);
        throw new Error('Datos de usuario inválidos');
    }
});
// --- Controlador para INICIAR SESIÓN ---
exports.loginUser = (0, express_async_handler_1.default)(async (req, res) => {
    const { email, password } = req.body;
    // Validación de entrada
    if (!email || !password) {
        res.status(400);
        throw new Error('Por favor, proporciona email y contraseña');
    }
    // Buscar al usuario por su email
    const user = await db_1.default.user.findUnique({
        where: { email },
    });
    // Comprobar si el usuario existe y si la contraseña es correcta
    // bcrypt.compare se encarga de comparar la contraseña en texto plano con la hasheada.
    if (user && (await bcrypt.compare(password, user.password))) {
        const { password: _, ...userWithoutPassword } = user;
        // Si todo es correcto, devolvemos los datos del usuario y un nuevo token
        res.json({
            message: 'Inicio de sesión exitoso',
            user: userWithoutPassword,
            token: generateToken(user.id),
        });
    }
    else {
        res.status(401); // Unauthorized
        throw new Error('Email o contraseña inválidos');
    }
});
