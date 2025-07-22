"use strict";
// src/api/comments/comments.router.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const comments_controller_1 = require("./comments.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router({ mergeParams: true });
router.route('/')
    .get(comments_controller_1.getComments)
    .post(auth_middleware_1.protect, comments_controller_1.createComment);
exports.default = router;
