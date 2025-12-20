export interface StoreLocation {
    id: string;
    name: string;
    address: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
}

export interface StoreSettings {
    facebookUrl?: string;
    whatsappNumber?: string;
    locations?: string[];
    storeLocations?: StoreLocation[];
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
