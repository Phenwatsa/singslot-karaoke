import { Router } from 'express';
import { Role } from '@prisma/client';
import { verifyToken, requireRole } from '../middlewares/auth';
import {
  getRoomBlocks,
  createRoomBlocks,
  deleteRoomBlock
} from '../controllers/roomBlock.controller';

export const roomBlockRouter = Router();

/**
 * All RoomBlock maintenance endpoints are strictly restricted to STAFF role (FR-08, BR-08, BR-10).
 */
roomBlockRouter.get('/', verifyToken, requireRole(Role.STAFF), getRoomBlocks);
roomBlockRouter.post('/', verifyToken, requireRole(Role.STAFF), createRoomBlocks);
roomBlockRouter.delete('/:id', verifyToken, requireRole(Role.STAFF), deleteRoomBlock);
