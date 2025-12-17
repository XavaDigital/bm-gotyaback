import mongoose from 'mongoose';

const shirtLayoutSchema = new mongoose.Schema({
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
    rows: { type: Number, required: true },
    columns: { type: Number, required: true },
    placements: [{
        positionId: String,
        price: Number,
        isTaken: { type: Boolean, default: false }
    }]
});

export const ShirtLayout = mongoose.model('ShirtLayout', shirtLayoutSchema);
