import { Router } from 'express';
import { getAvailability } from '../controllers/availability.controller';

export const availabilityRouter = Router();

availabilityRouter.get('/', getAvailability);
