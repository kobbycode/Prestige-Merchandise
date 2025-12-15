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
    createdAt: any;
    items: any[];
}
