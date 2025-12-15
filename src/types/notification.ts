import { Timestamp } from 'firebase/firestore';

export type NotificationType = 'order_status' | 'new_order' | 'low_stock' | 'info';

export interface Notification {
    id: string;
    userId: string; // The recipient's user ID
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    createdAt: Timestamp;
    data?: any; // Additional data like orderId, productId, etc.
    link?: string; // Optional URL to redirect to
}
