import { Request, Response } from 'express';
import * as userService from '../services/user.service';

export const register = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    try {
        const user = await userService.registerUser(name, email, password);
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const user = await userService.loginUser(email, password);
        res.json(user);
    } catch (error) {
        res.status(401).json({ message: (error as Error).message });
    }
};
