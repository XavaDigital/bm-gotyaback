import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import { uploadToS3 } from '../utils/s3Upload';

export const updateProfile = async (req: Request, res: Response) => {
    try {
        console.log('=== Update Profile Request ===');
        console.log('Body:', req.body);
        console.log('Files:', req.files);

        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // Parse profile data from body
        const profileData = typeof req.body.data === 'string'
            ? JSON.parse(req.body.data)
            : req.body;

        console.log('Parsed profile data:', profileData);

        // Handle file uploads
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

        if (files?.logoFile && files.logoFile[0]) {
            const file = files.logoFile[0];
            console.log('Uploading logo file:', file.originalname);
            profileData.logoUrl = await uploadToS3(
                file.buffer,
                file.originalname,
                file.mimetype,
                'organizers/logos/'
            );
            console.log('Logo uploaded to:', profileData.logoUrl);
        }

        if (files?.coverFile && files.coverFile[0]) {
            const file = files.coverFile[0];
            console.log('Uploading cover file:', file.originalname);
            profileData.coverImageUrl = await uploadToS3(
                file.buffer,
                file.originalname,
                file.mimetype,
                'organizers/covers/'
            );
            console.log('Cover uploaded to:', profileData.coverImageUrl);
        }

        console.log('Updating user profile with data:', profileData);
        const user = await userService.updateProfile(userId.toString(), profileData);
        console.log('Profile updated successfully');

        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organizerProfile: user.organizerProfile
            }
        });
    } catch (error: any) {
        console.error('Error updating profile:', error);
        res.status(400).json({ message: error.message });
    }
};
