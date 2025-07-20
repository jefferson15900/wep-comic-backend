"use strict";
// src/api/community/community.controller.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.archiveManga = exports.proposeMangaEdit = exports.replaceChapterPages = exports.editChapterMetadata = exports.editMangaMetadata = exports.addChapterToManga = exports.createManga = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const db_1 = __importDefault(require("../../db"));
const client_1 = require("@prisma/client");
// --- Controlador para crear un nuevo Manga ---
exports.createManga = (0, express_async_handler_1.default)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401);
        throw new Error('No autorizado. Se requiere inicio de sesión.');
    }
    const { title, author, synopsis, contentRating, originalLanguage } = req.body;
    if (!title || !author || !synopsis) {
        res.status(400);
        throw new Error('Los campos título, autor y sinopsis son requeridos.');
    }
    const coverUrl = req.file?.path;
    if (!coverUrl) {
        res.status(400);
        throw new Error('La imagen de portada es requerida.');
    }
    const rating = Object.values(client_1.ContentRating).includes(contentRating) ? contentRating : client_1.ContentRating.SFW;
    const newManga = await db_1.default.manga.create({
        data: {
            title,
            author,
            synopsis,
            coverUrl,
            uploaderId: userId,
            status: 'PENDING',
            contentRating: contentRating === 'NSFW' ? 'NSFW' : 'SFW',
            originalLanguage: originalLanguage || 'es',
        },
        select: {
            id: true,
            title: true,
            author: true,
            synopsis: true,
            coverUrl: true,
            status: true,
            uploader: { select: { username: true } },
            createdAt: true,
        },
    });
    res.status(201).json({
        message: 'Manga creado con éxito y enviado para revisión.',
        manga: newManga,
    });
});
// --- Controlador para añadir un nuevo capítulo a un Manga ---
exports.addChapterToManga = (0, express_async_handler_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { mangaId } = req.params;
    const { chapterNumber, title, language, justification } = req.body;
    // 1. Validaciones iniciales
    if (!userId) {
        res.status(401);
        throw new Error('No autorizado.');
    }
    if (!chapterNumber) {
        res.status(400);
        throw new Error('El número de capítulo es requerido.');
    }
    const pages = req.files;
    if (!pages || pages.length === 0) {
        res.status(400);
        throw new Error('Se requiere al menos una página para el capítulo.');
    }
    const parsedChapterNumber = parseFloat(chapterNumber);
    if (isNaN(parsedChapterNumber)) {
        res.status(400);
        throw new Error('El número de capítulo debe ser un número válido.');
    }
    // 2. Verificamos que el manga exista
    const mangaExists = await db_1.default.manga.findUnique({
        where: { id: mangaId },
        select: { id: true } // Solo necesitamos saber que existe
    });
    if (!mangaExists) {
        res.status(404);
        throw new Error('Manga no encontrado.');
    }
    // 3. Usamos una transacción para actualizar el manga y crear el capítulo de forma atómica
    const [, newChapter] = await db_1.default.$transaction([
        // Operación 1: Actualizar el manga para registrar la edición (SIN cambiar status)
        db_1.default.manga.update({
            where: { id: mangaId },
            data: {
                lastEditedById: userId, // Registramos quién hizo la última contribución
                updatedAt: new Date(), // Forzamos la actualización de la fecha
            }
        }),
        // Operación 2: Crear el nuevo capítulo con estado PENDING
        db_1.default.chapter.create({
            data: {
                chapterNumber: parsedChapterNumber,
                title,
                justification,
                language: language || 'es',
                status: 'PENDING', // El capítulo en sí es el que está pendiente
                mangaId: mangaId,
                lastEditedById: userId,
                pages: {
                    create: pages.map((file, index) => ({
                        pageNumber: index + 1,
                        imageUrl: file.path,
                    })),
                },
            },
            // Seleccionamos los datos del capítulo que queremos devolver
            select: {
                id: true,
                chapterNumber: true,
                title: true,
                status: true,
                pages: {
                    select: { pageNumber: true, imageUrl: true },
                    orderBy: { pageNumber: 'asc' },
                },
            },
        })
    ]);
    // 4. Devolvemos una respuesta de éxito con los datos del nuevo capítulo
    res.status(201).json({
        message: 'Capítulo añadido con éxito y enviado para revisión.',
        chapter: newChapter,
    });
});
// --- Controlador para editar los metadatos de un Manga ---
exports.editMangaMetadata = (0, express_async_handler_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { mangaId } = req.params;
    const { title, author, synopsis } = req.body;
    if (!userId) {
        res.status(401);
        throw new Error('No autorizado.');
    }
    const newCoverUrl = req.file?.path;
    const updatedManga = await db_1.default.manga.update({
        where: { id: mangaId },
        data: {
            title,
            author,
            synopsis,
            coverUrl: newCoverUrl,
            status: 'PENDING',
            lastEditedById: userId,
        },
        select: {
            id: true,
            title: true,
            author: true,
            synopsis: true,
            coverUrl: true,
            status: true,
            lastEditedBy: { select: { username: true } },
        }
    });
    res.status(200).json({
        message: 'Manga actualizado y enviado para revisión.',
        manga: updatedManga,
    });
});
// --- Controlador para editar los metadatos de un Capítulo ---
exports.editChapterMetadata = (0, express_async_handler_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { chapterId } = req.params;
    const { chapterNumber, title, language } = req.body;
    if (!userId) {
        res.status(401);
        throw new Error('No autorizado.');
    }
    // Preparamos el objeto de datos que se va a actualizar
    const dataToUpdate = {
        status: 'PENDING',
        lastEditedById: userId,
    };
    // Si se proporciona un nuevo número de capítulo, lo procesamos
    if (chapterNumber !== undefined) {
        const parsedChapterNumber = parseFloat(chapterNumber);
        if (isNaN(parsedChapterNumber)) {
            res.status(400);
            throw new Error('El número de capítulo debe ser un número válido.');
        }
        dataToUpdate.chapterNumber = parsedChapterNumber;
    }
    // Añadimos los otros campos si se proporcionan
    if (title !== undefined)
        dataToUpdate.title = title;
    if (language !== undefined)
        dataToUpdate.language = language;
    const updatedChapter = await db_1.default.chapter.update({
        where: { id: chapterId },
        data: dataToUpdate, // Usamos nuestro objeto de datos preparado
        select: {
            id: true,
            chapterNumber: true,
            title: true,
            language: true,
            status: true,
        }
    });
    res.status(200).json({
        message: 'Capítulo actualizado y enviado para revisión.',
        chapter: updatedChapter,
    });
});
// --- Controlador para reemplazar TODAS las páginas de un Capítulo ---
exports.replaceChapterPages = (0, express_async_handler_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const { chapterId } = req.params;
    if (!userId) {
        res.status(401);
        throw new Error('No autorizado.');
    }
    const pages = req.files;
    if (!pages || pages.length === 0) {
        res.status(400);
        throw new Error('Se requiere al menos una página para reemplazar el contenido.');
    }
    const deleteOldPages = db_1.default.page.deleteMany({
        where: { chapterId: chapterId },
    });
    const updateChapterWithNewPages = db_1.default.chapter.update({
        where: { id: chapterId },
        data: {
            status: 'PENDING',
            lastEditedById: userId,
            pages: {
                create: pages.map((file, index) => ({
                    pageNumber: index + 1,
                    imageUrl: file.path,
                })),
            },
        },
        select: {
            id: true,
            status: true,
            pages: {
                select: { pageNumber: true, imageUrl: true },
                orderBy: { pageNumber: 'asc' },
            }
        }
    });
    const [, updatedChapter] = await db_1.default.$transaction([
        deleteOldPages,
        updateChapterWithNewPages,
    ]);
    res.status(200).json({
        message: 'Páginas del capítulo reemplazadas y enviadas para revisión.',
        chapter: updatedChapter,
    });
});
// --- Controlador para proponer una edición a un Manga ---
exports.proposeMangaEdit = (0, express_async_handler_1.default)(async (req, res) => {
    const { mangaId } = req.params;
    const proposerId = req.user?.id;
    if (!proposerId) {
        res.status(401);
        throw new Error('No autorizado. Se requiere inicio de sesión.');
    }
    // --- ¡NUEVA VALIDACIÓN! ---
    // Antes de hacer nada, buscamos si este usuario ya tiene una propuesta PENDIENTE para este manga.
    const existingPendingProposal = await db_1.default.editProposal.findFirst({
        where: {
            mangaId: mangaId,
            proposerId: proposerId,
            status: 'PENDING', // La clave: solo nos importan las que aún no han sido revisadas.
        }
    });
    // Si se encuentra una propuesta pendiente, devolvemos un error de conflicto (409).
    if (existingPendingProposal) {
        res.status(409); // 409 Conflict
        throw new Error('Ya tienes una propuesta de edición pendiente para este manga. Por favor, espera a que sea revisada.');
    }
    // --- FIN DE LA VALIDACIÓN ---
    // El resto de tu lógica original no cambia.
    const { title, author, synopsis, justification } = req.body;
    const newCoverUrl = req.file?.path;
    if (!justification) {
        res.status(400);
        throw new Error('Se requiere una justificación para proponer una edición.');
    }
    if (!title && !author && !synopsis && !newCoverUrl) {
        res.status(400);
        throw new Error('Debes proponer al menos un cambio.');
    }
    const newProposal = await db_1.default.editProposal.create({
        data: {
            mangaId,
            proposerId,
            justification,
            title: title || undefined,
            author: author || undefined,
            synopsis: synopsis || undefined,
            coverUrl: newCoverUrl || undefined,
            status: 'PENDING',
        }
    });
    res.status(201).json({
        message: 'Propuesta de edición enviada con éxito para revisión.',
        proposal: newProposal,
    });
});
exports.archiveManga = (0, express_async_handler_1.default)(async (req, res) => {
    const { mangaId } = req.params;
    const userId = req.user.id;
    // 1. Verificamos que el manga exista y que el usuario sea el dueño.
    //    También obtenemos su 'status' actual.
    const manga = await db_1.default.manga.findFirst({
        where: {
            id: mangaId,
            uploaderId: userId,
        },
        select: {
            status: true // Solo necesitamos el estado para tomar la decisión
        }
    });
    if (!manga) {
        res.status(403);
        throw new Error('Manga no encontrado o no tienes permiso para esta acción.');
    }
    // 2. --- ¡NUEVA LÓGICA CONDICIONAL! ---
    // Si el manga ya fue RECHAZADO por un moderador, lo eliminamos permanentemente.
    if (manga.status === 'REJECTED') {
        console.log(`Manga rechazado (ID: ${mangaId}) está siendo eliminado permanentemente por el uploader.`);
        await db_1.default.manga.delete({
            where: {
                id: mangaId,
            }
        });
    }
    else {
        // Para cualquier otro estado (PENDING o APPROVED), lo movemos a ARCHIVED (soft delete).
        console.log(`Manga (ID: ${mangaId}) está siendo archivado por el uploader.`);
        await db_1.default.manga.update({
            where: {
                id: mangaId,
            },
            data: {
                status: 'ARCHIVED'
            }
        });
    }
    // 3. Respondemos con éxito en ambos casos.
    res.status(204).send();
});
