// src/api/comments/comments.router.ts
import express from 'express';
import { getComments, createComment, deleteComment } from './comments.controller';
import { protect } from '../middleware/auth.middleware';
import { moderatorOrAdminOnly } from '../middleware/moderator.middleware';

const router = express.Router({ mergeParams: true });

router.route('/').get(getComments).post(protect, createComment);
router.delete('/:commentId', protect, moderatorOrAdminOnly, deleteComment);
export default router;