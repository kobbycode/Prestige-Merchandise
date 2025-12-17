export interface StoreSettings {
    facebookUrl?: string;
    whatsappNumber?: string;
    locations?: string[];
    location?: string;
    phone?: string;
    email?: string;
    businessHours?: {
        monSat?: string;
        sunday?: string;
    };
    updatedAt?: string;
}
