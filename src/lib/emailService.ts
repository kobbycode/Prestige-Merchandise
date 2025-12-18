import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { format } from "date-fns";

// HELPER FUNCTIONS (Moved from emailTemplates.ts)
const formatOrderItems = (items: any[], formatPrice?: (price: number) => string): string => {
    const formatFn = formatPrice || ((p: number) => `GH₵ ${p.toFixed(2)}`);
    return items.map((item, index) =>
        `${index + 1}. ${item.name}${item.variant ? ` (${item.variant})` : ''} - Qty: ${item.quantity} - ${formatFn(item.price * item.quantity)}`
    ).join('\n');
};

const formatDeliveryAddress = (customerDetails: any): string => {
    return `${customerDetails.address}, ${customerDetails.city}, ${customerDetails.region}`;
};

const formatCustomerName = (customerDetails: any): string => {
    return `${customerDetails.firstName} ${customerDetails.lastName}`;
};

// Initialize EmailJS (NO-OP for backward compatibility, will be removed later)
export const initEmailJS = () => {
    return true;
};

// Send order confirmation email via Firebase Extension
export const sendOrderConfirmation = async (
    orderData: any,
    customerEmail: string,
    formatPrice?: (price: number) => string
): Promise<boolean> => {
    try {
        const orderId = orderData.orderId || orderData.id;
        const totalStr = formatPrice ? formatPrice(orderData.amount) : `GH₵ ${orderData.amount.toFixed(2)}`;

        await addDoc(collection(db, "mail"), {
            to: customerEmail,
            message: {
                subject: `Order Confirmation - #${orderId.slice(0, 8).toUpperCase()}`,
                text: `Hello ${formatCustomerName(orderData.customerDetails)},\n\nThank you for your order! We've received it and are processing it now.\n\nOrder ID: ${orderId}\nDate: ${format(new Date(), 'PPP')}\n\nItems:\n${formatOrderItems(orderData.items, formatPrice)}\n\nTotal: ${totalStr}\n\nDelivery Address:\n${formatDeliveryAddress(orderData.customerDetails)}\n\nWe will notify you when your order status changes.\n\nBest regards,\nPrestige Merchandise`,
                html: `
                    <h1>Thank you for your order!</h1>
                    <p>Hello ${formatCustomerName(orderData.customerDetails)},</p>
                    <p>We've received your order and are processing it now.</p>
                    <hr />
                    <p><strong>Order ID:</strong> ${orderId}</p>
                    <p><strong>Date:</strong> ${format(new Date(), 'PPP')}</p>
                    <h3>Order Summary</h3>
                    <pre>${formatOrderItems(orderData.items, formatPrice)}</pre>
                    <p><strong>Total:</strong> ${totalStr}</p>
                    <hr />
                    <p><strong>Delivery Address:</strong><br />${formatDeliveryAddress(orderData.customerDetails)}</p>
                    <p>We will notify you when your order status changes.</p>
                    <br />
                    <p>Best regards,<br />Prestige Merchandise</p>
                `
            }
        });

        console.log('Order confirmation logged to [mail] collection');
        return true;
    } catch (error) {
        console.error('Error logging order confirmation email:', error);
        return false;
    }
};

// Send order status update email via Firebase Extension
export const sendOrderStatusUpdate = async (
    orderData: any,
    customerEmail: string,
    oldStatus: string,
    newStatus: string
): Promise<boolean> => {
    try {
        const orderId = orderData.id;
        const trackingInfo = orderData.trackingNumber ?
            `\nTracking Carrier: ${orderData.trackingCarrier}\nTracking Number: ${orderData.trackingNumber}\nTrack here: ${orderData.trackingUrl || 'N/A'}` : '';

        const trackingHtml = orderData.trackingNumber ? `
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Tracking Information</h3>
                <p><strong>Carrier:</strong> ${orderData.trackingCarrier}</p>
                <p><strong>Number:</strong> ${orderData.trackingNumber}</p>
                ${orderData.trackingUrl ? `<a href="${orderData.trackingUrl}" style="background-color: #facc15; padding: 10px 20px; text-decoration: none; color: black; border-radius: 5px; font-weight: bold; display: inline-block;">Track Shipment</a>` : ''}
            </div>` : '';

        await addDoc(collection(db, "mail"), {
            to: customerEmail,
            message: {
                subject: `Order Update - #${orderId.slice(0, 8).toUpperCase()}: ${newStatus.toUpperCase()}`,
                text: `Hello ${formatCustomerName(orderData.customerDetails)},\n\nYour order status has been updated from ${oldStatus} to ${newStatus}.\n\nOrder ID: ${orderId}${trackingInfo}\n\nYou can track your order live here: ${window.location.origin}/track?orderId=${orderId}\n\nBest regards,\nPrestige Merchandise`,
                html: `
                    <h2>Order Status Update</h2>
                    <p>Hello ${formatCustomerName(orderData.customerDetails)},</p>
                    <p>Your order status has been updated from <strong>${oldStatus}</strong> to <strong>${newStatus}</strong>.</p>
                    ${trackingHtml}
                    <p>Order ID: <code>${orderId}</code></p>
                    <p><a href="${window.location.origin}/track?orderId=${orderId}" style="color: #facc15; font-weight: bold;">Track your order real-time on our website</a></p>
                    <br />
                    <p>Best regards,<br />Prestige Merchandise</p>
                `
            }
        });

        console.log('Order status update logged to [mail] collection');
        return true;
    } catch (error) {
        console.error('Error logging order status update email:', error);
        return false;
    }
};

// Send low stock alert email via Firebase Extension
export const sendLowStockAlert = async (
    productData: any
): Promise<boolean> => {
    try {
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
        if (!adminEmail) return false;

        await addDoc(collection(db, "mail"), {
            to: adminEmail,
            message: {
                subject: `LOW STOCK ALERT: ${productData.name}`,
                text: `Product: ${productData.name}\nSKU: ${productData.sku}\nCurrent Stock: ${productData.stock}\nID: ${productData.id}`,
                html: `
                    <h2 style="color: #dc2626;">Low Stock Alert</h2>
                    <p>The following product is low on stock:</p>
                    <ul>
                        <li><strong>Product:</strong> ${productData.name}</li>
                        <li><strong>SKU:</strong> ${productData.sku}</li>
                        <li><strong>Current Stock:</strong> ${productData.stock}</li>
                        <li><strong>ID:</strong> ${productData.id}</li>
                    </ul>
                    <p><a href="${window.location.origin}/admin/products">Go to Inventory</a></p>
                `
            }
        });

        console.log('Low stock alert logged to [mail] collection');
        return true;
    } catch (error) {
        console.error('Error logging low stock alert email:', error);
        return false;
    }
};

