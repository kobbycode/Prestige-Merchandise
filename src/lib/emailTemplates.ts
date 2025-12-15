export interface OrderConfirmationParams {
    to_email: string;
    to_name: string;
    order_id: string;
    order_date: string;
    order_items: string; // Formatted list of items
    order_total: string;
    delivery_address: string;
    customer_phone: string;
    [key: string]: unknown; // Index signature for EmailJS compatibility
}

export interface OrderStatusUpdateParams {
    to_email: string;
    to_name: string;
    order_id: string;
    old_status: string;
    new_status: string;
    order_date: string;
    [key: string]: unknown; // Index signature for EmailJS compatibility
}

export interface LowStockAlertParams {
    to_email: string;
    product_name: string;
    product_id: string;
    current_stock: number;
    sku: string;
    [key: string]: unknown; // Index signature for EmailJS compatibility
}

// Helper function to format order items for email
export const formatOrderItems = (items: any[]): string => {
    return items.map((item, index) =>
        `${index + 1}. ${item.name}${item.variant ? ` (${item.variant})` : ''} - Qty: ${item.quantity} - GH₵ ${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');
};

// Helper function to format delivery address
export const formatDeliveryAddress = (customerDetails: any): string => {
    return `${customerDetails.address}, ${customerDetails.city}, ${customerDetails.region}`;
};

// Helper function to format customer name
export const formatCustomerName = (customerDetails: any): string => {
    return `${customerDetails.firstName} ${customerDetails.lastName}`;
};
