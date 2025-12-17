export interface User {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
}

export interface Campaign {
    _id: string;
    ownerId: string | User;
    title: string;
    slug: string;
    description?: string;
    garmentType: 'singlet' | 'tshirt' | 'hoodie';
    campaignType: 'fixed' | 'placement' | 'donation';
    currency: 'NZD' | 'AUD' | 'USD';
    startDate?: Date | string;
    endDate?: Date | string;
    isClosed: boolean;
    allowOfflinePayments: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface Position {
    positionId: string;
    price: number;
    isTaken: boolean;
}

export interface ShirtLayout {
    _id: string;
    campaignId: string;
    rows: number;
    columns: number;
    placements: Position[];
}

export interface SponsorEntry {
    _id: string;
    campaignId: string;
    positionId?: string;
    name: string;
    message?: string;
    amount: number;
    paymentMethod: 'card' | 'cash';
    paymentStatus: 'pending' | 'paid' | 'failed';
    createdAt: Date | string;
}

// Request types for API calls
export interface CreateCampaignRequest {
    title: string;
    description?: string;
    garmentType: 'singlet' | 'tshirt' | 'hoodie';
    campaignType: 'fixed' | 'placement' | 'donation';
    currency?: 'NZD' | 'AUD' | 'USD';
    startDate?: Date | string;
    endDate?: Date | string;
    allowOfflinePayments?: boolean;
}

export interface CreateLayoutRequest {
    rows: number;
    columns: number;
    pricing: {
        fixedPrice?: number;
        zonePricing?: {
            top?: number;
            middle?: number;
            bottom?: number;
        };
    };
}

export interface CreateSponsorshipRequest {
    positionId?: string;
    name: string;
    message?: string;
    amount: number;
    paymentMethod: 'card' | 'cash';
}

export interface UpdateCampaignRequest {
    title?: string;
    description?: string;
    endDate?: Date | string;
    allowOfflinePayments?: boolean;
}
