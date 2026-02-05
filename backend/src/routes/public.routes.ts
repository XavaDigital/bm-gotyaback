import { Router } from 'express';
import * as publicController from '../controllers/public.controller';
import { publicReadLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// Public organizer profile
router.get('/organizers/:slug', publicReadLimiter, publicController.getOrganizerProfile);

export default router;

