"use strict";
// src/api/auth/auth.router.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const validate_middleware_1 = require("../middleware/validate.middleware"); // <-- IMPORTA EL VALIDADOR
const auth_validation_1 = require("./auth.validation"); // <-- IMPORTA EL ESQUEMA
const router = (0, express_1.Router)();
// Cuando una petición POST llega a /auth/register, se llama a la función registerUser.
router.post('/register', auth_controller_1.registerUser);
router.post('/register', (0, validate_middleware_1.validate)(auth_validation_1.registerSchema), auth_controller_1.registerUser);
// Cuando una petición POST llega a /auth/login, se llama a la función loginUser.
router.post('/login', auth_controller_1.loginUser);
exports.default = router;
