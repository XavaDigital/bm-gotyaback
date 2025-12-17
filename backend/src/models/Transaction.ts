import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    sponsorEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'SponsorEntry', required: true },
    provider: { type: String, enum: ['stripe', 'manual'], required: true },
    providerRef: { type: String },
    status: { type: String, enum: ['success', 'failed'], required: true },
    amount: { type: Number, required: true },
}, { timestamps: true });

export const Transaction = mongoose.model('Transaction', transactionSchema);
