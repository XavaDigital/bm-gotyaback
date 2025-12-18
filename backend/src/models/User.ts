import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    organizerProfile: {
        displayName: { type: String },
        slug: { type: String, unique: true, sparse: true },
        logoUrl: { type: String },
        coverImageUrl: { type: String },
        bio: { type: String },
        websiteUrl: { type: String },
        socialLinks: {
            facebook: String,
            twitter: String,
            instagram: String
        }
    }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);

