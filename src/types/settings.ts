export interface StoreSettings {
    facebookUrl?: string;
    whatsappNumber?: string;
    location?: string;
    phone?: string;
    email?: string;
    businessHours?: {
        monSat?: string;
        sunday?: string;
    };
    updatedAt?: string;
}
