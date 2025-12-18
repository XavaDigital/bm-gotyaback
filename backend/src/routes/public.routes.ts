import { Router } from 'express';
import * as publicController from '../controllers/public.controller';

const router = Router();

// Public organizer profile
router.get('/organizers/:slug', publicController.getOrganizerProfile);

export default router;

