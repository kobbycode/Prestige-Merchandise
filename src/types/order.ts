export interface StatusHistoryItem {
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    timestamp: any;
    note?: string;
}

export interface Order {
    id: string;
    userId: string;
    customerDetails: {
        firstName: string;
        lastName: string;
        email?: string;
        phone: string;
        address?: string;
        city?: string;
        region?: string;
    };
    amount: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    statusHistory?: StatusHistoryItem[];
    createdAt: any;
    items: any[];
}

