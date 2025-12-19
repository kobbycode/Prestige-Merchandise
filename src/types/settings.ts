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
    menuItems?: {
        label: string;
        path: string;
        active: boolean;
    }[];
    updatedAt?: string;
}
