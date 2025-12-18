import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    garmentType: { type: String, enum: ['singlet', 'tshirt', 'hoodie'], required: true },
    campaignType: { type: String, enum: ['fixed', 'placement', 'donation'], required: true },
    currency: { type: String, enum: ['NZD', 'AUD', 'USD'], default: 'NZD' },
    startDate: { type: Date },
    endDate: { type: Date },
    isClosed: { type: Boolean, default: false },
    enableStripePayments: { type: Boolean, default: false },
    allowOfflinePayments: { type: Boolean, default: true },
}, { timestamps: true });

export const Campaign = mongoose.model('Campaign', campaignSchema);
