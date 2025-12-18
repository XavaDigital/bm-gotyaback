import { Router } from 'express';
import multer from 'multer';
import * as userController from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Configure multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'));
        }
        cb(null, true);
    },
});

// Protected routes (require authentication)
router.put(
    '/profile',
    protect,
    upload.fields([
        { name: 'logoFile', maxCount: 1 },
        { name: 'coverFile', maxCount: 1 }
    ]),
    userController.updateProfile
);

export default router;

