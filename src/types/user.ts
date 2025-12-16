export interface Address {
    id: string;
    type: 'shipping' | 'billing';
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    city: string;
    region: string;
    isDefault: boolean;
    createdAt?: any;
}

export interface UserProfile {
    uid: string;
    email: string;
    role?: 'admin' | 'super_admin' | null;
    addresses?: Address[]; // Optional embedded addresses or subcollection
    createdAt: string;
}
