"use strict";
// src/api/user/user.controller.ts
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
exports.getUserContributions = exports.getUserCreations = exports.getUserFavorites = exports.updateUserProfile = exports.getUserProfileByUsername = exports.updateUserPassword = exports.getUserProfile = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const db_1 = __importDefault(require("../../db"));
const bcrypt = __importStar(require("bcryptjs"));
const client_1 = require("@prisma/client");
// --- getUserProfile (SIN CAMBIOS EN LA LÓGICA, SOLO TIPOS) ---
exports.getUserProfile = (0, express_async_handler_1.default)(async (req, res) => {
    const user = req.user;
    if (user) {
        res.json(user);
    }
    else {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }
});
// --- updateUserPassword (SIN CAMBIOS EN LA LÓGICA, SOLO TIPOS) ---
exports.updateUserPassword = (0, express_async_handler_1.default)(async (req, res) => {
    // ... (toda la lógica de esta función permanece igual)
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;
    if (!currentPassword || !newPassword) {
        res.status(400);
        throw new Error('Se requieren la contraseña actual y la nueva contraseña');
    }
    if (!userId) {
        res.status(401);
        throw new Error('No autorizado');
    }
    const user = await db_1.default.user.findUnique({ where: { id: userId } });
    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado');
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        res.status(401);
        throw new Error('La contraseña actual es incorrecta');
    }
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);
    await db_1.default.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
    });
    res.json({ message: 'Contraseña actualizada con éxito' });
});
// --- NUEVOS CONTROLADORES CON TIPOS CORREGIDOS ---
// --- Controlador para obtener un perfil de usuario público por su username ---
exports.getUserProfileByUsername = (0, express_async_handler_1.default)(async (req, res) => {
    const { username } = req.params; // <-- Ahora TypeScript sabe que req.params existe
    const user = await db_1.default.user.findUnique({
        where: { username },
        select: {
            id: true,
            username: true,
            avatarUrl: true,
            bio: true,
            role: true,
            createdAt: true,
            favoritesArePublic: true,
        }
    });
    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado.');
    }
    // Obtenemos las estadísticas en paralelo
    const [favoritesCount, creationsCount, contributionsCount] = await Promise.all([
        db_1.default.favorite.count({ where: { userId: user.id } }),
        db_1.default.manga.count({ where: { uploaderId: user.id, status: 'APPROVED' } }),
        // Contamos capítulos y ediciones aprobadas
        db_1.default.chapter.count({ where: { lastEditedById: user.id, status: 'APPROVED' } })
            .then(chapterCount => db_1.default.editProposal.count({ where: { proposerId: user.id, status: 'APPROVED' } })
            .then(proposalCount => chapterCount + proposalCount))
    ]);
    res.status(200).json({
        profile: user,
        stats: {
            favorites: favoritesCount,
            creations: creationsCount,
            contributions: contributionsCount,
        }
    });
});
// --- Controlador para que un usuario actualice su propio perfil ---
// Nota: Este controlador usa AuthRequest, que ya extiende el Request correcto.
exports.updateUserProfile = (0, express_async_handler_1.default)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401);
        throw new Error('No autorizado.');
    }
    const { bio, favoritesArePublic } = req.body;
    const avatarFile = req.file?.path;
    const dataToUpdate = {
        bio: bio,
        favoritesArePublic: favoritesArePublic !== undefined ? favoritesArePublic === 'true' : undefined,
        avatarUrl: avatarFile,
    };
    Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);
    if (Object.keys(dataToUpdate).length === 0) {
        res.status(400);
        throw new Error('No se proporcionaron datos para actualizar.');
    }
    const updatedUser = await db_1.default.user.update({
        where: { id: userId },
        data: dataToUpdate,
        select: {
            id: true, username: true, email: true, role: true, avatarUrl: true, bio: true, favoritesArePublic: true, createdAt: true, updatedAt: true
        }
    });
    res.status(200).json({ message: 'Perfil actualizado con éxito.', user: updatedUser });
});
// --- Controlador para obtener los favoritos paginados de un usuario ---
exports.getUserFavorites = (0, express_async_handler_1.default)(async (req, res) => {
    const { username } = req.params;
    const { limit = '20', offset = '0' } = req.query;
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    // Buscamos al usuario para obtener su ID y verificar su configuración de privacidad
    const user = await db_1.default.user.findUnique({
        where: { username },
        select: { id: true, favoritesArePublic: true }
    });
    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado.');
    }
    // Comprobación de privacidad (muy importante)
    // TODO: Añadir lógica para que el dueño siempre pueda ver sus propios favoritos
    if (!user.favoritesArePublic) {
        res.status(403).json({ message: 'Este perfil de favoritos es privado.' });
        return;
    }
    const [favorites, total] = await Promise.all([
        db_1.default.favorite.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: limitNum,
            skip: offsetNum,
        }),
        db_1.default.favorite.count({ where: { userId: user.id } })
    ]);
    // Extraemos los IDs para devolverlos al frontend
    const comicIds = favorites.map(fav => fav.comicId);
    res.status(200).json({
        data: comicIds,
        meta: {
            total,
            offset: offsetNum,
            limit: limitNum,
            hasMore: (offsetNum + comicIds.length) < total,
        }
    });
});
// --- Controlador para obtener las creaciones paginadas de un usuario ---
exports.getUserCreations = (0, express_async_handler_1.default)(async (req, res) => {
    const { username } = req.params;
    const { limit = '20', offset = '0' } = req.query;
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    const userToView = await db_1.default.user.findUnique({
        where: { username },
        select: { id: true }
    });
    if (!userToView) {
        res.status(404);
        throw new Error('Usuario no encontrado.');
    }
    // --- LÓGICA DE VISIBILIDAD CORREGIDA CON TIPOS ---
    const isOwner = req.user?.id === userToView.id;
    // Usamos un tipo explícito para el filtro de estado
    let statusFilter;
    if (isOwner) {
        // El dueño ve todo EXCEPTO lo archivado.
        statusFilter = { notIn: [client_1.ContentStatus.ARCHIVED] };
    }
    else {
        // Otros usuarios solo ven lo APROBADO.
        statusFilter = client_1.ContentStatus.APPROVED;
    }
    // Ahora construimos la condición final
    const whereCondition = {
        uploaderId: userToView.id,
        status: statusFilter,
    };
    const [creations, total] = await Promise.all([
        db_1.default.manga.findMany({
            where: whereCondition, // <-- Usamos la condición construida
            orderBy: { createdAt: 'desc' },
            take: limitNum,
            skip: offsetNum,
        }),
        db_1.default.manga.count({
            where: whereCondition // <-- Usamos la condición construida
        })
    ]);
    res.status(200).json({
        data: creations,
        meta: {
            total,
            offset: offsetNum,
            limit: limitNum,
            hasMore: (offsetNum + creations.length) < total,
        }
    });
});
exports.getUserContributions = (0, express_async_handler_1.default)(async (req, res) => {
    const { username } = req.params;
    const { limit = '15', offset = '0' } = req.query;
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    const user = await db_1.default.user.findUnique({
        where: { username },
        select: { id: true }
    });
    if (!user) {
        res.status(404);
        throw new Error('Usuario no encontrado.');
    }
    // Obtenemos ambas listas de contribuciones en paralelo
    const [approvedChapters, approvedProposals] = await Promise.all([
        // --- CONSULTA CORREGIDA PARA CAPÍTULOS ---
        db_1.default.chapter.findMany({
            where: { lastEditedById: user.id, status: 'APPROVED' },
            select: {
                id: true,
                chapterNumber: true,
                title: true,
                updatedAt: true, // Seleccionamos el updatedAt del capítulo
                manga: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            },
        }),
        db_1.default.editProposal.findMany({
            where: { proposerId: user.id, status: 'APPROVED' },
            select: {
                id: true,
                justification: true,
                updatedAt: true, // Seleccionamos el updatedAt de la propuesta
                manga: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        })
    ]);
    // Ahora el mapeo funcionará correctamente porque 'c.manga' y 'c.updatedAt' existen
    const chapterContributions = approvedChapters.map(c => ({
        type: 'CHAPTER_ADDITION', // 'as const' es una buena práctica para tipos string literales
        id: c.id,
        mangaId: c.manga.id,
        mangaTitle: c.manga.title,
        description: `Añadió el Capítulo ${c.chapterNumber}${c.title ? `: ${c.title}` : ''}`,
        date: c.updatedAt
    }));
    const proposalContributions = approvedProposals.map(p => ({
        type: 'METADATA_EDIT',
        id: p.id,
        mangaId: p.manga.id,
        mangaTitle: p.manga.title,
        description: `Propuso una edición de metadatos. Justificación: "${p.justification.substring(0, 50)}..."`,
        date: p.updatedAt
    }));
    const allContributions = [...chapterContributions, ...proposalContributions]
        .sort((a, b) => {
        const dateA = a.date ? a.date.getTime() : 0; // Si es null, usa 0 (la fecha más antigua)
        const dateB = b.date ? b.date.getTime() : 0; // Si es null, usa 0
        return dateB - dateA; // Ordena de más reciente a más antiguo
    });
    const total = allContributions.length;
    const paginatedContributions = allContributions.slice(offsetNum, offsetNum + limitNum);
    res.status(200).json({
        data: paginatedContributions,
        meta: {
            total,
            offset: offsetNum,
            limit: limitNum,
            hasMore: (offsetNum + paginatedContributions.length) < total,
        }
    });
});
