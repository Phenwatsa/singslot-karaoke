import { Router } from 'express';
import { getRooms } from '../controllers/room.controller';

export const roomRouter = Router();

roomRouter.get('/', getRooms);
