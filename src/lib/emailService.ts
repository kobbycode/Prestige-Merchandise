import emailjs from '@emailjs/browser';
import {
    OrderConfirmationParams,
    OrderStatusUpdateParams,
    LowStockAlertParams,
    formatOrderItems,
    formatDeliveryAddress,
    formatCustomerName
} from './emailTemplates';
import { format } from 'date-fns';

// Initialize EmailJS with public key
export const initEmailJS = () => {
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    if (!publicKey) {
        console.error('EmailJS public key not found in environment variables');
        return false;
    }
    emailjs.init(publicKey);
    return true;
};

// Send order confirmation email
export const sendOrderConfirmation = async (
    orderData: any,
    customerEmail: string,
    formatPrice?: (price: number) => string
): Promise<boolean> => {
    try {
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_ORDER_TEMPLATE_ID;

        if (!serviceId || !templateId) {
            console.error('EmailJS configuration missing for order confirmation');
            return false;
        }

        const templateParams: OrderConfirmationParams = {
            to_email: customerEmail,
            to_name: formatCustomerName(orderData.customerDetails),
            order_id: orderData.orderId,
            order_date: format(new Date(), 'PPP'),
            order_items: formatOrderItems(orderData.items, formatPrice),
            order_total: formatPrice ? formatPrice(orderData.amount) : `GH₵ ${orderData.amount.toFixed(2)}`,
            delivery_address: formatDeliveryAddress(orderData.customerDetails),
            customer_phone: orderData.customerDetails.phone,
        };

        await emailjs.send(serviceId, templateId, templateParams);
        console.log('Order confirmation email sent successfully');
        return true;
    } catch (error) {
        console.error('Error sending order confirmation email:', error);
        return false;
    }
};

// Send order status update email
export const sendOrderStatusUpdate = async (
    orderData: any,
    customerEmail: string,
    oldStatus: string,
    newStatus: string
): Promise<boolean> => {
    try {
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_STATUS_UPDATE_TEMPLATE_ID;

        if (!serviceId || !templateId) {
            console.error('EmailJS configuration missing for status update');
            return false;
        }

        const templateParams: OrderStatusUpdateParams = {
            to_email: customerEmail,
            to_name: formatCustomerName(orderData.customerDetails),
            order_id: orderData.id,
            old_status: oldStatus.charAt(0).toUpperCase() + oldStatus.slice(1),
            new_status: newStatus.charAt(0).toUpperCase() + newStatus.slice(1),
            order_date: orderData.createdAt?.seconds
                ? format(new Date(orderData.createdAt.seconds * 1000), 'PPP')
                : 'N/A',
        };

        await emailjs.send(serviceId, templateId, templateParams);
        console.log('Order status update email sent successfully');
        return true;
    } catch (error) {
        console.error('Error sending order status update email:', error);
        return false;
    }
};

// Send low stock alert email
export const sendLowStockAlert = async (
    productData: any
): Promise<boolean> => {
    try {
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_LOW_STOCK_TEMPLATE_ID;
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;

        if (!serviceId || !templateId || !adminEmail) {
            console.error('EmailJS configuration missing for low stock alert');
            return false;
        }

        const templateParams: LowStockAlertParams = {
            to_email: adminEmail,
            product_name: productData.name,
            product_id: productData.id,
            current_stock: productData.stock,
            sku: productData.sku,
        };

        await emailjs.send(serviceId, templateId, templateParams);
        console.log('Low stock alert email sent successfully');
        return true;
    } catch (error) {
        console.error('Error sending low stock alert email:', error);
        return false;
    }
};
