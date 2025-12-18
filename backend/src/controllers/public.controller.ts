import { Request, Response } from 'express';
import * as userService from '../services/user.service';

export const getOrganizerProfile = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const data = await userService.getPublicProfile(slug);

        res.status(200).json(data);
    } catch (error: any) {
        res.status(404).json({ message: error.message });
    }
};
