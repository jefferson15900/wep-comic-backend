"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/api/comments/comments.router.ts
const express_1 = __importDefault(require("express"));
const comments_controller_1 = require("./comments.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const moderator_middleware_1 = require("../middleware/moderator.middleware");
const router = express_1.default.Router({ mergeParams: true });
router.route('/').get(comments_controller_1.getComments).post(auth_middleware_1.protect, comments_controller_1.createComment);
router.delete('/:commentId', auth_middleware_1.protect, moderator_middleware_1.moderatorOrAdminOnly, comments_controller_1.deleteComment);
exports.default = router;
