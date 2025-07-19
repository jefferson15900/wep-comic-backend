// src/api/auth/auth.controller.ts

import { Request, Response } from 'express';
import prisma from '../../db';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';

// --- Helper Function para generar el Token ---
// Esta función crea y firma un token JWT que identifica al usuario.
const generateToken = (id: string) => {
  // Obtenemos la palabra secreta de las variables de entorno.
  // Si no existe, lanzamos un error para detener la aplicación, ya que es un fallo crítico.
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET no está definido en el archivo .env');
    process.exit(1);
  }

  return jwt.sign({ id }, jwtSecret, {
    expiresIn: '30d', // El token será válido durante 30 días
  });
};


// --- Controlador para REGISTRAR un nuevo usuario ---
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, username, password } = req.body;

  // Comprobar si el usuario ya existe
  const existingUser = await prisma.user.findFirst({
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
  const newUser = await prisma.user.create({
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
  } else {
    res.status(400);
    throw new Error('Datos de usuario inválidos');
  }
});


// --- Controlador para INICIAR SESIÓN ---
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validación de entrada
  if (!email || !password) {
    res.status(400);
    throw new Error('Por favor, proporciona email y contraseña');
  }

  // Buscar al usuario por su email
  const user = await prisma.user.findUnique({
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
  } else {
    res.status(401); // Unauthorized
    throw new Error('Email o contraseña inválidos');
  }
});