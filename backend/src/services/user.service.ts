import { User } from '../models/User';
import { Campaign } from '../models/Campaign';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const registerUser = async (name: string, email: string, password: string) => {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new Error('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
        name,
        email,
        passwordHash,
    });

    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizerProfile: user.organizerProfile,
        token: generateToken(user._id.toString()),
    };
};

export const loginUser = async (email: string, password: string) => {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
        return {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            organizerProfile: user.organizerProfile,
            token: generateToken(user._id.toString()),
        };
    } else {
        throw new Error('Invalid credentials');
    }
};

export const updateProfile = async (userId: string, profileData: any) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    // Check if slug is being changed and if it's already taken
    if (profileData.slug && profileData.slug !== user.organizerProfile?.slug) {
        const existingSlug = await User.findOne({ 'organizerProfile.slug': profileData.slug });
        if (existingSlug) {
            throw new Error('Slug already taken');
        }
    }

    user.organizerProfile = {
        ...user.organizerProfile,
        ...profileData
    };

    await user.save();
    return user;
};

export const getPublicProfile = async (slug: string) => {
    const user = await User.findOne({ 'organizerProfile.slug': slug });
    if (!user) {
        throw new Error('Organizer not found');
    }

    const now = new Date();
    const activeCampaigns = await Campaign.find({
        ownerId: user._id,
        isClosed: false,
        $or: [
            { endDate: { $gt: now } },
            { endDate: null }
        ]
    });

    return {
        profile: user.organizerProfile,
        campaigns: activeCampaigns
    };
};

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET as string, {
        expiresIn: '30d',
    });
};
