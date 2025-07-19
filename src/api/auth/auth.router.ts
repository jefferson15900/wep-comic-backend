// src/api/auth/auth.router.ts

import { Router } from 'express';
import { registerUser, loginUser } from './auth.controller';
import { validate } from '../middleware/validate.middleware'; // <-- IMPORTA EL VALIDADOR
import { registerSchema } from './auth.validation'; // <-- IMPORTA EL ESQUEMA
const router = Router();


// Cuando una petición POST llega a /auth/register, se llama a la función registerUser.
router.post('/register', registerUser);
router.post('/register', validate(registerSchema), registerUser);
// Cuando una petición POST llega a /auth/login, se llama a la función loginUser.
router.post('/login', loginUser);

export default router;