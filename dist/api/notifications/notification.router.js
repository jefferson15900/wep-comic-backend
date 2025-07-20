"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/api/notifications/notification.router.ts
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const notification_controller_1 = require("./notification.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect); // Todas las rutas aquí requieren inicio de sesión
router.get('/', notification_controller_1.getNotifications);
router.post('/read', notification_controller_1.markAsRead);
exports.default = router;
